import React, { useState, useRef } from "react";
import {
  Layers,
  Upload,
  Eye,
  Trash2,
  Edit2,
  Check,
  Plus,
  Sparkles,
  X,
  Copy,
} from "lucide-react";
import { CertificateTemplate } from "../types";
import { useToast } from "../components/Toast";

interface TemplatesPageProps {
  templates: CertificateTemplate[];
  onSelectTemplateToUse: (tpl: CertificateTemplate) => void;
  onUploadTemplate: (tpl: CertificateTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onRenameTemplate: (id: string, newName: string) => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({
  templates,
  onSelectTemplateToUse,
  onUploadTemplate,
  onDeleteTemplate,
  onRenameTemplate,
}) => {
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplate | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const newTemplate: CertificateTemplate = {
          id: `custom-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          category: "Custom",
          imageUrl: dataUrl,
          width: img.naturalWidth || 1920,
          height: img.naturalHeight || 1358,
          createdAt: new Date().toISOString(),
          isCustom: true,
          fields: [
            {
              id: `f-name-${Date.now()}`,
              name: "Recipient Name",
              variable: "{{name}}",
              x: (img.naturalWidth || 1920) / 2,
              y: (img.naturalHeight || 1358) * 0.45,
              width: 1000,
              height: 80,
              fontSize: 48,
              fontFamily: "Playfair Display",
              fontWeight: "bold",
              fontStyle: "italic",
              textAlign: "center",
              textColor: "#0F172A",
              letterSpacing: 2,
              opacity: 1,
              rotation: 0,
            },
            {
              id: `f-course-${Date.now()}`,
              name: "Course Title",
              variable: "{{course}}",
              x: (img.naturalWidth || 1920) / 2,
              y: (img.naturalHeight || 1358) * 0.58,
              width: 900,
              height: 60,
              fontSize: 32,
              fontFamily: "Cinzel",
              fontWeight: "bold",
              fontStyle: "normal",
              textAlign: "center",
              textColor: "#1E3A8A",
              letterSpacing: 2,
              opacity: 1,
              rotation: 0,
            },
          ],
        };

        onUploadTemplate(newTemplate);
        showToast("success", "Template Created", `Loaded ${newTemplate.name}`);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveRename = (id: string) => {
    if (editNameValue.trim()) {
      onRenameTemplate(id, editNameValue.trim());
      showToast("success", "Renamed", "Template name updated.");
    }
    setEditingTemplateId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Certificate Templates Library
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse, preview, and manage certificate background templates for your campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload New Template
          </button>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
          >
            {/* Thumbnail */}
            <div className="relative aspect-[1.414/1] bg-slate-100 overflow-hidden border-b border-slate-100">
              <img
                src={tpl.imageUrl}
                alt={tpl.name}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              />

              <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(tpl)}
                  className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow-md transition-all"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900/80 text-white backdrop-blur-xs">
                {tpl.category}
              </span>

              <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono bg-white/90 text-slate-700 backdrop-blur-xs shadow-2xs font-semibold">
                {tpl.width} × {tpl.height}
              </span>
            </div>

            {/* Info & Title */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                {editingTemplateId === tpl.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      className="text-sm font-bold text-slate-900 border border-blue-400 rounded px-2 py-0.5 w-full focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRename(tpl.id)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{tpl.name}</h3>
                    {tpl.isCustom && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTemplateId(tpl.id);
                          setEditNameValue(tpl.name);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {tpl.fields.length} dynamic mapped fields • {tpl.isCustom ? "Custom Upload" : "Standard"}
                </p>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                {tpl.isCustom ? (
                  <button
                    type="button"
                    onClick={() => onDeleteTemplate(tpl.id)}
                    className="text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">Built-in Template</span>
                )}

                <button
                  type="button"
                  onClick={() => onSelectTemplateToUse(tpl)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Use Template &rarr;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full-Screen Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{previewTemplate.name}</h3>
                <p className="text-xs text-slate-400">
                  {previewTemplate.width} × {previewTemplate.height}px • {previewTemplate.category}
                </p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-100 flex items-center justify-center overflow-auto max-h-[75vh]">
              <img
                src={previewTemplate.imageUrl}
                alt={previewTemplate.name}
                className="max-h-[65vh] object-contain rounded-lg shadow-xl"
              />
            </div>

            <div className="px-6 py-3 bg-white border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const t = previewTemplate;
                  setPreviewTemplate(null);
                  onSelectTemplateToUse(t);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
