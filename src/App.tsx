import React, { useState, useEffect } from "react";
import { ToastProvider, useToast } from "./components/Toast";
import { Sidebar, NavTab } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardPage } from "./pages/DashboardPage";
import { CreateCertificatePage } from "./pages/CreateCertificatePage";
import { TemplatesPage } from "./pages/TemplatesPage";
import { RecipientsPage } from "./pages/RecipientsPage";
import { BulkMailerPage } from "./pages/BulkMailerPage";
import { EmailHistoryPage } from "./pages/EmailHistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import {
  CertificateTemplate,
  CertificateField,
  Recipient,
  Campaign,
  EmailLog,
  SmtpSettings,
  DispatchResult,
  GmailAccount,
  GmailOAuthConfig,
} from "./types";
import { DEFAULT_TEMPLATES, SAMPLE_RECIPIENTS } from "./utils/sampleTemplates";
import { storage } from "./utils/storage";
import { checkGmailStatus, fetchOAuthConfig, getAuthHeaders } from "./utils/gmailAuth";

function MainApp() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const { showToast } = useToast();

  // Campaign Meta
  const [campaignName, setCampaignName] = useState("Tech Horizon Summit 2026");

  // Templates
  const [templates, setTemplates] = useState<CertificateTemplate[]>(() => {
    const custom = storage.getCustomTemplates();
    return [...DEFAULT_TEMPLATES, ...custom];
  });
  const [activeTemplate, setActiveTemplate] = useState<CertificateTemplate>(
    DEFAULT_TEMPLATES[0]
  );

  // Fields (current template layers)
  const [fields, setFields] = useState<CertificateField[]>(
    DEFAULT_TEMPLATES[0].fields
  );

  // Recipients & Headers
  const [recipients, setRecipients] = useState<Recipient[]>(SAMPLE_RECIPIENTS);
  const [availableColumns, setAvailableColumns] = useState<string[]>([
    "Name",
    "Email",
    "Course",
    "Date",
    "Certificate ID",
  ]);

  // Email Composer
  const [emailSubject, setEmailSubject] = useState(
    "Congratulations {{name}} — Your Certificate"
  );
  const [emailBody, setEmailBody] = useState(
    `Hello {{name}},\n\nCongratulations on successfully completing {{course}}.\n\nPlease find your personalized certificate attached to this email.\n\nBest regards,\nCertPilot Certification Team`
  );

  // Gmail OAuth State
  const [gmailAccount, setGmailAccount] = useState<GmailAccount>({ connected: false });
  const [oauthConfig, setOAuthConfig] = useState<GmailOAuthConfig>({ configured: false });

  // SMTP Settings & In-Memory Session Password (Legacy fallback)
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>(() =>
    storage.getSmtpSettings()
  );
  const [sessionPassword, setSessionPassword] = useState<string>("");

  // Persisted Campaigns & Email Logs
  const [campaigns, setCampaigns] = useState<Campaign[]>(() =>
    storage.getCampaigns()
  );
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() =>
    storage.getEmailLogs()
  );

  // Load Gmail OAuth status and configuration on mount
  useEffect(() => {
    async function loadGmailAuth() {
      const [status, cfg] = await Promise.all([
        checkGmailStatus(),
        fetchOAuthConfig(),
      ]);
      setGmailAccount(status);
      setOAuthConfig(cfg);

      // If Gmail is connected, automatically disable demo mode so live sending is active
      if (status.connected) {
        setSmtpSettings((prev) => ({ ...prev, isDemo: false }));
      }
    }
    loadGmailAuth();
  }, []);

  const refreshOAuthConfig = async () => {
    const [status, cfg] = await Promise.all([
      checkGmailStatus(),
      fetchOAuthConfig(),
    ]);
    setGmailAccount(status);
    setOAuthConfig(cfg);
  };

  // Sync templates & settings to localStorage
  const handleSmtpChange = (newSettings: SmtpSettings) => {
    setSmtpSettings(newSettings);
    storage.saveSmtpSettings(newSettings);
  };

  const handleUploadCustomTemplate = (newTpl: CertificateTemplate) => {
    const updated = [newTpl, ...templates];
    setTemplates(updated);
    storage.saveCustomTemplate(newTpl);
  };

  const handleDeleteCustomTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    storage.deleteCustomTemplate(id);
    if (activeTemplate.id === id) {
      setActiveTemplate(DEFAULT_TEMPLATES[0]);
      setFields(DEFAULT_TEMPLATES[0].fields);
    }
  };

  const handleRenameTemplate = (id: string, newName: string) => {
    const updated = templates.map((t) =>
      t.id === id ? { ...t, name: newName } : t
    );
    setTemplates(updated);
  };

  const handleSelectTemplate = (tpl: CertificateTemplate) => {
    setActiveTemplate(tpl);
    setFields(tpl.fields);
  };

  // Launch Quick Demo
  const handleQuickStart = () => {
    setActiveTemplate(DEFAULT_TEMPLATES[0]);
    setFields(DEFAULT_TEMPLATES[0].fields);
    setRecipients(SAMPLE_RECIPIENTS);
    setAvailableColumns(["Name", "Email", "Course", "Date", "Certificate ID"]);
    setCampaignName("AI & Cloud Certification 2026");
    setActiveTab("create");
    showToast(
      "success",
      "Demo Loaded!",
      "Sample template and 10 recipient records initialized. Switch between steps or generate certificates!"
    );
  };

  // Handle bulk campaign completion
  const handleCampaignCompleted = (result: DispatchResult, newLogs: EmailLog[]) => {
    // 1. Sync emailLogs state so History and Dashboard immediately update
    setEmailLogs((prev) => {
      const newIds = new Set(newLogs.map((l) => l.id));
      const filtered = prev.filter((l) => !newIds.has(l.id));
      return [...newLogs, ...filtered];
    });

    // 2. Add or update campaign in state & localStorage
    const newCampaign: Campaign = {
      id: `camp-${Date.now()}`,
      name: campaignName || "Certificate Campaign",
      templateId: activeTemplate.id,
      templateName: activeTemplate.name,
      recipients: recipients,
      templateFields: fields,
      emailSubject,
      emailBody,
      status: result.failed === 0 ? "completed" : result.sent > 0 ? "partial_failure" : "sending",
      generatedCount: result.total,
      sentCount: result.sent,
      failedCount: result.failed,
      createdAt: new Date().toLocaleDateString(),
      lastSentAt: new Date().toLocaleString(),
    };

    setCampaigns((prev) => [newCampaign, ...prev]);
    storage.saveCampaign(newCampaign);
  };

  // Create New Campaign (Clean slate)
  const handleCreateNewCampaign = () => {
    setCampaignName(`Campaign ${new Date().toLocaleDateString()}`);
    setActiveTab("create");
    showToast("info", "New Campaign", "Ready to customize your certificate workflow.");
  };

  // Clear Logs
  const handleClearLogs = () => {
    storage.clearEmailLogs();
    setEmailLogs([]);
    showToast("info", "Logs Cleared", "Email history has been wiped.");
  };

  // Retry Failed Email
  const handleRetryEmail = async (log: EmailLog) => {
    showToast("info", "Retrying...", `Attempting redelivery to ${log.recipientEmail}`);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          to: log.recipientEmail,
          recipientName: log.recipientName,
          subject: emailSubject.replace("{{name}}", log.recipientName),
          text: emailBody.replace("{{name}}", log.recipientName),
          certificateFilename: log.certificateFilename,
          isDemo: !gmailAccount.connected && smtpSettings.isDemo,
          smtpConfig: {
            ...smtpSettings,
            pass: sessionPassword,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const updatedLogs = emailLogs.map((l) =>
          l.id === log.id
            ? {
                ...l,
                status: "sent" as const,
                senderEmail: data.senderEmail || (gmailAccount.connected ? gmailAccount.email : "demo.certpilot@gmail.com"),
                sentAt: new Date().toLocaleString(),
                error: undefined,
              }
            : l
        );
        setEmailLogs(updatedLogs);
        storage.saveEmailLogs(updatedLogs);
        showToast("success", "Sent!", `Email successfully delivered to ${log.recipientEmail}`);
      } else {
        throw new Error(data.error || "Retry failed");
      }
    } catch (err: any) {
      showToast("error", "Retry Failed", err.message || "Failed to deliver email.");
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDemoMode={!gmailAccount.connected && smtpSettings.isDemo}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header Bar */}
        <Header
          currentProjectName={campaignName}
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
          onQuickStart={handleQuickStart}
          onCreateNewCampaign={handleCreateNewCampaign}
          isDemoMode={!gmailAccount.connected && smtpSettings.isDemo}
          onToggleDemoMode={() =>
            handleSmtpChange({ ...smtpSettings, isDemo: !smtpSettings.isDemo })
          }
          gmailAccount={gmailAccount}
        />

        {/* Dynamic Route/Tab Views */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === "dashboard" && (
            <DashboardPage
              campaigns={campaigns}
              emailLogs={emailLogs}
              templates={templates}
              onNavigateTab={setActiveTab}
              onQuickStart={handleQuickStart}
              onCreateNewCampaign={handleCreateNewCampaign}
              isDemoMode={!gmailAccount.connected && smtpSettings.isDemo}
            />
          )}

          {activeTab === "create" && (
            <CreateCertificatePage
              templates={templates}
              activeTemplate={activeTemplate}
              onChangeTemplate={handleSelectTemplate}
              recipients={recipients}
              onChangeRecipients={setRecipients}
              availableColumns={availableColumns}
              onChangeColumns={setAvailableColumns}
              fields={fields}
              onChangeFields={setFields}
              onUploadCustomTemplate={handleUploadCustomTemplate}
              onDeleteCustomTemplate={handleDeleteCustomTemplate}
              onProceedToMailer={() => setActiveTab("mailer")}
              currentCampaignName={campaignName}
              onChangeCampaignName={setCampaignName}
            />
          )}

          {activeTab === "templates" && (
            <TemplatesPage
              templates={templates}
              onSelectTemplateToUse={(tpl) => {
                handleSelectTemplate(tpl);
                setActiveTab("create");
              }}
              onUploadTemplate={handleUploadCustomTemplate}
              onDeleteTemplate={handleDeleteCustomTemplate}
              onRenameTemplate={handleRenameTemplate}
            />
          )}

          {activeTab === "recipients" && (
            <RecipientsPage
              recipients={recipients}
              onChangeRecipients={setRecipients}
              availableColumns={availableColumns}
              onChangeColumns={setAvailableColumns}
              onProceedToCreate={() => setActiveTab("create")}
            />
          )}

          {activeTab === "mailer" && (
            <BulkMailerPage
              emailSubject={emailSubject}
              onChangeSubject={setEmailSubject}
              emailBody={emailBody}
              onChangeBody={setEmailBody}
              recipients={recipients}
              availableColumns={availableColumns}
              activeTemplate={activeTemplate}
              fields={fields}
              campaignName={campaignName}
              smtpSettings={smtpSettings}
              sessionPassword={sessionPassword}
              gmailAccount={gmailAccount}
              onNavigateToSettings={() => setActiveTab("settings")}
              onCampaignCompleted={handleCampaignCompleted}
            />
          )}

          {activeTab === "history" && (
            <EmailHistoryPage
              emailLogs={emailLogs}
              onClearLogs={handleClearLogs}
              onRetryEmail={handleRetryEmail}
            />
          )}

          {activeTab === "settings" && (
            <SettingsPage
              gmailAccount={gmailAccount}
              oauthConfig={oauthConfig}
              onAccountChange={setGmailAccount}
              onRefreshOAuthConfig={refreshOAuthConfig}
              smtpSettings={smtpSettings}
              onChangeSmtpSettings={handleSmtpChange}
              sessionPassword={sessionPassword}
              onChangeSessionPassword={setSessionPassword}
              onOpenHelp={() => {}}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
