import React, { useState } from "react";
import {
  Settings,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Server,
  Key,
  ShieldCheck,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { GmailAccount, GmailOAuthConfig, SmtpSettings } from "../types";
import { GmailAccountCard } from "../components/GmailAccountCard";
import { useToast } from "../components/Toast";

interface SettingsPageProps {
  gmailAccount: GmailAccount;
  oauthConfig: GmailOAuthConfig;
  onAccountChange: (account: GmailAccount) => void;
  onRefreshOAuthConfig: () => void;
  smtpSettings: SmtpSettings;
  onChangeSmtpSettings: (settings: SmtpSettings) => void;
  sessionPassword: string;
  onChangeSessionPassword: (pass: string) => void;
  onOpenHelp: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  gmailAccount,
  oauthConfig,
  onAccountChange,
  onRefreshOAuthConfig,
  smtpSettings,
  onChangeSmtpSettings,
  sessionPassword,
  onChangeSessionPassword,
  onOpenHelp,
}) => {
  const [showAdvancedSmtp, setShowAdvancedSmtp] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { showToast } = useToast();

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    setSmtpTestResult(null);

    try {
      const response = await fetch("/api/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: smtpSettings.host,
          port: smtpSettings.port,
          secure: smtpSettings.secure,
          user: smtpSettings.user,
          pass: sessionPassword,
          fromEmail: smtpSettings.fromEmail,
          fromName: smtpSettings.fromName,
          isDemo: smtpSettings.isDemo,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSmtpTestResult({
          success: true,
          message: data.message || "Custom SMTP verified successfully.",
        });
        showToast("success", "SMTP Verified", "Custom mail server responded.");
      } else {
        setSmtpTestResult({
          success: false,
          message: data.error || "Failed to authenticate with SMTP server.",
        });
        showToast("error", "SMTP Test Failed", data.error || "Check credentials");
      }
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: err.message || "Network error testing SMTP.",
      });
      showToast("error", "Network Error", "Could not reach test endpoint.");
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Email Account &amp; Delivery Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect your Gmail account via secure Google OAuth 2.0 to send certificates directly to recipient inboxes.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenHelp}
          className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <HelpCircle className="w-4 h-4" />
          Setup Guide
        </button>
      </div>

      {/* Main Feature: Connect Gmail Card */}
      <GmailAccountCard
        gmailAccount={gmailAccount}
        oauthConfig={oauthConfig}
        onAccountChange={onAccountChange}
        onRefreshConfig={onRefreshOAuthConfig}
        isDemoMode={smtpSettings.isDemo}
        onToggleDemoMode={() =>
          onChangeSmtpSettings({ ...smtpSettings, isDemo: !smtpSettings.isDemo })
        }
      />

      {/* Demo Mode Toggle Card */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          smtpSettings.isDemo
            ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20"
            : "bg-white border-slate-200 shadow-xs"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                smtpSettings.isDemo ? "bg-amber-200/80 text-amber-900" : "bg-slate-100 text-slate-500"
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Demo Mode (Simulation)</h3>
              <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                When Demo Mode is enabled, emails are safely simulated without sending live emails. When you connect Gmail and turn Demo Mode off, emails are delivered in real time to your recipients.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={smtpSettings.isDemo}
              onChange={(e) =>
                onChangeSmtpSettings({ ...smtpSettings, isDemo: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>
      </div>

      {/* Collapsible Legacy / Custom SMTP Relay Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvancedSmtp(!showAdvancedSmtp)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Advanced: Custom Private SMTP Relay (Legacy)
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <span>{showAdvancedSmtp ? "Hide" : "Show"}</span>
            {showAdvancedSmtp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showAdvancedSmtp && (
          <div className="p-6 pt-2 border-t border-slate-100 space-y-4 text-xs">
            <p className="text-slate-500">
              Only required if your organization mandates a custom internal SMTP relay. Normal users should connect through <strong>Gmail OAuth 2.0</strong> above.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={smtpSettings.host}
                  onChange={(e) => onChangeSmtpSettings({ ...smtpSettings, host: e.target.value })}
                  placeholder="mail.organization.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Port</label>
                  <input
                    type="number"
                    value={smtpSettings.port}
                    onChange={(e) => onChangeSmtpSettings({ ...smtpSettings, port: Number(e.target.value) })}
                    placeholder="587"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Security</label>
                  <select
                    value={smtpSettings.secure ? "ssl" : "tls"}
                    onChange={(e) => onChangeSmtpSettings({ ...smtpSettings, secure: e.target.value === "ssl" })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="tls">STARTTLS</option>
                    <option value="ssl">SSL/TLS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Username</label>
                <input
                  type="text"
                  value={smtpSettings.user}
                  onChange={(e) => onChangeSmtpSettings({ ...smtpSettings, user: e.target.value })}
                  placeholder="relay@organization.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Password (In-Memory Only)</label>
                <input
                  type="password"
                  value={sessionPassword}
                  onChange={(e) => onChangeSessionPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
                />
              </div>
            </div>

            {smtpTestResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  smtpTestResult.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                {smtpTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{smtpTestResult.message}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={isTestingSmtp}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isTestingSmtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Test Custom SMTP
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
