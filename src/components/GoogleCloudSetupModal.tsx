import React, { useState } from "react";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Key,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Server,
  Loader2,
} from "lucide-react";
import { updateRuntimeOAuthConfig } from "../utils/gmailAuth";
import { useToast } from "./Toast";

interface GoogleCloudSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCallbackUrl: string;
  onCredentialsUpdated: () => void;
}

export const GoogleCloudSetupModal: React.FC<GoogleCloudSetupModalProps> = ({
  isOpen,
  onClose,
  defaultCallbackUrl,
  onCredentialsUpdated,
}) => {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState(defaultCallbackUrl);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const callbackUrlToUse = redirectUri || defaultCallbackUrl;

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(callbackUrlToUse);
    setCopied(true);
    showToast("info", "Copied to Clipboard", "Authorized Redirect URI copied.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) {
      showToast("error", "Missing Information", "Both Client ID and Client Secret are required.");
      return;
    }

    setIsSaving(true);
    const res = await updateRuntimeOAuthConfig({
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      redirectUri: callbackUrlToUse.trim(),
    });
    setIsSaving(false);

    if (res.success) {
      showToast("success", "Credentials Saved!", "Google OAuth 2.0 is now active for this session.");
      onCredentialsUpdated();
      onClose();
    } else {
      showToast("error", "Failed to Save", res.error || "Could not update credentials.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Google Cloud OAuth 2.0 Configuration</h3>
              <p className="text-xs text-slate-400">Configure your Google Cloud Project to enable Gmail sending</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-700">
          {/* Step-by-Step Instructions */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              How to create your Google OAuth Credentials:
            </h4>

            <ol className="space-y-2.5 list-decimal pl-4 text-slate-600">
              <li>
                Open the{" "}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  Google Cloud Console <ExternalLink className="w-3 h-3" />
                </a>{" "}
                and select or create a project.
              </li>
              <li>
                Navigate to <strong>APIs &amp; Services &gt; Library</strong> and enable the{" "}
                <strong className="text-slate-900">Gmail API</strong>.
              </li>
              <li>
                Go to <strong>OAuth consent screen</strong>:
                <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-500">
                  <li>Choose <strong>External</strong> user type and fill in app name (e.g. <em>CertPilot</em>).</li>
                  <li>Add the scope: <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">https://www.googleapis.com/auth/gmail.send</code></li>
                  <li>In Test Users, add the Gmail address you want to test with.</li>
                </ul>
              </li>
              <li>
                Go to <strong>Credentials &gt; Create Credentials &gt; OAuth client ID</strong>:
                <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-500">
                  <li>Application type: <strong>Web application</strong>.</li>
                  <li>Name: <strong>CertPilot Web App</strong>.</li>
                  <li>
                    In <strong>Authorized redirect URIs</strong>, paste the exact callback URL below:
                  </li>
                </ul>
              </li>
            </ol>
          </div>

          {/* Callback URI Copy Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="font-bold text-slate-900 block">
              Exact Authorized Redirect URI to copy into Google Cloud Console:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={callbackUrlToUse}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-xs text-slate-800 select-all"
              />
              <button
                type="button"
                onClick={handleCopyCallback}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Add this exact URI under <strong>Authorized redirect URIs</strong> in your OAuth Client ID settings.
            </p>
          </div>

          {/* Environment Variable Code Example */}
          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl space-y-2 font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
              <span>Environment Variables (.env file)</span>
              <span className="text-[10px] text-slate-500">Server-Side Only</span>
            </div>
            <div className="space-y-1 text-emerald-400">
              <p>GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com</p>
              <p>GOOGLE_CLIENT_SECRET=your_client_secret</p>
              <p>GOOGLE_REDIRECT_URI={callbackUrlToUse}</p>
            </div>
          </div>

          {/* Live In-Session Credential Input Form */}
          <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-slate-200">
            <div>
              <h5 className="font-bold text-slate-900 text-xs mb-1">
                Enter Credentials for Current Session
              </h5>
              <p className="text-[11px] text-slate-500">
                You can save credentials into your environment variables or paste them below to activate Gmail OAuth immediately.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Google Client ID *
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="e.g. 1234567890-abcdef.apps.googleusercontent.com"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Google Client Secret *
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="GOCSPX-••••••••••••••••"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Client secret remains strictly on the server backend and is never stored in the browser.
                </p>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Save &amp; Activate OAuth
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
