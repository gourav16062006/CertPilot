import React, { useState, useEffect } from "react";
import {
  Menu,
  HelpCircle,
  Sparkles,
  PlusCircle,
  Play,
  CheckCircle,
  User,
  ShieldAlert,
  LogOut,
  Download,
  Award,
} from "lucide-react";
import { HelpModal } from "./HelpModal";
import { GmailAccount } from "../types";

interface HeaderProps {
  currentProjectName?: string;
  onOpenMobileSidebar: () => void;
  onQuickStart: () => void;
  onCreateNewCampaign: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  gmailAccount?: GmailAccount;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  onQuickStart,
  onCreateNewCampaign,
  isDemoMode,
  onToggleDemoMode,
  gmailAccount,
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      <header className="h-16 px-4 md:px-8 bg-white border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-30">
        {/* Left Side: Navigation & Workspace Context */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Brand (visible when sidebar drawer is hidden on small screens) */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Award className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">CertPilot</span>
          </div>

          {/* Desktop Workspace Indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400 uppercase tracking-wider">
              Workspace
            </span>
            <span className="text-slate-300 font-light">/</span>
            <span className="font-semibold text-slate-700">
              Certificate Studio
            </span>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Gmail / Delivery Status Badge */}
          {gmailAccount?.connected ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Live Gmail:</span>
              <span className="font-mono">{gmailAccount.email}</span>
            </div>
          ) : (
            <button
              onClick={onToggleDemoMode}
              title={isDemoMode ? "Emails are simulated. Connect Gmail in Settings to send real emails." : "Demo Mode Active"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                isDemoMode
                  ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Demo Mode (Simulated)</span>
            </button>
          )}

          {/* Quick Start Button */}
          <button
            onClick={onQuickStart}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-blue-600" />
            Quick Demo
          </button>

          {/* Create Campaign */}
          <button
            onClick={onCreateNewCampaign}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Campaign</span>
            <span className="sm:hidden">New</span>
          </button>

          {/* Help Button */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Help & Guides"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 transition-colors"
            >
              <User className="w-4 h-4" />
            </button>

            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-30 text-xs">
                  <div className="pb-2 mb-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-900">Administrator</p>
                    <p className="text-slate-500 truncate">admin@certpilot.local</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between py-1 text-slate-600">
                      <span>SMTP Status:</span>
                      <span className="font-semibold text-slate-900">
                        {isDemoMode ? "Simulated" : "Configured"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 text-slate-600">
                      <span>Storage:</span>
                      <span className="font-semibold text-slate-900">Local Browser</span>
                    </div>
                    {isInstallable && (
                      <div className="pt-2 mt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            handleInstallClick();
                          }}
                          className="w-full py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold flex items-center justify-center gap-1.5 text-xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Install CertPilot App
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};
