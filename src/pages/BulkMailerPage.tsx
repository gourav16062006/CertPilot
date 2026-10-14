import React, { useState } from "react";
import {
  Send,
  Mail,
  Users,
  Settings,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import {
  Recipient,
  SmtpSettings,
  CertificateField,
  CertificateTemplate,
  DispatchResult,
  EmailLog,
  GmailAccount,
} from "../types";
import { EmailComposer } from "../components/EmailComposer";
import { BulkSendingModal } from "../components/BulkSendingModal";
import { useToast } from "../components/Toast";

interface BulkMailerPageProps {
  emailSubject: string;
  onChangeSubject: (subject: string) => void;
  emailBody: string;
  onChangeBody: (body: string) => void;
  recipients: Recipient[];
  availableColumns: string[];
  activeTemplate: CertificateTemplate;
  fields: CertificateField[];
  campaignName: string;
  smtpSettings: SmtpSettings;
  sessionPassword?: string;
  gmailAccount?: GmailAccount;
  onNavigateToSettings: () => void;
  onCampaignCompleted?: (result: DispatchResult, newLogs: EmailLog[]) => void;
}

export const BulkMailerPage: React.FC<BulkMailerPageProps> = ({
  emailSubject,
  onChangeSubject,
  emailBody,
  onChangeBody,
  recipients,
  availableColumns,
  activeTemplate,
  fields,
  campaignName,
  smtpSettings,
  sessionPassword,
  gmailAccount,
  onNavigateToSettings,
  onCampaignCompleted,
}) => {
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const { showToast } = useToast();

  const handleCampaignCompleted = (result: DispatchResult, newLogs: EmailLog[]) => {
    let message = "";
    if (result.isDemo) {
      if (result.failed === 0) {
        message = `${result.sent} emails simulated successfully.`;
      } else if (result.sent === 0) {
        message = `${result.failed} email${result.failed === 1 ? "" : "s"} failed to simulate.`;
      } else {
        message = `${result.sent} emails simulated successfully, ${result.failed} failed.`;
      }
    } else {
      if (result.failed === 0) {
        message = `${result.sent} emails sent successfully via Gmail API.`;
      } else if (result.sent === 0) {
        message = `${result.failed} email${result.failed === 1 ? "" : "s"} failed to send.`;
      } else {
        message = `${result.sent} emails sent successfully, ${result.failed} failed.`;
      }
    }

    showToast(
      result.failed === 0 ? "success" : result.sent > 0 ? "warning" : "error",
      "Campaign Finished",
      message
    );

    if (onCampaignCompleted) {
      onCampaignCompleted(result, newLogs);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Bulk Email Dispatcher
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Send personalized certificates directly to recipient inboxes using your connected Gmail account.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          {gmailAccount?.connected ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sending from: <strong className="font-mono">{gmailAccount.email}</strong></span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Demo Mode (Simulation)</span>
            </div>
          )}

          <button
            onClick={onNavigateToSettings}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Email Settings
          </button>
        </div>
      </div>

      {/* Recipient warning if empty */}
      {recipients.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-bold">No recipients loaded!</span> Please upload your spreadsheet or load sample recipients before starting the campaign.
          </div>
        </div>
      )}

      {/* Email Composer Component */}
      <EmailComposer
        emailSubject={emailSubject}
        onChangeSubject={onChangeSubject}
        emailBody={emailBody}
        onChangeBody={onChangeBody}
        recipients={recipients}
        availableColumns={availableColumns}
        onOpenBulkSendModal={() => setIsBulkModalOpen(true)}
        isDemoMode={!gmailAccount?.connected || smtpSettings.isDemo}
        gmailAccount={gmailAccount}
      />

      {/* Bulk Sending Modal */}
      <BulkSendingModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        recipients={recipients}
        templateImageUrl={activeTemplate.imageUrl}
        fields={fields}
        emailSubject={emailSubject}
        emailBody={emailBody}
        campaignName={campaignName}
        smtpSettings={smtpSettings}
        sessionPassword={sessionPassword}
        gmailAccount={gmailAccount}
        onComplete={handleCampaignCompleted}
      />
    </div>
  );
};
