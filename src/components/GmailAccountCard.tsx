import React, { useState } from "react";
import {
  Mail,
  CheckCircle2,
  Circle,
  LogOut,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Key,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { GmailAccount, GmailOAuthConfig } from "../types";
import { initiateGoogleOAuth, disconnectGmail } from "../utils/gmailAuth";
import { useToast } from "./Toast";
import { GoogleCloudSetupModal } from "./GoogleCloudSetupModal";

interface GmailAccountCardProps {
  gmailAccount: GmailAccount;
  oauthConfig: GmailOAuthConfig;
  onAccountChange: (account: GmailAccount) => void;
  onRefreshConfig: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
}

export const GmailAccountCard: React.FC<GmailAccountCardProps> = ({
  gmailAccount,
  oauthConfig,
  onAccountChange,
  onRefreshConfig,
  isDemoMode,
  onToggleDemoMode,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const { showToast } = useToast();

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    try {
      const result = await initiateGoogleOAuth();

      if (result.success && result.account) {
        onAccountChange(result.account);
        showToast("success", "Gmail Connected!", `Sending authorized for ${result.account.email}`);
      } else if (result.unconfigured) {
        // If credentials are not yet configured, open setup modal
        setShowSetupModal(true);
        showToast(
          "info",
          "Google Cloud Setup Required",
          "Configure your Google Client ID and Secret to start OAuth."
        );
      } else {
        showToast("error", "Connection Failed", result.error || "Could not connect to Google.");
      }
    } catch (err: any) {
      showToast("error", "Connection Error", err.message || "Failed to initiate Google OAuth.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const success = await disconnectGmail();
      if (success) {
        onAccountChange({ connected: false });
        setShowConfirmDisconnect(false);
        showToast("info", "Gmail Disconnected", "Your Gmail session has been safely removed.");
      } else {
        showToast("error", "Disconnect Failed", "Could not remove Gmail authorization on the server.");
      }
    } catch (err: any) {
      showToast("error", "Error", err.message || "Failed to disconnect.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Email Account
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSetupModal(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              OAuth Credentials Guide
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
          {gmailAccount.connected ? (
            /* Connected State */
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        ✓ Gmail Connected
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mt-1 font-mono">
                      {gmailAccount.email}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Certificates and bulk emails will be sent directly from this authorized Gmail account.
                    </p>
                  </div>
                </div>

                {/* Disconnect button */}
                <button
                  type="button"
                  onClick={() => setShowConfirmDisconnect(true)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect Gmail
                </button>
              </div>

              {/* Minimal Scope & Security Guarantee Box */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block mb-0.5">
                    Scoped Permission Security
                  </span>
                  <p>
                    CertPilot only requested permission to send email (<code className="font-mono text-slate-800 bg-slate-200/60 px-1 py-0.5 rounded">gmail.send</code>). CertPilot <strong>cannot</strong> read your inbox, view contacts, modify messages, or access your Google account password.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Disconnected State */
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0">
                    <Circle className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      ○ Gmail not connected
                    </span>
                    <h3 className="text-base font-bold text-slate-800 mt-1">
                      Connect a Gmail account to send real certificates.
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-lg">
                      Authenticate securely with Google OAuth 2.0. No passwords or app passwords required. Your certificates will be sent directly through the official Gmail API.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConnectGmail}
                    disabled={isConnecting}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    )}
                    <span>{isConnecting ? "Connecting..." : "Connect Gmail"}</span>
                  </button>
                </div>
              </div>

              {/* Demo Mode Notice */}
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block mb-0.5">Demo Mode Active</span>
                  <p className="text-amber-800">
                    Emails are currently simulated with live certificate generation and delivery logging. Connect a Gmail account whenever you're ready to dispatch real emails.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Disconnect */}
      {showConfirmDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-base">Disconnect Gmail Account?</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Are you sure you want to disconnect <span className="font-semibold text-slate-900">{gmailAccount.email}</span>? CertPilot will no longer be able to send certificates on your behalf.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                (This will only remove the authorization from CertPilot. Nothing will be deleted from your Google account.)
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmDisconnect(false)}
                disabled={isDisconnecting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Cloud Setup Modal */}
      <GoogleCloudSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        defaultCallbackUrl={
          oauthConfig.redirectUri ||
          `${window.location.origin}/api/auth/google/callback`
        }
        onCredentialsUpdated={onRefreshConfig}
      />
    </>
  );
};
