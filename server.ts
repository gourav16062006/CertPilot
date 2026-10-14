import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Body parser with 50mb limit to handle certificate image base64 data URLs in bulk
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Helper to parse cookies without external dependencies
function parseCookies(req: express.Request): Record<string, string> {
  const list: Record<string, string> = {};
  const rc = req.headers.cookie;
  if (!rc) return list;
  rc.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const key = parts.shift()?.trim();
    if (key) {
      list[key] = decodeURIComponent(parts.join("="));
    }
  });
  return list;
}

// Helper to resolve user session ID
function getSessionId(req: express.Request): string {
  const headerId = req.headers["x-session-id"] as string;
  if (headerId && headerId.trim()) return headerId.trim();
  const cookies = parseCookies(req);
  const cookieId = cookies["certpilot_session"] || cookies["wimailer_session"];
  if (cookieId && cookieId.trim()) return cookieId.trim();
  const queryId = req.query.sessionId as string;
  if (queryId && queryId.trim()) return queryId.trim();
  if (req.body && req.body.sessionId) return String(req.body.sessionId).trim();
  return "";
}

// ==========================================
// 1. GOOGLE OAUTH 2.0 & GMAIL CONFIGURATION
// ==========================================

interface GmailSession {
  sessionId: string;
  email: string;
  name?: string;
  picture?: string;
  tokens: {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
  };
  connectedAt: string;
}

// In-memory server-side session store (tokens are NEVER exposed to browser or localStorage)
const gmailSessions = new Map<string, GmailSession>();

// In-memory OAuth CSRF states
interface OAuthStateData {
  sessionId: string;
  createdAt: number;
  redirectUri: string;
}
const oauthStates = new Map<string, OAuthStateData>();

// In-memory runtime OAuth configuration (can augment or override .env)
let runtimeOAuthConfig: {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
} = {};

function getOAuthConfig() {
  const clientId = (process.env.GOOGLE_CLIENT_ID || runtimeOAuthConfig.clientId || "").trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || runtimeOAuthConfig.clientSecret || "").trim();
  const redirectUri = (process.env.GOOGLE_REDIRECT_URI || runtimeOAuthConfig.redirectUri || "").trim();
  return {
    clientId,
    clientSecret,
    redirectUri,
    isConfigured: Boolean(clientId && clientSecret),
  };
}

// Ensure access token is valid, refreshing with refresh_token if needed
async function getValidAccessToken(session: GmailSession): Promise<string> {
  const now = Date.now();
  // If token is still valid with 60s safety buffer, reuse it
  if (session.tokens.expiry_date && now < session.tokens.expiry_date - 60000) {
    return session.tokens.access_token;
  }

  // If no refresh token available, fallback to current access token
  if (!session.tokens.refresh_token) {
    return session.tokens.access_token;
  }

  // Perform token refresh on Google token endpoint
  const { clientId, clientSecret } = getOAuthConfig();
  if (!clientId || !clientSecret) {
    return session.tokens.access_token;
  }

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: session.tokens.refresh_token,
      grant_type: "refresh_token",
    });

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await res.json();
    if (res.ok && data.access_token) {
      session.tokens.access_token = data.access_token;
      session.tokens.expiry_date = Date.now() + (data.expires_in || 3600) * 1000;
      return data.access_token;
    } else {
      console.warn("Could not refresh token automatically, attempting with existing access token.");
      return session.tokens.access_token;
    }
  } catch (err) {
    console.error("Token refresh network failure:", err);
    return session.tokens.access_token;
  }
}

