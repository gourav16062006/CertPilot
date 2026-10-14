import React, { useState } from "react";
import {
  Users,
  Plus,
  Trash2,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Sparkles,
} from "lucide-react";
import { Recipient } from "../types";
import { SpreadsheetUploader } from "../components/SpreadsheetUploader";
import { downloadSampleSpreadsheet } from "../utils/excelParser";
import { useToast } from "../components/Toast";

interface RecipientsPageProps {
  recipients: Recipient[];
  onChangeRecipients: (recipients: Recipient[]) => void;
  availableColumns: string[];
  onChangeColumns: (cols: string[]) => void;
  onProceedToCreate: () => void;
}

export const RecipientsPage: React.FC<RecipientsPageProps> = ({
  recipients,
  onChangeRecipients,
  availableColumns,
  onChangeColumns,
  onProceedToCreate,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newDate, setNewDate] = useState("14 September 2026");
  const { showToast } = useToast();

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      showToast("error", "Validation Error", "Name and Email are required.");
      return;
    }

    const newRecipient: Recipient = {
      _id: `rec-manual-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      course: newCourse.trim() || "Web Development",
      date: newDate.trim(),
      certificate_id: `WM-2026-${String(recipients.length + 1).padStart(4, "0")}`,
      _status: "pending",
    };

    onChangeRecipients([newRecipient, ...recipients]);
    showToast("success", "Recipient Added", `Added ${newName}`);
    setNewName("");
    setNewEmail("");
    setNewCourse("");
    setIsAddModalOpen(false);
  };

  const handleDeleteRecipient = (id: string) => {
    onChangeRecipients(recipients.filter((r) => r._id !== id));
    showToast("info", "Removed", "Recipient removed from list.");
  };

  const filtered = recipients.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.course && r.course.toLowerCase().includes(q)) ||
      (r.certificate_id && r.certificate_id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Recipients Directory ({recipients.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage recipient lists, inspect parsed spreadsheet headers, and validate email syntax.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Single Recipient
          </button>
          <button
            onClick={onProceedToCreate}
            disabled={recipients.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Design Certificates &rarr;
          </button>
        </div>
      </div>

      {/* Spreadsheet Upload Component */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <SpreadsheetUploader
          recipients={recipients}
          onRecipientsChange={onChangeRecipients}
          availableColumns={availableColumns}
          onColumnsChange={onChangeColumns}
        />
      </div>

      {/* Add Single Recipient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Add Individual Recipient</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSingle} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Course / Event Title</label>
                <input
                  type="text"
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  placeholder="e.g. Full Stack Engineering"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Issue Date</label>
                <input
                  type="text"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  placeholder="14 September 2026"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Add Recipient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
