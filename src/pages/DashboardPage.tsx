import React from "react";
import {
  Award,
  Send,
  Clock,
  AlertCircle,
  PlusCircle,
  Play,
  ArrowRight,
  FileCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Campaign, EmailLog, CertificateTemplate } from "../types";

interface DashboardPageProps {
  campaigns: Campaign[];
  emailLogs: EmailLog[];
  templates: CertificateTemplate[];
  onNavigateTab: (tab: any) => void;
  onQuickStart: () => void;
  onCreateNewCampaign: () => void;
  isDemoMode: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  campaigns,
  emailLogs,
  templates,
  onNavigateTab,
  onQuickStart,
  onCreateNewCampaign,
  isDemoMode,
}) => {
  // Aggregate stats
  const totalCertificatesGenerated = Math.max(
    campaigns.reduce((acc, c) => acc + (c.generatedCount || 0), 0),
    emailLogs.length
  );
  const emailsSent = emailLogs.filter((l) => l.status === "sent").length;
  const emailsFailed = emailLogs.filter((l) => l.status === "failed").length;
  const emailsPending = emailLogs.filter((l) => l.status === "pending").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-blue-900/30">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>CertPilot — Create. Personalize. Deliver.</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            Personalize, Generate & Bulk Mail Certificates in Seconds
          </h1>

          <p className="text-sm text-blue-100/80 leading-relaxed max-w-xl">
            Upload your certificate background, map your Excel or CSV columns, render dynamic certificates on high-res canvas, and dispatch them to hundreds of recipients with SMTP automation.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={onCreateNewCampaign}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              Create New Certificate Campaign
            </button>

            <button
              onClick={onQuickStart}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/20 flex items-center gap-2 transition-all"
            >
              <Play className="w-3.5 h-3.5 text-sky-400" />
              Quick Demo Walkthrough
            </button>
          </div>
        </div>

        {/* Decorative corner glow */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-24 top-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Generated */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 block">Total Generated</span>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {totalCertificatesGenerated}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">High-Res PNGs</span>
          </div>
        </div>

        {/* Emails Sent */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 block">
              {isDemoMode ? "Emails Sent / Simulated" : "Emails Sent"}
            </span>
            <span className="text-2xl font-bold text-emerald-700 tracking-tight">
              {emailsSent}
            </span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">
              {isDemoMode ? "Simulated Inboxes" : "Delivered to Inboxes"}
            </span>
          </div>
        </div>

        {/* Emails Pending */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 block">Emails Pending</span>
            <span className="text-2xl font-bold text-amber-700 tracking-tight">
              {emailsPending || 0}
            </span>
            <span className="text-[11px] text-amber-600 block mt-0.5">Queued in Dispatcher</span>
          </div>
        </div>

        {/* Emails Failed */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 block">Emails Failed</span>
            <span className="text-2xl font-bold text-rose-700 tracking-tight">
              {emailsFailed || 0}
            </span>
            <span className="text-[11px] text-rose-600 block mt-0.5">Retry Available</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section: Recent Campaigns (left 8) & Recent Email Activity (right 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Recent Campaigns */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Recent Certificate Campaigns
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Saved campaigns with templates, recipients & sending states
              </p>
            </div>

            <button
              onClick={onCreateNewCampaign}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              + Create Campaign
            </button>
          </div>

          {campaigns.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{camp.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          camp.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : camp.status === "sending"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {camp.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Template: <span className="font-medium text-slate-700">{camp.templateName}</span> •{" "}
                      {camp.recipients?.length || 0} Recipients • Created {new Date(camp.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigateTab("create")}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors"
                    >
                      Open Editor
                    </button>
                    <button
                      onClick={() => onNavigateTab("mailer")}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
                    >
                      Bulk Mailer &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
              <Award className="w-10 h-10 text-slate-400 mx-auto" />
              <div>
                <h4 className="font-bold text-slate-800 text-sm">No Campaigns Created Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Start your first certificate campaign with our pre-made templates or upload your own background.
                </p>
              </div>
              <button
                onClick={onQuickStart}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs inline-flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                Launch Quick Demo Campaign
              </button>
            </div>
          )}
        </div>

        {/* Right: Recent Email Activity */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Send className="w-4 h-4 text-emerald-600" />
                Recent Email Activity
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Live delivery log stream</p>
            </div>

            <button
              onClick={() => onNavigateTab("history")}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All
            </button>
          </div>

          {emailLogs.length > 0 ? (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 text-xs">
              {emailLogs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 truncate max-w-[140px]">
                      {log.recipientName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.status === "sent"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {log.status === "sent" ? "Delivered" : "Failed"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{log.recipientEmail}</p>
                  <p className="text-[10px] text-slate-400">{log.sentAt}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs space-y-2">
              <Clock className="w-6 h-6 mx-auto text-slate-300" />
              <p>No emails dispatched yet.</p>
              <p className="text-[11px] text-slate-400">
                Bulk sending logs will appear here in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
