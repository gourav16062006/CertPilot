import React, { useState } from "react";
import {
  Mail,
  Send,
  Eye,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles,
  Paperclip,
} from "lucide-react";
import { Recipient, GmailAccount } from "../types";
import { interpolateVariables, sanitizeFilename } from "../utils/canvasRenderer";

interface EmailComposerProps {
  emailSubject: string;
  onChangeSubject: (val: string) => void;
  emailBody: string;
  onChangeBody: (val: string) => void;
  recipients: Recipient[];
  availableColumns: string[];
  onOpenBulkSendModal: () => void;
  isDemoMode: boolean;
  gmailAccount?: GmailAccount;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  emailSubject,
  onChangeSubject,
  emailBody,
  onChangeBody,
  recipients,
  availableColumns,
  onOpenBulkSendModal,
  isDemoMode,
  gmailAccount,
}) => {
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const currentRecipient = recipients[previewIndex] || recipients[0] || null;

  // Insert tag into body or subject
  const insertTag = (tag: string, target: "subject" | "body") => {
    const formattedTag = `{{${tag.toLowerCase()}}}`;
    if (target === "subject") {
      onChangeSubject(`${emailSubject} ${formattedTag}`);
    } else {
      onChangeBody(`${emailBody} ${formattedTag}`);
    }
  };

  const renderedSubject = interpolateVariables(emailSubject, currentRecipient);
  const renderedBody = interpolateVariables(emailBody, currentRecipient);
  const sampleAttachmentName = currentRecipient
    ? sanitizeFilename(currentRecipient.name)
    : "Rahul_Sharma_Certificate.png";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Email Editor Form (7 cols) */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Campaign Email Composer
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalized emails will be dispatched with the high-res certificate attached as PNG.
            </p>
          </div>
          {isDemoMode && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Demo Simulation
            </span>
          )}
        </div>

        {/* Recipient variable indicator */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Recipient Target
          </label>
          <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 flex items-center justify-between">
            <span>&#123;&#123;email&#125;&#125; (Recipient's email address from spreadsheet)</span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-sans font-bold text-[10px]">
              {recipients.length} Recipients
            </span>
          </div>
        </div>

        {/* Subject Line */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700">Email Subject</label>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400">Quick Insert:</span>
              <button
                type="button"
                onClick={() => insertTag("name", "subject")}
                className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded text-[10px] font-mono border border-slate-200"
              >
                + &#123;&#123;name&#125;&#125;
              </button>
              <button
                type="button"
                onClick={() => insertTag("course", "subject")}
                className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded text-[10px] font-mono border border-slate-200"
              >
                + &#123;&#123;course&#125;&#125;
              </button>
            </div>
          </div>
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => onChangeSubject(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
            placeholder="Congratulations {{name}} — Your Certificate"
          />
        </div>

        {/* Email Body */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">Email Message Body</label>
            <span className="text-[11px] text-slate-400">Variables automatically populate</span>
          </div>

          {/* Quick variable chips */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="text-[11px] font-medium text-slate-500">Insert tag:</span>
            {availableColumns.length > 0 ? (
              availableColumns.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => insertTag(col, "body")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded-md font-mono text-[11px] border border-slate-200 transition-colors"
                >
                  &#123;&#123;{col.toLowerCase()}&#125;&#125;
                </button>
              ))
            ) : (
              <>
                {["name", "course", "date", "certificate_id"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => insertTag(t, "body")}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded-md font-mono text-[11px] border border-slate-200 transition-colors"
                  >
                    &#123;&#123;{t}&#125;&#125;
                  </button>
                ))}
              </>
            )}
          </div>

          <textarea
            rows={8}
            value={emailBody}
            onChange={(e) => onChangeBody(e.target.value)}
            className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 font-sans focus:outline-none focus:border-blue-500 shadow-2xs leading-relaxed"
            placeholder="Hello {{name}},\n\nCongratulations on successfully completing {{course}}..."
          />
        </div>

        {/* Attachment Pill */}
        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-blue-950 font-medium">
            <Paperclip className="w-4 h-4 text-blue-600" />
            <span>Automatic Attachment:</span>
            <span className="font-mono text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200">
              {sampleAttachmentName}
            </span>
          </div>
          <span className="text-[11px] text-blue-600 font-semibold">High-Res PNG</span>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenBulkSendModal}
            disabled={recipients.length === 0}
            className="w-full py-3 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Review & Start Bulk Email Campaign ({recipients.length} Recipients)
          </button>
        </div>
      </div>

      {/* Right: Live Rendered Email Preview (5 cols) */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-slate-500" />
            Live Email Preview
          </h4>

          {recipients.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                disabled={previewIndex === 0}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-slate-500 text-[11px]">
                {previewIndex + 1} / {recipients.length}
              </span>
              <button
                type="button"
                onClick={() => setPreviewIndex((i) => Math.min(recipients.length - 1, i + 1))}
                disabled={previewIndex >= recipients.length - 1}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Email Header Simulation */}
        <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-14 font-medium">From:</span>
            <span className="font-mono text-slate-800 font-semibold truncate flex items-center gap-1.5">
              {gmailAccount?.connected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>{gmailAccount.email} (Gmail API)</span>
                </>
              ) : isDemoMode ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  <span className="text-amber-800 font-semibold">demo.certpilot@gmail.com (Demo Simulation)</span>
                </>
              ) : (
                <span className="text-slate-500 italic">Not Connected</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-14 font-medium">To:</span>
            <span className="font-mono text-slate-800 font-semibold truncate">
              {currentRecipient ? `${currentRecipient.name} <${currentRecipient.email}>` : "Rahul Sharma <rahul.sharma@example.com>"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-14 font-medium">Subject:</span>
            <span className="font-semibold text-slate-900 truncate">
              {renderedSubject || "Congratulations Rahul Sharma — Your Certificate"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-14 font-medium">Attached:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-blue-700 border border-blue-200 font-mono text-[11px]">
              <FileCheck className="w-3 h-3 text-blue-600" />
              {sampleAttachmentName}
            </span>
          </div>
        </div>

        {/* Rendered Email Body */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-line leading-relaxed min-h-[220px]">
          {renderedBody || "Hello Rahul Sharma,\n\nCongratulations on completing your course."}
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
          <span>Each recipient receives their own customized body and personalized attachment.</span>
        </div>
      </div>
    </div>
  );
};
