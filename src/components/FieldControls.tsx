import React from "react";
import {
  Plus,
  Trash2,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Sparkles,
  Sliders,
  Type,
  MoveHorizontal,
  ChevronDown,
} from "lucide-react";
import { CertificateField } from "../types";

interface FieldControlsProps {
  fields: CertificateField[];
  onFieldsChange: (fields: CertificateField[]) => void;
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  availableColumns: string[];
}

const FONT_FAMILIES = [
  { label: "Playfair Display (Serif Elegance)", value: "Playfair Display" },
  { label: "Cinzel (Classical Academic)", value: "Cinzel" },
  { label: "Great Vibes (Calligraphy Script)", value: "Great Vibes" },
  { label: "Montserrat (Modern Bold)", value: "Montserrat" },
  { label: "Inter (Clean Professional)", value: "Inter" },
  { label: "Plus Jakarta Sans (Crisp Tech)", value: "Plus Jakarta Sans" },
];

const PRESET_COLORS = [
  "#0F172A", // Slate 900
  "#1E293B", // Slate 800
  "#1E3A8A", // Blue 900
  "#0284C7", // Sky 600
  "#AA771C", // Classic Gold
  "#B45309", // Amber 700
  "#047857", // Emerald 700
  "#4C1D95", // Violet 900
  "#FFFFFF", // White
];

