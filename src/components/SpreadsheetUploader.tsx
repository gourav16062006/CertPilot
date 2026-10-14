import React, { useRef, useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Users,
  Search,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Recipient } from "../types";
import { parseSpreadsheet, downloadSampleSpreadsheet } from "../utils/excelParser";
import { SAMPLE_RECIPIENTS } from "../utils/sampleTemplates";
import { useToast } from "./Toast";

interface SpreadsheetUploaderProps {
  recipients: Recipient[];
  onRecipientsChange: (recipients: Recipient[]) => void;
  availableColumns: string[];
  onColumnsChange: (columns: string[]) => void;
}

export const SpreadsheetUploader: React.FC<SpreadsheetUploaderProps> = ({
  recipients,
  onRecipientsChange,
  availableColumns,
  onColumnsChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const validExtensions = [".xlsx", ".xls", ".csv"];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      showToast("error", "Unsupported File", "Please upload an Excel (.xlsx, .xls) or CSV file.");
      return;
    }

    try {
      setIsProcessing(true);
      const result = await parseSpreadsheet(file);

      if (result.recipients.length === 0) {
        showToast("error", "Empty Spreadsheet", "No recipient records found in this file.");
        return;
      }

      onRecipientsChange(result.recipients);
      onColumnsChange(result.columns);

      if (!result.hasEmailColumn) {
        showToast(
          "warning",
          "Email Column Missing",
          "We could not find an obvious 'Email' column. You can still generate certificates, but email sending requires recipient emails."
        );
      } else {
        showToast(
          "success",
          "File Parsed Successfully",
          `Loaded ${result.recipients.length} recipients with columns: ${result.columns.join(", ")}`
        );
      }
    } catch (err: any) {
      console.error(err);
      showToast("error", "Spreadsheet Parsing Error", err.message || "Failed to parse file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const loadSampleData = () => {
    onRecipientsChange(SAMPLE_RECIPIENTS);
    onColumnsChange(["Name", "Email", "Course", "Date", "Certificate ID"]);
    showToast("success", "Sample Data Loaded", "6 sample recipients loaded with courses & credential IDs.");
  };

  const handleClearRecipients = () => {
    onRecipientsChange([]);
    onColumnsChange([]);
    showToast("info", "Recipients Cleared", "Recipient list has been reset.");
  };

  // Filtered recipients for the preview table
  const filteredRecipients = recipients.filter((r) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(query) ||
      r.email.toLowerCase().includes(query) ||
      (r.course && r.course.toLowerCase().includes(query)) ||
      (r.certificate_id && r.certificate_id.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-50/60 scale-[0.99]"
            : "border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center mb-3.5 shadow-xs">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-base font-bold text-slate-800">
          Upload Recipient Data Spreadsheet
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Drag & drop your Excel (<span className="font-mono text-slate-700">.xlsx, .xls</span>) or CSV file here, or click to browse.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 font-medium">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Auto Column Detection
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Supports &#123;&#123;name&#125;&#125;, &#123;&#123;course&#125;&#125;, etc.
          </span>
        </div>
      </div>

      {/* Quick Action Helpers */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSampleData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition-colors border border-blue-200/60"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Load Sample Dataset (6 Recipients)
          </button>

          <button
            type="button"
            onClick={() => downloadSampleSpreadsheet("xlsx")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Excel Template
          </button>
        </div>

        {recipients.length > 0 && (
          <button
            type="button"
            onClick={handleClearRecipients}
            className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Recipients
          </button>
        )}
      </div>

      {/* Recipients Table Preview */}
      {recipients.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-900 text-sm">
                Recipients Preview ({recipients.length})
              </span>
              <span className="text-xs text-slate-400">
                • {availableColumns.length} detected columns
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipient..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Column tags */}
          <div className="px-4 py-2 bg-slate-50/60 border-b border-slate-100 flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-slate-400 font-medium">Mapped Headers:</span>
            {availableColumns.map((col) => (
              <span
                key={col}
                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-slate-700 shadow-2xs"
              >
                &#123;&#123;{col.toLowerCase()}&#125;&#125;
              </span>
            ))}
          </div>

          {/* Table Rows */}
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Recipient Name</th>
                  <th className="py-2.5 px-4">Email Address</th>
                  <th className="py-2.5 px-4">Course / Event</th>
                  <th className="py-2.5 px-4">Certificate ID</th>
                  <th className="py-2.5 px-4">Issue Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredRecipients.slice(0, 50).map((r, i) => (
                  <tr key={r._id || i} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-2 px-4 font-mono text-slate-400">{i + 1}</td>
                    <td className="py-2 px-4 font-semibold text-slate-900">{r.name}</td>
                    <td className="py-2 px-4 text-slate-600 font-mono">{r.email || "—"}</td>
                    <td className="py-2 px-4 text-slate-600 truncate max-w-xs">{r.course || "—"}</td>
                    <td className="py-2 px-4 font-mono text-slate-500">{r.certificate_id || "—"}</td>
                    <td className="py-2 px-4 text-slate-500">{r.date || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {recipients.length > 50 && (
            <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
              Showing first 50 of {recipients.length} recipients. All {recipients.length} will be generated.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
