import { GmailAccount, GmailOAuthConfig } from "../types";

const SESSION_KEY = "certpilot_user_session_id";

// Get or generate a unique client session ID for this browser tab/device
export function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY) || localStorage.getItem("wimailer_user_session_id");
    if (!id || id.length < 8) {
      id = `sess_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString(36)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `sess_${Date.now()}`;
  }
}

// Fetch headers including session identifier
export function getAuthHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-session-id": getSessionId(),
  };
}

// Get Google OAuth server configuration
export async function fetchOAuthConfig(): Promise<GmailOAuthConfig & { defaultCallbackUrl?: string; error?: string }> {
  try {
    const res = await fetch("/api/auth/google/config", {
      headers: { "x-session-id": getSessionId() },
    });
    if (!res.ok) throw new Error("Failed to fetch OAuth configuration");
    return await res.json();
  } catch (err: any) {
    return {
      configured: false,
      error: err.message,
    };
  }
}

// Check if user has an active Gmail session on the backend
export async function checkGmailStatus(): Promise<GmailAccount> {
  try {
    const res = await fetch("/api/auth/google/status", {
      headers: { "x-session-id": getSessionId() },
    });
    if (!res.ok) return { connected: false };
    const data = await res.json();
    return {
      connected: Boolean(data.connected),
      email: data.email,
      name: data.name,
      picture: data.picture,
      connectedAt: data.connectedAt,
    };
  } catch (e) {
    console.error("Failed to check Gmail status:", e);
    return { connected: false };
  }
}

// Disconnect the Gmail session
export async function disconnectGmail(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/google/disconnect", {
      method: "POST",
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (e) {
    console.error("Failed to disconnect Gmail:", e);
    return false;
  }
}

// Start Google OAuth 2.0 Flow with popup
export async function initiateGoogleOAuth(): Promise<{
  success: boolean;
  account?: GmailAccount;
  error?: string;
  unconfigured?: boolean;
  defaultCallbackUrl?: string;
}> {
  const sessionId = getSessionId();

  // 1. Fetch the authorization URL from our server
  const urlRes = await fetch(`/api/auth/google/url?sessionId=${encodeURIComponent(sessionId)}`, {
    headers: { "x-session-id": sessionId },
  });

  const urlData = await urlRes.json();

  if (!urlRes.ok || !urlData.success) {
    return {
      success: false,
      error: urlData.error || "Could not generate Google authorization URL.",
      unconfigured: Boolean(urlData.unconfigured),
      defaultCallbackUrl: urlData.defaultCallbackUrl,
    };
  }

  const authUrl = urlData.url;

  // 2. Open standard OAuth popup centered on screen
  const width = 540;
  const height = 660;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const popup = window.open(
    authUrl,
    "certpilot_google_oauth",
    `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=yes,resizable=yes`
  );

  if (!popup || popup.closed || typeof popup.closed === "undefined") {
    // Popup was blocked by browser
    return {
      success: false,
      error: "Popup blocked by browser. Please allow popups for CertPilot to connect your Google account.",
    };
  }

  // 3. Listen for postMessage from callback HTML or poll for popup close
  return new Promise((resolve) => {
    let settled = false;

    const messageListener = (event: MessageEvent) => {
      if (event.data && event.data.type === "GMAIL_OAUTH_RESULT") {
        settled = true;
        window.removeEventListener("message", messageListener);
        clearInterval(timer);

        if (event.data.success) {
          resolve({
            success: true,
            account: {
              connected: true,
              email: event.data.email,
              name: event.data.name,
              connectedAt: new Date().toISOString(),
            },
          });
        } else {
          resolve({
            success: false,
            error: event.data.error || "Google authorization was cancelled.",
          });
        }
      }
    };

    window.addEventListener("message", messageListener);

    // Fallback polling: check if user closed popup or status updated
    const timer = setInterval(async () => {
      if (popup.closed) {
        clearInterval(timer);
        window.removeEventListener("message", messageListener);

        if (!settled) {
          settled = true;
          // Verify with server if authentication actually completed before popup closed
          const status = await checkGmailStatus();
          if (status.connected) {
            resolve({
              success: true,
              account: status,
            });
          } else {
            resolve({
              success: false,
              error: "Authorization window was closed before completing.",
            });
          }
        }
      }
    }, 600);
  });
}

// Runtime OAuth configuration update
export async function updateRuntimeOAuthConfig(credentials: {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch("/api/auth/google/configure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Failed to update OAuth credentials." };
    }
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to connect to server." };
  }
}
