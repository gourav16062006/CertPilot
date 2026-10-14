import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Mail,
  Loader2,
} from "lucide-react";
import { Recipient, SmtpSettings, EmailLog, CertificateField, DispatchResult, GmailAccount } from "../types";
import { generateSingleCertificatePng, interpolateVariables, sanitizeFilename, loadCertificateImage } from "../utils/canvasRenderer";
import { storage } from "../utils/storage";
import { getAuthHeaders } from "../utils/gmailAuth";

interface BulkSendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: Recipient[];
  templateImageUrl: string;
  fields: CertificateField[];
  emailSubject: string;
  emailBody: string;
  campaignName: string;
  smtpSettings: SmtpSettings;
  sessionPassword?: string;
  gmailAccount?: GmailAccount;
  onComplete: (result: DispatchResult, newLogs: EmailLog[]) => void;
}

interface SendingItem {
  recipient: Recipient;
  status: "pending" | "sending" | "sent" | "failed";
  error?: string;
  sentAt?: string;
}

export const BulkSendingModal: React.FC<BulkSendingModalProps> = ({
  isOpen,
  onClose,
  recipients,
  templateImageUrl,
  fields,
  emailSubject,
  emailBody,
  campaignName,
  smtpSettings,
  sessionPassword,
  gmailAccount,
  onComplete,
}) => {
  const [items, setItems] = useState<SendingItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<DispatchResult | null>(null);

  // Keep a ref to always have current items without closure staleness
  const itemsRef = useRef<SendingItem[]>([]);
  itemsRef.current = items;

  // Initialize items when modal opens or recipients change
  useEffect(() => {
    if (isOpen) {
      const initialItems: SendingItem[] = recipients.map((r) => ({
        recipient: r,
        status: "pending",
      }));
      setItems(initialItems);
      itemsRef.current = initialItems;
      setIsSending(false);
      setIsCompleted(false);
      setHasStarted(false);
      setDispatchResult(null);
    }
  }, [isOpen, recipients]);

  if (!isOpen) return null;

  // Single source of truth for counts
  const total = items.length;
  const sentCount = dispatchResult
    ? dispatchResult.sent
    : items.filter((i) => i.status === "sent").length;
  const failedCount = dispatchResult
    ? dispatchResult.failed
    : items.filter((i) => i.status === "failed").length;
  const pendingCount = dispatchResult
    ? dispatchResult.pending
    : items.filter((i) => i.status === "pending" || i.status === "sending").length;
  const progressPercent =
    total > 0 ? Math.round(((sentCount + failedCount) / total) * 100) : 0;
  const estimatedSeconds = Math.max(
    1,
    Math.round(total * (smtpSettings.isDemo ? 0.25 : 1.2))
  );

  // Start sending loop
  const handleStartSending = async (targetItems?: SendingItem[]) => {
    setIsSending(true);
    setHasStarted(true);
    setDispatchResult(null);

    // Use current items from itemsRef or fallback
    let currentWorkingList: SendingItem[] =
      itemsRef.current.length > 0
        ? [...itemsRef.current]
        : recipients.map((r) => ({ recipient: r, status: "pending" }));

    const itemsToProcess = targetItems || currentWorkingList;
    const templateImg = await loadCertificateImage(templateImageUrl);
    const newLogs: EmailLog[] = [];

    for (let i = 0; i < itemsToProcess.length; i++) {
      const targetItem = itemsToProcess[i];
      // Skip if already sent successfully
      if (targetItem.status === "sent") continue;

      const targetId = targetItem.recipient._id;

      // 1. Mark status as "sending" in the single source working list
      currentWorkingList = currentWorkingList.map((it) =>
        it.recipient._id === targetId ? { ...it, status: "sending", error: undefined } : it
      );
      setItems([...currentWorkingList]);
      itemsRef.current = currentWorkingList;

      try {
        // 1. Generate high-res certificate PNG
        const certDataUrl = await generateSingleCertificatePng(
          templateImg,
          fields,
          targetItem.recipient
        );
        const filename = sanitizeFilename(targetItem.recipient.name);

        // 2. Interpolate subject & body
        const personalizedSubject = interpolateVariables(emailSubject, targetItem.recipient);
        const personalizedBody = interpolateVariables(emailBody, targetItem.recipient);

        // 3. Dispatch to backend API
        const payload = {
          to: targetItem.recipient.email,
          recipientName: targetItem.recipient.name,
          subject: personalizedSubject,
          text: personalizedBody,
          certificateDataUrl: certDataUrl,
          certificateFilename: filename,
          isDemo: smtpSettings.isDemo,
          smtpConfig: {
            host: smtpSettings.host,
            port: smtpSettings.port,
            secure: smtpSettings.secure,
            user: smtpSettings.user,
            pass: sessionPassword || "",
            fromName: smtpSettings.fromName,
            fromEmail: smtpSettings.fromEmail,
            isDemo: smtpSettings.isDemo,
          },
        };

        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          const sentTime = new Date().toLocaleTimeString();
          currentWorkingList = currentWorkingList.map((it) =>
            it.recipient._id === targetId
              ? { ...it, status: "sent", sentAt: sentTime, error: undefined }
              : it
          );
          setItems([...currentWorkingList]);
          itemsRef.current = currentWorkingList;

          newLogs.push({
            id: `log-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            campaignName: campaignName || "Certificate Campaign",
            recipientName: targetItem.recipient.name,
            recipientEmail: targetItem.recipient.email,
            senderEmail: data.senderEmail || (gmailAccount?.connected ? gmailAccount.email : "demo.certpilot@gmail.com"),
            subject: personalizedSubject,
            certificateFilename: filename,
            status: "sent",
            sentAt: new Date().toLocaleString(),
            isDemo: smtpSettings.isDemo,
          });
        } else {
          throw new Error(data.error || "Email dispatch failed");
        }
      } catch (err: any) {
        console.error("Sending failed for", targetItem.recipient.name, err);
        currentWorkingList = currentWorkingList.map((it) =>
          it.recipient._id === targetId
            ? { ...it, status: "failed", error: err.message || "Failed to send email" }
            : it
        );
        setItems([...currentWorkingList]);
        itemsRef.current = currentWorkingList;

        newLogs.push({
          id: `log-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          campaignName: campaignName || "Certificate Campaign",
          recipientName: targetItem.recipient.name,
          recipientEmail: targetItem.recipient.email,
          senderEmail: gmailAccount?.connected ? gmailAccount.email : "demo.certpilot@gmail.com",
          subject: interpolateVariables(emailSubject, targetItem.recipient),
          certificateFilename: sanitizeFilename(targetItem.recipient.name),
          status: "failed",
          sentAt: new Date().toLocaleString(),
          error: err.message || "Failed to send email",
          isDemo: smtpSettings.isDemo,
        });
      }

      // Small pause for UI animation smoothness
      await new Promise((r) => setTimeout(r, smtpSettings.isDemo ? 100 : 250));
    }

    // Save logs to storage
    if (newLogs.length > 0) {
      storage.addEmailLogs(newLogs);
    }

    // Calculate final single source of truth dispatch result
    const finalSent = currentWorkingList.filter((i) => i.status === "sent").length;
    const finalFailed = currentWorkingList.filter((i) => i.status === "failed").length;
    const finalPending = currentWorkingList.filter(
      (i) => i.status === "pending" || i.status === "sending"
    ).length;

    const finalResult: DispatchResult = {
      total: currentWorkingList.length,
      sent: finalSent,
      failed: finalFailed,
      pending: finalPending,
      isDemo: Boolean(smtpSettings.isDemo),
    };

    setDispatchResult(finalResult);
    setIsSending(false);
    setIsCompleted(true);

    // Notify parent with single source of truth result and newly created logs
    onComplete(finalResult, newLogs);
  };

  // Retry single failed recipient
  const handleRetrySingle = async (recipientId: string) => {
    const target = itemsRef.current.find((i) => i.recipient._id === recipientId);
    if (!target) return;
    await handleStartSending([target]);
  };

  // Retry all failed recipients
  const handleRetryFailed = async () => {
    const failedItems = itemsRef.current.filter((i) => i.status === "failed");
    if (failedItems.length === 0) return;
    await handleStartSending(failedItems);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Bulk Certificate Dispatch</h3>
              <p className="text-xs text-blue-200">
                Campaign: {campaignName || "Untitled Campaign"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSending}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Screen (Before starting) */}
        {!hasStarted ? (
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">Campaign Sending Confirmation</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">Recipients</span>
                  <span className="font-bold text-base text-slate-900">{total}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">Certificates</span>
                  <span className="font-bold text-base text-slate-900">{total}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">Emails to Send</span>
                  <span className="font-bold text-base text-blue-600">{total}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">Est. Time</span>
                  <span className="font-bold text-base text-slate-900">~{estimatedSeconds}s</span>
                </div>
              </div>
            </div>

            {/* Transport status & Sender confirmation banner */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                gmailAccount?.connected
                  ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                  : smtpSettings.isDemo
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-blue-50 border-blue-200 text-blue-900"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {gmailAccount?.connected ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : smtpSettings.isDemo ? (
                  <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Send certificates from:
                  </span>
                  <span className="font-bold text-sm text-slate-900 font-mono block">
                    {gmailAccount?.connected
                      ? gmailAccount.email
                      : smtpSettings.isDemo
                      ? "demo.certpilot@gmail.com (Demo Simulation)"
                      : smtpSettings.fromEmail || smtpSettings.user}
                  </span>
                  <span className="text-[11px] opacity-85 mt-0.5 block">
                    {gmailAccount?.connected
                      ? "Direct delivery via Google Gmail API OAuth 2.0"
                      : smtpSettings.isDemo
                      ? "Emails are simulated. Connect Gmail in Settings to send real emails."
                      : `Sending via SMTP relay ${smtpSettings.host}`}
                  </span>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4 self-stretch flex flex-col justify-center">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Recipients</span>
                <span className="font-bold text-base text-slate-900">{total}</span>
              </div>
            </div>

            {/* Start Button & Cancel */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStartSending()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                Send Certificates ({total})
              </button>
            </div>
          </div>
        ) : (
          /* Real-time Progress & Status Screen */
          <div className="p-6 space-y-4 overflow-y-auto flex-1 flex flex-col">
            {/* Progress Header */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-800">
                  {isSending
                    ? smtpSettings.isDemo
                      ? "Simulating certificate dispatch..."
                      : "Sending certificates..."
                    : isCompleted
                    ? "Campaign Complete!"
                    : "Paused"}
                </span>
                <span className="font-mono font-bold text-blue-600">
                  {sentCount + failedCount} / {total} ({progressPercent}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 transition-all duration-300"
                  style={{ width: `${total > 0 ? (sentCount / total) * 100 : 0}%` }}
                />
                <div
                  className="bg-rose-500 transition-all duration-300"
                  style={{ width: `${total > 0 ? (failedCount / total) * 100 : 0}%` }}
                />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-100">
                  <span className="block text-[10px] text-emerald-600 font-semibold uppercase">
                    {smtpSettings.isDemo ? "SENT / SIMULATED" : "SENT"}
                  </span>
                  <span className="font-bold text-base">{sentCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-rose-50 text-rose-900 border border-rose-100">
                  <span className="block text-[10px] text-rose-600 font-semibold uppercase">FAILED</span>
                  <span className="font-bold text-base">{failedCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase">PENDING</span>
                  <span className="font-bold text-base">{pendingCount}</span>
                </div>
              </div>
            </div>

            {/* Recipient Item Status List */}
            <div className="flex-1 min-h-[220px] max-h-[300px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
              {items.map((item, idx) => (
                <div
                  key={item.recipient._id || idx}
                  className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate">
                        {item.recipient.name}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px] truncate">
                        &lt;{item.recipient.email}&gt;
                      </span>
                    </div>
                    {item.error && (
                      <p className="text-[11px] text-rose-600 mt-0.5 truncate">{item.error}</p>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2">
                    {item.status === "pending" && (
                      <span className="text-[11px] text-slate-400 font-medium">Pending</span>
                    )}
                    {item.status === "sending" && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-semibold animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {smtpSettings.isDemo ? "Simulating" : "Sending"}
                      </span>
                    )}
                    {item.status === "sent" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {smtpSettings.isDemo ? "Simulated" : "Sent"}
                      </span>
                    )}
                    {item.status === "failed" && (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          Failed
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRetrySingle(item.recipient._id)}
                          className="p-1 hover:bg-slate-100 rounded text-blue-600"
                          title="Retry this email"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with Retry and Close Buttons */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 flex-shrink-0">
              <div>
                {failedCount > 0 && !isSending && (
                  <button
                    type="button"
                    onClick={handleRetryFailed}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors border border-rose-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry Failed Emails ({failedCount})
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold disabled:opacity-40"
              >
                {isCompleted ? "Done & Close" : "Dismiss"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