export const FieldControls: React.FC<FieldControlsProps> = ({
  fields,
  onFieldsChange,
  selectedFieldId,
  onSelectField,
  availableColumns,
}) => {
  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  // Add new field
  const handleAddField = () => {
    const newId = `field-${Date.now()}`;
    const newField: CertificateField = {
      id: newId,
      name: "New Text Field",
      variable: "Sample Text",
      x: 960, // center of 1920
      y: 700,
      width: 700,
      height: 50,
      fontSize: 28,
      fontFamily: "Inter",
      fontWeight: "normal",
      fontStyle: "normal",
      textAlign: "center",
      textColor: "#0F172A",
      letterSpacing: 1,
      opacity: 1,
      rotation: 0,
    };

    onFieldsChange([...fields, newField]);
    onSelectField(newId);
  };

  // Update specific property of selected field
  const updateSelectedField = (updates: Partial<CertificateField>) => {
    if (!selectedFieldId) return;
    const updated = fields.map((f) => {
      if (f.id === selectedFieldId) {
        return { ...f, ...updates };
      }
      return f;
    });
    onFieldsChange(updated);
  };

  // Duplicate selected field
  const handleDuplicateField = () => {
    if (!selectedField) return;
    const cloneId = `field-${Date.now()}`;
    const clonedField: CertificateField = {
      ...selectedField,
      id: cloneId,
      name: `${selectedField.name} (Copy)`,
      y: selectedField.y + 40,
    };
    onFieldsChange([...fields, clonedField]);
    onSelectField(cloneId);
  };

  // Delete selected field
  const handleDeleteField = () => {
    if (!selectedFieldId) return;
    const filtered = fields.filter((f) => f.id !== selectedFieldId);
    onFieldsChange(filtered);
    onSelectField(null);
  };

  // Align center horizontally
  const handleCenterHorizontally = () => {
    updateSelectedField({ x: 960 }); // 1920 / 2
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 overflow-y-auto text-slate-800">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-600" />
            Field Inspector
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Customize typography, mappings & layout
          </p>
        </div>

        <button
          onClick={handleAddField}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Text
        </button>
      </div>

      {/* Layer / Field Picker */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
          Certificate Layers ({fields.length})
        </label>
        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
          {fields.map((f) => (
            <div
              key={f.id}
              onClick={() => onSelectField(f.id)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                f.id === selectedFieldId
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Type className="w-3.5 h-3.5 flex-shrink-0 opacity-75" />
                <span className="truncate">{f.name || f.variable}</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  f.id === selectedFieldId ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {f.fontSize}px
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Field Properties Panel */}
      {selectedField ? (
        <div className="p-4 space-y-4 text-xs">
          {/* Field Label / Name */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Field Label</label>
            <input
              type="text"
              value={selectedField.name}
              onChange={(e) => updateSelectedField({ name: e.target.value })}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
              placeholder="e.g. Recipient Name"
            />
          </div>

          {/* Dynamic Variable / Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Text / Dynamic Variable</label>
              <span className="text-[10px] text-blue-600 font-medium">Use &#123;&#123;tag&#125;&#125;</span>
            </div>
            <textarea
              rows={2}
              value={selectedField.variable}
              onChange={(e) => updateSelectedField({ variable: e.target.value })}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-blue-500 resize-none text-xs"
              placeholder="e.g. {{name}} or Certificate of Excellence"
            />

            {/* Quick Tag Insert Chips */}
            <div className="mt-1.5">
              <span className="text-[10px] text-slate-400 block mb-1">Available Spreadsheet Tags:</span>
              <div className="flex flex-wrap gap-1">
                {availableColumns.length > 0 ? (
                  availableColumns.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => updateSelectedField({ variable: `{{${col.toLowerCase()}}}` })}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-mono text-[10px] border border-slate-200 transition-colors"
                    >
                      &#123;&#123;{col.toLowerCase()}&#125;&#125;
                    </button>
                  ))
                ) : (
                  <>
                    {["name", "course", "date", "certificate_id"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => updateSelectedField({ variable: `{{${tag}}}` })}
                        className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-mono text-[10px] border border-slate-200 transition-colors"
                      >
                        &#123;&#123;{tag}&#125;&#125;
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Typography: Font Family */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Font Family</label>
            <select
              value={selectedField.fontFamily}
              onChange={(e) => updateSelectedField({ fontFamily: e.target.value })}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 text-xs"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Size and Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Font Size</label>
                <span className="font-mono text-slate-500">{selectedField.fontSize}px</span>
              </div>
              <input
                type="range"
                min={12}
                max={120}
                value={selectedField.fontSize}
                onChange={(e) => updateSelectedField({ fontSize: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedField.textColor}
                  onChange={(e) => updateSelectedField({ textColor: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={selectedField.textColor}
                  onChange={(e) => updateSelectedField({ textColor: e.target.value })}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Quick Color Presets */}
          <div className="flex items-center gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updateSelectedField({ textColor: c })}
                className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>

          {/* Text Style: Align & Weight */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">Alignment & Style</label>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => updateSelectedField({ textAlign: "left" })}
                className={`flex-1 py-1 flex items-center justify-center rounded ${
                  selectedField.textAlign === "left" ? "bg-white shadow-xs font-bold text-blue-600" : "text-slate-600"
                }`}
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateSelectedField({ textAlign: "center" })}
                className={`flex-1 py-1 flex items-center justify-center rounded ${
                  selectedField.textAlign === "center" ? "bg-white shadow-xs font-bold text-blue-600" : "text-slate-600"
                }`}
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateSelectedField({ textAlign: "right" })}
                className={`flex-1 py-1 flex items-center justify-center rounded ${
                  selectedField.textAlign === "right" ? "bg-white shadow-xs font-bold text-blue-600" : "text-slate-600"
                }`}
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-slate-300 mx-1" />
              <button
                type="button"
                onClick={() =>
                  updateSelectedField({
                    fontWeight: selectedField.fontWeight === "bold" ? "normal" : "bold",
                  })
                }
                className={`flex-1 py-1 flex items-center justify-center rounded ${
                  selectedField.fontWeight === "bold" ? "bg-white shadow-xs font-bold text-blue-600" : "text-slate-600"
                }`}
                title="Toggle Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  updateSelectedField({
                    fontStyle: selectedField.fontStyle === "italic" ? "normal" : "italic",
                  })
                }
                className={`flex-1 py-1 flex items-center justify-center rounded ${
                  selectedField.fontStyle === "italic" ? "bg-white shadow-xs font-bold text-blue-600" : "text-slate-600"
                }`}
                title="Toggle Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Letter Spacing & Opacity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Letter Spacing</label>
                <span className="font-mono text-slate-500">{selectedField.letterSpacing || 0}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={15}
                value={selectedField.letterSpacing || 0}
                onChange={(e) => updateSelectedField({ letterSpacing: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Opacity</label>
                <span className="font-mono text-slate-500">{Math.round((selectedField.opacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={selectedField.opacity ?? 1}
                onChange={(e) => updateSelectedField({ opacity: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>
          </div>

          {/* Rotation & Center Horizontally Action */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Rotation:</span>
              <span className="font-mono text-slate-700 font-semibold">{selectedField.rotation || 0}°</span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              value={selectedField.rotation || 0}
              onChange={(e) => updateSelectedField({ rotation: Number(e.target.value) })}
              className="w-full accent-blue-600"
            />

            <button
              type="button"
              onClick={handleCenterHorizontally}
              className="w-full mt-2 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-colors"
            >
              <MoveHorizontal className="w-3.5 h-3.5 text-blue-600" />
              Center Horizontally on Canvas
            </button>
          </div>

          {/* Action buttons: Duplicate & Delete */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDuplicateField}
              className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Duplicate
            </button>
            <button
              type="button"
              onClick={handleDeleteField}
              className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400">
          <Type className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="font-medium text-xs">Select any field on the canvas or layer list to customize its properties.</p>
        </div>
      )}
    </div>
  );
};
