import React, { useRef, useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  Check,
  Trash2,
  Sparkles,
  Plus,
} from "lucide-react";
import { CertificateTemplate } from "../types";
import { useToast } from "./Toast";

interface TemplateSelectorProps {
  templates: CertificateTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (template: CertificateTemplate) => void;
  onUploadCustomTemplate: (template: CertificateTemplate) => void;
  onDeleteCustomTemplate: (templateId: string) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onUploadCustomTemplate,
  onDeleteCustomTemplate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { showToast } = useToast();

  const handleImageUpload = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("error", "Invalid File Type", "Please upload a valid PNG or JPG certificate template.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const newTemplate: CertificateTemplate = {
          id: `custom-tpl-${Date.now()}`,
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
            {
              id: `f-date-${Date.now()}`,
              name: "Date & ID",
              variable: "Awarded {{date}} • Credential ID: {{certificate_id}}",
              x: (img.naturalWidth || 1920) / 2,
              y: (img.naturalHeight || 1358) * 0.72,
              width: 700,
              height: 35,
              fontSize: 18,
              fontFamily: "Inter",
              fontWeight: "normal",
              fontStyle: "normal",
              textAlign: "center",
              textColor: "#64748B",
              letterSpacing: 1,
              opacity: 1,
              rotation: 0,
            },
          ],
        };

        onUploadCustomTemplate(newTemplate);
        onSelectTemplate(newTemplate);
        showToast("success", "Template Uploaded", `Custom template loaded (${img.naturalWidth}x${img.naturalHeight}px)`);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Upload Custom Image Area */}
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
            handleImageUpload(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-50/60 scale-[0.99]"
            : "border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleImageUpload(e.target.files[0]);
            }
          }}
        />

        <div className="w-12 h-12 mx-auto rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2 shadow-xs">
          <Upload className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-slate-800 text-sm">Upload Custom Certificate Background</h4>
        <p className="text-xs text-slate-500 mt-0.5">
          PNG or JPG (recommended: 1920 × 1080 or A4 landscape high-resolution)
        </p>
      </div>

      {/* Available Templates Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Available Certificate Templates ({templates.length})
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((tpl) => {
            const isSelected = tpl.id === selectedTemplateId;
            return (
              <div
                key={tpl.id}
                onClick={() => onSelectTemplate(tpl)}
                className={`group relative rounded-2xl border bg-white overflow-hidden cursor-pointer transition-all duration-200 flex flex-col ${
                  isSelected
                    ? "border-blue-600 ring-2 ring-blue-600/20 shadow-md"
                    : "border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm"
                }`}
              >
                {/* Image Thumbnail */}
                <div className="relative aspect-[1.414/1] bg-slate-100 overflow-hidden border-b border-slate-100">
                  <img
                    src={tpl.imageUrl}
                    alt={tpl.name}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />

                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900/70 text-white backdrop-blur-xs">
                    {tpl.category}
                  </span>
                </div>

                {/* Info & Actions */}
                <div className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-xs text-slate-900 truncate">{tpl.name}</h5>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {tpl.width} × {tpl.height}px
                    </p>
                  </div>

                  {tpl.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustomTemplate(tpl.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                      title="Delete Custom Template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
