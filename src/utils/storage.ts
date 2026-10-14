import { Campaign, CertificateTemplate, EmailLog, SmtpSettings } from "../types";
import { DEFAULT_TEMPLATES } from "./sampleTemplates";

const STORAGE_KEYS = {
  CAMPAIGNS: "certpilot_campaigns",
  EMAIL_LOGS: "certpilot_email_logs",
  TEMPLATES: "certpilot_templates",
  SMTP_CONFIG: "certpilot_smtp_config",
  ACTIVE_CAMPAIGN_ID: "certpilot_active_campaign_id",
};

// Initial default demo SMTP settings
export const DEFAULT_SMTP_SETTINGS: SmtpSettings = {
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  user: "demo.certpilot@gmail.com",
  fromName: "CertPilot Certification Team",
  fromEmail: "demo.certpilot@gmail.com",
  isDemo: true, // Default to demo mode for immediate frictionless out-of-the-box usage
};

export const storage = {
  getCampaigns(): Campaign[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS) || localStorage.getItem("wimailer_campaigns");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCampaign(campaign: Campaign) {
    try {
      const campaigns = storage.getCampaigns();
      const existingIdx = campaigns.findIndex((c) => c.id === campaign.id);
      if (existingIdx >= 0) {
        campaigns[existingIdx] = campaign;
      } else {
        campaigns.unshift(campaign);
      }
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
    } catch (e) {
      console.error("Failed to save campaign", e);
    }
  },

  deleteCampaign(id: string) {
    try {
      const campaigns = storage.getCampaigns().filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
    } catch (e) {
      console.error("Failed to delete campaign", e);
    }
  },

  getEmailLogs(): EmailLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EMAIL_LOGS) || localStorage.getItem("wimailer_email_logs");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addEmailLogs(logs: EmailLog[]) {
    try {
      const existing = storage.getEmailLogs();
      const combined = [...logs, ...existing].slice(0, 500); // keep last 500 logs
      localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(combined));
    } catch (e) {
      console.error("Failed to save email logs", e);
    }
  },

  saveEmailLogs(logs: EmailLog[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(logs.slice(0, 500)));
    } catch (e) {
      console.error("Failed to save email logs", e);
    }
  },

  clearEmailLogs() {
    try {
      localStorage.removeItem(STORAGE_KEYS.EMAIL_LOGS);
    } catch {}
  },

  getCustomTemplates(): CertificateTemplate[] {
    try {
      const customData = localStorage.getItem(STORAGE_KEYS.TEMPLATES) || localStorage.getItem("wimailer_templates");
      return customData ? JSON.parse(customData) : [];
    } catch {
      return [];
    }
  },

  getTemplates(): CertificateTemplate[] {
    try {
      const customTemplates = storage.getCustomTemplates();
      return [...DEFAULT_TEMPLATES, ...customTemplates];
    } catch {
      return DEFAULT_TEMPLATES;
    }
  },

  saveCustomTemplate(template: CertificateTemplate) {
    try {
      const customData = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      const list: CertificateTemplate[] = customData ? JSON.parse(customData) : [];
      const existingIdx = list.findIndex((t) => t.id === template.id);
      if (existingIdx >= 0) {
        list[existingIdx] = template;
      } else {
        list.push(template);
      }
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(list));
    } catch (e) {
      console.error("Failed to save custom template", e);
    }
  },

  deleteCustomTemplate(templateId: string) {
    try {
      const customData = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      if (!customData) return;
      const list: CertificateTemplate[] = JSON.parse(customData);
      const updated = list.filter((t) => t.id !== templateId);
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to delete template", e);
    }
  },

  getSmtpSettings(): SmtpSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SMTP_CONFIG) || localStorage.getItem("wimailer_smtp_config");
      if (data) {
        const parsed = JSON.parse(data);
        // Ensure sensitive password was NEVER read or stored
        delete parsed.password;
        delete parsed.pass;
        return { ...DEFAULT_SMTP_SETTINGS, ...parsed };
      }
      return DEFAULT_SMTP_SETTINGS;
    } catch {
      return DEFAULT_SMTP_SETTINGS;
    }
  },

  saveSmtpSettings(settings: Omit<SmtpSettings, "password">) {
    try {
      // Strictly guarantee password is not saved into localStorage
      const safeSettings = { ...settings };
      delete (safeSettings as any).password;
      delete (safeSettings as any).pass;
      localStorage.setItem(STORAGE_KEYS.SMTP_CONFIG, JSON.stringify(safeSettings));
    } catch (e) {
      console.error("Failed to save SMTP settings", e);
    }
  },
};
