import React from "react";
import { X, CheckCircle2, Mail, Award, FileSpreadsheet, Sliders, Send } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight">CertPilot User Guide & Architecture</h3>
            <p className="text-xs text-blue-200 mt-1">
              Complete workflow for certificate design, automated personalization, & bulk email delivery
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 text-sm text-slate-600">
          <div>
            <h4 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              1. 5-Step Workflow Overview
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block text-sm mb-1">Step 1: Template</span>
                Upload your certificate graphic (PNG/JPG) or select one of our 4 pre-made high-res templates.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block text-sm mb-1">Step 2: Recipients</span>
                Upload Excel (`.xlsx`, `.xls`) or `.csv`. The app auto-detects column headers like Name, Email, Course, etc.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block text-sm mb-1">Step 3: Canvas Mapping</span>
                Drag and drop dynamic tags (e.g. &#123;&#123;name&#125;&#125;, &#123;&#123;course&#125;&#125;). Customize typography, color, size, and alignments.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block text-sm mb-1">Step 4: Generate & ZIP</span>
                Preview any recipient live. Generate all personalized certificates at native resolution and download as a ZIP!
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
                <span className="font-bold text-slate-800 block text-sm mb-1">Step 5: Bulk Mailer</span>
                Compose your email template with dynamic tags. Send certificates as personalized attachments with real-time status tracking!
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h4 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              2. SMTP Configuration & Gmail Setup
            </h4>
            <p className="mb-2 text-xs leading-relaxed">
              CertPilot connects directly to standard SMTP servers (Gmail, Outlook, Amazon SES, Brevo, SendGrid, etc.).
            </p>
            <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl space-y-2 text-xs text-blue-900">
              <span className="font-bold block text-sm text-blue-950">How to use Gmail SMTP:</span>
              <ul className="list-disc pl-5 space-y-1">
                <li>Host: <code className="font-mono bg-white px-1.5 py-0.5 rounded">smtp.gmail.com</code> | Port: <code className="font-mono bg-white px-1.5 py-0.5 rounded">465</code> (SSL)</li>
                <li>Username: Your full Gmail address (e.g. <code className="font-mono bg-white px-1.5 py-0.5 rounded">yourname@gmail.com</code>)</li>
                <li><strong>Password:</strong> Use a Google <em>App Password</em> (not your normal password):
                  <span className="block mt-0.5 text-slate-600">
                    Go to your Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App Passwords &rarr; Generate 16-character key.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h4 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              3. Demo Mode (Zero Setup Needed)
            </h4>
            <p className="text-xs leading-relaxed">
              When <strong>Demo Mode</strong> is enabled in Settings, the full application functions immediately without requiring any SMTP credentials. You can parse sample data, render high-res certificates, download individual PNGs or ZIP archives, and simulate realistic bulk email delivery with live progress tracking!
            </p>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h4 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-600" />
              4. Dynamic Variables
            </h4>
            <p className="text-xs leading-relaxed mb-2">
              Any column in your spreadsheet can be used both on the Certificate canvas and inside the Email Subject & Body:
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">&#123;&#123;name&#125;&#125;</span>
              <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">&#123;&#123;email&#125;&#125;</span>
              <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">&#123;&#123;course&#125;&#125;</span>
              <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">&#123;&#123;date&#125;&#125;</span>
              <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">&#123;&#123;certificate_id&#125;&#125;</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Got it, Let's Start
          </button>
        </div>
      </div>
    </div>
  );
};
