export interface CertificateField {
  id: string;
  name: string;
  variable: string; // e.g. "{{name}}", "{{course}}", "{{date}}", "{{certificate_id}}" or raw text
  x: number; // percentage (0 to 100) or absolute px relative to template width
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: "normal" | "bold" | "600" | "800";
  fontStyle: "normal" | "italic";
  textAlign: "left" | "center" | "right";
  textColor: string;
  letterSpacing: number;
  opacity: number; // 0 to 1
  rotation: number; // in degrees
}

export interface Recipient {
  _id: string;
  name: string;
  email: string;
  course?: string;
  date?: string;
  certificate_id?: string;
  [key: string]: any; // Allow arbitrary spreadsheet columns
  _status?: "pending" | "generating" | "generated" | "sending" | "sent" | "failed";
  _error?: string;
  _certificateDataUrl?: string;
  _certificateFilename?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  category: "Academic" | "Corporate" | "Workshop" | "Event" | "Custom";
  thumbnail?: string;
  imageUrl: string;
  width: number;
  height: number;
  fields: CertificateField[];
  isCustom?: boolean;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  recipients: Recipient[];
  templateFields: CertificateField[];
  emailSubject: string;
  emailBody: string;
  status: "draft" | "generated" | "sending" | "completed" | "partial_failure";
  generatedCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  lastSentAt?: string;
}

export interface EmailLog {
  id: string;
  campaignId?: string;
  campaignName: string;
  recipientName: string;
  recipientEmail: string;
  senderEmail?: string;
  subject?: string;
  certificateFilename: string;
  status: "sent" | "failed" | "pending";
  sentAt: string;
  error?: string;
  isDemo?: boolean;
}

export interface GmailAccount {
  connected: boolean;
  email?: string;
  name?: string;
  picture?: string;
  connectedAt?: string;
}

export interface GmailOAuthConfig {
  configured: boolean;
  clientIdPreview?: string;
  redirectUri?: string;
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  fromName: string;
  fromEmail: string;
  isDemo: boolean;
  // password intentionally kept only in session memory
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
}

export interface DispatchResult {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  isDemo: boolean;
}