// Build RFC 2822 standard multipart/mixed message with attachments for Gmail API
function buildMimeMessage({
  from,
  to,
  subject,
  text,
  html,
  attachment,
}: {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachment?: {
    filename: string;
    contentType: string;
    base64Data: string;
  };
}): string {
  const boundary = `====_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const altBoundary = `====_Alt_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  // Subject encoding according to RFC 2047
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject || "Certificate").toString("base64")}?=`;

  const headers: string[] = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
  ];

  if (attachment) {
    headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    const parts: string[] = [];

    // Body container (alternative text + html)
    let bodyContainer = `--${boundary}\r\nContent-Type: multipart/alternative; boundary="${altBoundary}"\r\n\r\n`;
    if (text) {
      bodyContainer += `--${altBoundary}\r\nContent-Type: text/plain; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(
        text
      ).toString("base64")}\r\n\r\n`;
    }
    if (html) {
      bodyContainer += `--${altBoundary}\r\nContent-Type: text/html; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(
        html
      ).toString("base64")}\r\n\r\n`;
    }
    bodyContainer += `--${altBoundary}--\r\n`;
    parts.push(bodyContainer);

    // Attachment part
    const sanitizedFilename = attachment.filename.replace(/["\r\n]/g, "");
    let attachmentPart = `--${boundary}\r\n`;
    attachmentPart += `Content-Type: ${attachment.contentType}; name="${sanitizedFilename}"\r\n`;
    attachmentPart += `Content-Disposition: attachment; filename="${sanitizedFilename}"\r\n`;
    attachmentPart += `Content-Transfer-Encoding: base64\r\n\r\n`;
    const cleanedBase64 = attachment.base64Data.replace(/(\r\n|\n|\r)/gm, "");
    const wrappedBase64 = cleanedBase64.match(/.{1,76}/g)?.join("\r\n") || cleanedBase64;
    attachmentPart += `${wrappedBase64}\r\n\r\n--${boundary}--`;
    parts.push(attachmentPart);

    return headers.join("\r\n") + "\r\n\r\n" + parts.join("\r\n");
  } else {
    // Simple text / HTML email
    headers.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
    let body = "";
    if (text) {
      body += `--${altBoundary}\r\nContent-Type: text/plain; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(
        text
      ).toString("base64")}\r\n\r\n`;
    }
    if (html) {
      body += `--${altBoundary}\r\nContent-Type: text/html; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(
        html
      ).toString("base64")}\r\n\r\n`;
    }
    body += `--${altBoundary}--`;
    return headers.join("\r\n") + "\r\n\r\n" + body;
  }
}

// Send message through Gmail REST API
async function sendGmailMessage(accessToken: string, rawBase64Url: string) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: rawBase64Url }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const msg = errorData?.error?.message || `HTTP ${response.status} from Gmail API`;
    if (response.status === 429 || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate limit")) {
      throw new Error(`Gmail API rate limit or daily sending quota reached. Please wait and retry.`);
    }
    if (response.status === 401) {
      throw new Error("Gmail authorization has expired. Please reconnect your Gmail account.");
    }
    throw new Error(`Gmail API sending failed: ${msg}`);
  }

  const data = (await response.json()) as { id: string; threadId?: string };
  return data;
}

// ==========================================
// 2. OAUTH ENDPOINTS
// ==========================================

// Get OAuth config & status
app.get("/api/auth/google/config", (req, res) => {
  const { clientId, isConfigured } = getOAuthConfig();
  const defaultCallback = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
  const effectiveRedirect = process.env.GOOGLE_REDIRECT_URI || runtimeOAuthConfig.redirectUri || defaultCallback;

  res.json({
    configured: isConfigured,
    clientIdPreview: clientId ? `${clientId.substring(0, 10)}...${clientId.substring(Math.max(0, clientId.length - 8))}` : null,
    redirectUri: effectiveRedirect,
    defaultCallbackUrl: defaultCallback,
  });
});

// Configure OAuth credentials at runtime (in-memory for current session)
app.post("/api/auth/google/configure", (req, res) => {
  const { clientId, clientSecret, redirectUri } = req.body;
  if (!clientId || !clientSecret) {
    return res.status(400).json({ success: false, error: "Client ID and Client Secret are required." });
  }

  runtimeOAuthConfig = {
    clientId: String(clientId).trim(),
    clientSecret: String(clientSecret).trim(),
    redirectUri: redirectUri ? String(redirectUri).trim() : undefined,
  };

  const defaultCallback = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
  return res.json({
    success: true,
    message: "Google OAuth credentials updated for current server runtime.",
    redirectUri: runtimeOAuthConfig.redirectUri || defaultCallback,
  });
});

// Start Google OAuth flow: Generate state and auth URL
app.get("/api/auth/google/url", (req, res) => {
  const { clientId, clientSecret, isConfigured } = getOAuthConfig();
  const defaultCallback = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;

  if (!isConfigured) {
    return res.status(400).json({
      success: false,
      unconfigured: true,
      error: "Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) have not been configured yet.",
      defaultCallbackUrl: defaultCallback,
    });
  }

  const sessionId = getSessionId(req) || `sess_${crypto.randomBytes(12).toString("hex")}`;
  const effectiveRedirect = process.env.GOOGLE_REDIRECT_URI || runtimeOAuthConfig.redirectUri || defaultCallback;

  // Clean expired states (> 15 minutes)
  const now = Date.now();
  for (const [key, val] of oauthStates.entries()) {
    if (now - val.createdAt > 15 * 60 * 1000) {
      oauthStates.delete(key);
    }
  }

  const state = crypto.randomBytes(24).toString("hex");
  oauthStates.set(state, {
    sessionId,
    createdAt: now,
    redirectUri: effectiveRedirect,
  });

  const scope = "https://www.googleapis.com/auth/gmail.send email profile openid";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: effectiveRedirect,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return res.json({
    success: true,
    url: authUrl,
    state,
    sessionId,
  });
});

// OAuth 2.0 Authorization Callback
app.get("/api/auth/google/callback", async (req, res) => {
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };

  const renderResultHtml = ({
    success,
    email,
    name,
    message,
  }: {
    success: boolean;
    email?: string;
    name?: string;
    message: string;
  }) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CertPilot — Google Account Connection</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #0f172a; }
    .card { background: white; padding: 2.5rem; border-radius: 1.25rem; box-shadow: 0 15px 30px -10px rgba(0,0,0,0.1); max-width: 420px; width: 90%; text-align: center; border: 1px solid #e2e8f0; }
    .icon { width: 56px; height: 56px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; }
    .icon.success { background: #dcfce7; color: #16a34a; }
    .icon.error { background: #fee2e2; color: #dc2626; }
    h1 { font-size: 1.25rem; margin: 0 0 0.5rem; font-weight: 700; }
    p { font-size: 0.875rem; color: #64748b; margin: 0 0 1.25rem; line-height: 1.5; }
    .badge { background: #eff6ff; color: #1d4ed8; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.875rem; display: inline-block; margin-bottom: 1.25rem; border: 1px solid #dbeafe; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 0.65rem 1.5rem; border-radius: 0.75rem; text-decoration: none; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; }
    .btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon ${success ? "success" : "error"}">
      ${
        success
          ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'
          : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
      }
    </div>
    <h1>${success ? "Gmail Connected Successfully!" : "Connection Failed"}</h1>
    ${email ? `<div class="badge">${email}</div>` : ""}
    <p>${message}</p>
    <button class="btn" onclick="window.close()">Close Window</button>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({
          type: "GMAIL_OAUTH_RESULT",
          success: ${success},
          email: "${email || ""}",
          name: "${name || ""}",
          error: "${success ? "" : message.replace(/["\r\n]/g, " ")}"
        }, "*");
        setTimeout(function() {
          window.close();
        }, 1000);
      } else {
        setTimeout(function() {
          window.location.href = "/";
        }, 2000);
      }
    } catch (e) {
      console.error(e);
    }
  </script>
</body>
</html>`;
  };

  if (error) {
    return res.status(400).send(
      renderResultHtml({
        success: false,
        message: `Google authorization was declined or cancelled: ${error}`,
      })
    );
  }

  if (!code || !state) {
    return res.status(400).send(
      renderResultHtml({
        success: false,
        message: "Missing authorization code or state token in callback.",
      })
    );
  }

  const stateData = oauthStates.get(state);
  if (!stateData) {
    return res.status(400).send(
      renderResultHtml({
        success: false,
        message: "Authorization state has expired. Please return to CertPilot and click Connect Gmail again.",
      })
    );
  }

  oauthStates.delete(state);

  try {
    const { clientId, clientSecret } = getOAuthConfig();
    const tokenParams = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: stateData.redirectUri,
      grant_type: "authorization_code",
    });

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return res.status(400).send(
        renderResultHtml({
          success: false,
          message: tokenData.error_description || tokenData.error || "Failed to exchange authorization code for tokens.",
        })
      );
    }

    // Fetch user identity (email & name) using userinfo endpoint
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();
    const userEmail = userData.email || "user@gmail.com";
    const userName = userData.name || userData.given_name || "CertPilot User";

    // Store in secure server-side session map
    gmailSessions.set(stateData.sessionId, {
      sessionId: stateData.sessionId,
      email: userEmail,
      name: userName,
      picture: userData.picture,
      tokens: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expiry_date: Date.now() + (tokenData.expires_in || 3600) * 1000,
      },
      connectedAt: new Date().toISOString(),
    });

    return res.send(
      renderResultHtml({
        success: true,
        email: userEmail,
        name: userName,
        message: "Your Gmail account is now authorized to send certificates. Closing window...",
      })
    );
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    return res.status(500).send(
      renderResultHtml({
        success: false,
        message: err.message || "An unexpected error occurred during Google authentication.",
      })
    );
  }
});

