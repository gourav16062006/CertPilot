import React, { useState } from "react";
import {
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Trash2,
  Filter,
  FileCheck,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { EmailLog } from "../types";
import { storage } from "../utils/storage";
import { useToast } from "../components/Toast";

interface EmailHistoryPageProps {
  emailLogs: EmailLog[];
  onClearLogs: () => void;
  onRetryEmail: (log: EmailLog) => void;
}

export const EmailHistoryPage: React.FC<EmailHistoryPageProps> = ({
  emailLogs,
  onClearLogs,
  onRetryEmail,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "failed">("all");
  const { showToast } = useToast();

  const total = emailLogs.length;
  const sentCount = emailLogs.filter((l) => l.status === "sent").length;
  const failedCount = emailLogs.filter((l) => l.status === "failed").length;

  const filteredLogs = emailLogs.filter((log) => {
    const matchesFilter = statusFilter === "all" || log.status === statusFilter;
    if (!matchesFilter) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.recipientName.toLowerCase().includes(q) ||
      log.recipientEmail.toLowerCase().includes(q) ||
      (log.campaignName && log.campaignName.toLowerCase().includes(q)) ||
      log.certificateFilename.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Email Dispatch Logs & Tracking
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit logs for all sent certificates, timestamps, delivery states, and error diagnostics.
          </p>
        </div>

        {total > 0 && (
          <button
            type="button"
            onClick={onClearLogs}
            className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Log History
          </button>
        )}
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Emails Logged</span>
            <span className="text-2xl font-bold text-slate-900 block mt-0.5">{total}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            {total}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-600 font-medium">Successfully Sent / Simulated</span>
            <span className="text-2xl font-bold text-emerald-700 block mt-0.5">{sentCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-600 font-medium">Failed Dispatches</span>
            <span className="text-2xl font-bold text-rose-700 block mt-0.5">{failedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              statusFilter === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Dispatches ({total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("sent")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              statusFilter === "sent" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-emerald-700"
            }`}
          >
            Sent ({sentCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("failed")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              statusFilter === "failed" ? "bg-white text-rose-700 shadow-2xs" : "text-slate-600 hover:text-rose-700"
            }`}
          >
            Failed ({failedCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipient or file..."
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Campaign</th>
                  <th className="py-3 px-4">Certificate File</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.recipientName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{log.recipientEmail}</div>
                      {log.senderEmail && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                          <span className="font-semibold text-slate-600">From:</span>
                          <span>{log.senderEmail}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {log.campaignName || "General Campaign"}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <FileCheck className="w-3 h-3 text-blue-600" />
                        {log.certificateFilename}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {log.status === "sent" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {log.isDemo ? "Simulated" : "Sent"}
                          {log.isDemo && (
                            <span className="text-[9px] font-semibold bg-amber-100 text-amber-800 px-1 py-0.5 rounded ml-0.5 border border-amber-200">
                              Demo
                            </span>
                          )}
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Failed
                          </span>
                          {log.error && (
                            <p className="text-[10px] text-rose-600 max-w-xs truncate">
                              <span className="font-semibold">Reason:</span> {log.error}
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{log.sentAt}</td>

                    <td className="py-3 px-4 text-right">
                      {log.status === "failed" ? (
                        <button
                          type="button"
                          onClick={() => onRetryEmail(log)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Retry
                        </button>
                      ) : (
                        <span className="text-slate-300 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Clock className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-sm text-slate-700">No Email History Found</p>
            <p className="text-xs">
              {statusFilter !== "all"
                ? `No emails with status "${statusFilter}".`
                : "When you dispatch emails via the Bulk Mailer, each delivery record will be tracked here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