// Check current user's Gmail connection status
app.get("/api/auth/google/status", (req, res) => {
  const sessionId = getSessionId(req);
  if (!sessionId) {
    return res.json({ connected: false });
  }

  const session = gmailSessions.get(sessionId);
  if (!session) {
    return res.json({ connected: false });
  }

  return res.json({
    connected: true,
    email: session.email,
    name: session.name,
    picture: session.picture,
    connectedAt: session.connectedAt,
  });
});

// Disconnect Gmail account
app.post("/api/auth/google/disconnect", (req, res) => {
  const sessionId = getSessionId(req);
  if (sessionId && gmailSessions.has(sessionId)) {
    gmailSessions.delete(sessionId);
  }

  return res.json({
    success: true,
    message: "Gmail account disconnected successfully.",
  });
});

// ==========================================
// 3. BACKWARD COMPATIBLE SMTP HELPERS
// ==========================================

interface SmtpCredentials {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

let sessionSmtp: SmtpCredentials | null = null;

function getTransporter(config: Partial<SmtpCredentials>) {
  const host = config.host || process.env.SMTP_HOST || "";
  const port = Number(config.port || process.env.SMTP_PORT || 465);
  const secure =
    config.secure !== undefined
      ? Boolean(config.secure)
      : process.env.SMTP_SECURE === "true" || port === 465;
  const user = config.user || process.env.SMTP_USER || "";
  const pass = config.pass || process.env.SMTP_PASSWORD || "";

  if (!host || !user || !pass) {
    throw new Error("Incomplete SMTP credentials: host, username, and password are required.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });
}

// Health check
app.get("/api/health", (_req, res) => {
  const { isConfigured } = getOAuthConfig();
  res.json({
    status: "ok",
    service: "CertPilot Backend",
    oauthConfigured: isConfigured,
    timestamp: new Date().toISOString(),
  });
});

// Legacy SMTP connection test
app.post("/api/test-smtp", async (req, res) => {
  try {
    const { host, port, secure, user, pass, isDemo } = req.body;

    if (isDemo || host === "demo.certpilot.local" || host === "demo.wimailer.local") {
      await new Promise((r) => setTimeout(r, 600));
      return res.json({
        success: true,
        message: "Demo SMTP connection simulated successfully! (Ready to generate and test bulk emails).",
        isDemo: true,
      });
    }

    if (!host || !user || !pass) {
      return res.status(400).json({
        success: false,
        error: "Host, Port, Username, and Password are required to test SMTP.",
      });
    }

    const transporter = getTransporter({
      host,
      port: Number(port),
      secure: Boolean(secure),
      user,
      pass,
    });

    await transporter.verify();

    sessionSmtp = {
      host,
      port: Number(port),
      secure: Boolean(secure),
      user,
      pass,
      fromName: req.body.fromName || "CertPilot",
      fromEmail: req.body.fromEmail || user,
    };

    return res.json({
      success: true,
      message: `Successfully connected to SMTP server ${host}:${port} as ${user}!`,
    });
  } catch (error: any) {
    console.error("SMTP Test Error:", error.message);
    let friendlyMessage = error.message || "Failed to connect to SMTP server.";
    if (error.code === "EAUTH") {
      friendlyMessage = "Authentication failed. Please verify your username and application password.";
    } else if (error.code === "ESOCKET" || error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      friendlyMessage = `Could not reach SMTP server at ${req.body.host}:${req.body.port}. Check host and port.`;
    }
    return res.status(400).json({
      success: false,
      error: friendlyMessage,
    });
  }
});

// ==========================================
// 4. EMAIL DISPATCH (GMAIL API FIRST)
// ==========================================

// Send Single Email
app.post("/api/send-email", async (req, res) => {
  try {
    const {
      to,
      subject,
      text,
      html,
      certificateDataUrl,
      certificateFilename,
      smtpConfig,
      isDemo,
    } = req.body;

    if (!to) {
      return res.status(400).json({ success: false, error: "Recipient email is required." });
    }

    // Demo Mode handling
    if (isDemo || (smtpConfig && smtpConfig.isDemo)) {
      await new Promise((r) => setTimeout(r, 400));
      return res.json({
        success: true,
        message: `[Demo Mode] Simulated email to ${to} sent successfully!`,
        messageId: `demo-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        senderEmail: "demo.certpilot@gmail.com",
        isDemo: true,
      });
    }

    const sessionId = getSessionId(req);
    const gmailSession = sessionId ? gmailSessions.get(sessionId) : null;

    // 1. Send via authorized Gmail API if connected
    if (gmailSession) {
      const accessToken = await getValidAccessToken(gmailSession);

      let attachment: { filename: string; contentType: string; base64Data: string } | undefined = undefined;
      if (certificateDataUrl) {
        const matches = certificateDataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          attachment = {
            contentType: matches[1],
            base64Data: matches[2],
            filename: certificateFilename || "Certificate.png",
          };
        }
      }

      const from = gmailSession.name
        ? `"${gmailSession.name}" <${gmailSession.email}>`
        : gmailSession.email;

      const rawMime = buildMimeMessage({
        from,
        to,
        subject: subject || "Your Certificate",
        text: text || "Please find your certificate attached.",
        html: html || undefined,
        attachment,
      });

      const rawBase64Url = Buffer.from(rawMime).toString("base64url");
      const result = await sendGmailMessage(accessToken, rawBase64Url);

      return res.json({
        success: true,
        messageId: result.id,
        senderEmail: gmailSession.email,
        message: `Email successfully delivered to ${to} via Gmail`,
      });
    }

    // 2. Legacy fallback to SMTP if explicitly provided
    const activeConfig = smtpConfig && smtpConfig.host ? smtpConfig : sessionSmtp;
    if (activeConfig && activeConfig.host && activeConfig.user) {
      const transporter = getTransporter(activeConfig);
      const fromAddress = activeConfig.fromName
        ? `"${activeConfig.fromName}" <${activeConfig.fromEmail || activeConfig.user}>`
        : activeConfig.fromEmail || activeConfig.user;

      const attachments: any[] = [];
      if (certificateDataUrl) {
        const matches = certificateDataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          attachments.push({
            filename: certificateFilename || "Certificate.png",
            content: Buffer.from(matches[2], "base64"),
            contentType: matches[1],
          });
        }
      }

      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject: subject || "Your Certificate",
        text: text || "Please find your certificate attached.",
        html: html || undefined,
        attachments,
      });

      return res.json({
        success: true,
        messageId: info.messageId,
        senderEmail: activeConfig.fromEmail || activeConfig.user,
        message: `Email successfully delivered to ${to}`,
      });
    }

    // If neither Gmail nor SMTP is available
    return res.status(400).json({
      success: false,
      error: "No Gmail account connected. Please click 'Connect Gmail' in Settings or switch to Demo Mode.",
    });
  } catch (error: any) {
    console.error("Send Email Error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to deliver email.",
    });
  }
});

// Send Bulk Emails
app.post("/api/send-bulk", async (req, res) => {
  try {
    const { items, smtpConfig, isDemo } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "No email items provided in bulk request." });
    }

    const sessionId = getSessionId(req);
    const gmailSession = sessionId ? gmailSessions.get(sessionId) : null;
    const activeConfig = smtpConfig && smtpConfig.host ? smtpConfig : sessionSmtp;
    const isSimulated = Boolean(isDemo || (activeConfig && activeConfig.isDemo) || (!gmailSession && !activeConfig));

    const results: Array<{
      recipientEmail: string;
      recipientName: string;
      senderEmail?: string;
      status: "sent" | "failed";
      error?: string;
      messageId?: string;
      sentAt: string;
    }> = [];

    let sentCount = 0;
    let failedCount = 0;

    // 1. Simulation Mode
    if (isSimulated) {
      for (const item of items) {
        await new Promise((r) => setTimeout(r, 120));
        const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.to || "");
        if (isEmailValid) {
          sentCount++;
          results.push({
            recipientEmail: item.to,
            recipientName: item.recipientName || item.to,
            senderEmail: "demo.certpilot@gmail.com",
            status: "sent",
            messageId: `demo-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            sentAt: new Date().toISOString(),
          });
        } else {
          failedCount++;
          results.push({
            recipientEmail: item.to,
            recipientName: item.recipientName || item.to,
            senderEmail: "demo.certpilot@gmail.com",
            status: "failed",
            error: "Invalid email syntax",
            sentAt: new Date().toISOString(),
          });
        }
      }

      return res.json({
        success: true,
        sent: sentCount,
        failed: failedCount,
        isDemo: true,
        senderEmail: "demo.certpilot@gmail.com",
        results,
      });
    }

    // 2. Gmail API Bulk Sending
    if (gmailSession) {
      const accessToken = await getValidAccessToken(gmailSession);
      const from = gmailSession.name
        ? `"${gmailSession.name}" <${gmailSession.email}>`
        : gmailSession.email;

      for (const item of items) {
        try {
          let attachment: { filename: string; contentType: string; base64Data: string } | undefined = undefined;
          if (item.certificateDataUrl) {
            const matches = item.certificateDataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              attachment = {
                contentType: matches[1],
                base64Data: matches[2],
                filename: item.certificateFilename || "Certificate.png",
              };
            }
          }

          const rawMime = buildMimeMessage({
            from,
            to: item.to,
            subject: item.subject || "Your Certificate",
            text: item.text || "Please find your certificate attached.",
            html: item.html || undefined,
            attachment,
          });

          const rawBase64Url = Buffer.from(rawMime).toString("base64url");
          const msgResult = await sendGmailMessage(accessToken, rawBase64Url);

          sentCount++;
          results.push({
            recipientEmail: item.to,
            recipientName: item.recipientName || item.to,
            senderEmail: gmailSession.email,
            status: "sent",
            messageId: msgResult.id,
            sentAt: new Date().toISOString(),
          });
        } catch (err: any) {
          failedCount++;
          results.push({
            recipientEmail: item.to,
            recipientName: item.recipientName || item.to,
            senderEmail: gmailSession.email,
            status: "failed",
            error: err.message || "Failed to send email via Gmail",
            sentAt: new Date().toISOString(),
          });
        }

        // Controlled sending pace (150ms delay between emails) to respect Gmail API limits
        await new Promise((r) => setTimeout(r, 150));
      }

      return res.json({
        success: true,
        sent: sentCount,
        failed: failedCount,
        isDemo: false,
        senderEmail: gmailSession.email,
        results,
      });
    }

    // 3. Legacy SMTP Bulk Sending
    if (activeConfig) {
      const transporter = getTransporter(activeConfig);
      const fromAddress = activeConfig.fromName
        ? `"${activeConfig.fromName}" <${activeConfig.fromEmail || activeConfig.user}>`
        : activeConfig.fromEmail || activeConfig.user;

      for (const item of items) {
        try {
          const attachments: any[] = [];
          if (item.certificateDataUrl) {
            const matches = item.certificateDataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              attachments.push({
                filename: item.certificateFilename || "Certificate.png",
                content: Buffer.from(matches[2], "base64"),
                contentType: matches[1],
              });
            }
          }

          const info = await transporter.sendMail({
            from: fromAddress,
            to: item.to,
            subject: item.subject || "Your Certificate",
            text: item.text || "Please find your certificate attached.",
            html: item.html || undefined,
            attachments,
          });

          sentCount++;
          results.push({
            recipientEmail: item.to,
            recipientName: item.recipientName || item.to,
            senderEmail: activeConfig.fromEmail || activeConfig.user,
            status: "sent",
            messageId: info.messageId,
            sentAt: new Date().toISOString(),
          });
        } catch (err: any) {
          failedCount++;
          results.push({
            recipientEmail: item.to,
            recipientName: item.recipientName || item.to,
            senderEmail: activeConfig.fromEmail || activeConfig.user,
            status: "failed",
            error: err.message || "Failed to send email",
            sentAt: new Date().toISOString(),
          });
        }
        await new Promise((r) => setTimeout(r, 100));
      }

      return res.json({
        success: true,
        sent: sentCount,
        failed: failedCount,
        isDemo: false,
        senderEmail: activeConfig.fromEmail || activeConfig.user,
        results,
      });
    }

    return res.status(400).json({
      success: false,
      error: "No email dispatch provider configured. Connect Gmail in Settings or enable Demo Mode.",
    });
  } catch (error: any) {
    console.error("Bulk Send Error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during bulk email dispatch.",
    });
  }
});

// ==========================================
// 5. SERVER INITIALIZATION & VITE INTEGRATION
// ==========================================

async function startServer() {
  const server = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: PORT,
        hmr: {
          server,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`CertPilot Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
