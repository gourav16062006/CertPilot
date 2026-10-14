import React, { useState, useEffect, useRef } from "react";
import {
  Layers,
  Users,
  Sliders,
  Eye,
  Download,
  Send,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Archive,
  FileDown,
  Loader2,
  Maximize2,
  RefreshCw,
} from "lucide-react";
import {
  CertificateTemplate,
  CertificateField,
  Recipient,
  Campaign,
  SmtpSettings,
} from "../types";
import { TemplateSelector } from "../components/TemplateSelector";
import { SpreadsheetUploader } from "../components/SpreadsheetUploader";
import { CanvasEditor } from "../components/CanvasEditor";
import { FieldControls } from "../components/FieldControls";
import {
  generateSingleCertificatePng,
  sanitizeFilename,
  loadCertificateImage,
  renderCertificateCanvas,
} from "../utils/canvasRenderer";
import { createCertificatesZip, triggerDownload } from "../utils/zipGenerator";
import { useToast } from "../components/Toast";
import { storage } from "../utils/storage";

interface CreateCertificatePageProps {
  templates: CertificateTemplate[];
  activeTemplate: CertificateTemplate;
  onChangeTemplate: (template: CertificateTemplate) => void;
  recipients: Recipient[];
  onChangeRecipients: (recipients: Recipient[]) => void;
  availableColumns: string[];
  onChangeColumns: (columns: string[]) => void;
  fields: CertificateField[];
  onChangeFields: (fields: CertificateField[]) => void;
  onUploadCustomTemplate: (template: CertificateTemplate) => void;
  onDeleteCustomTemplate: (templateId: string) => void;
  onProceedToMailer: () => void;
  currentCampaignName: string;
  onChangeCampaignName: (name: string) => void;
}

type WizardStep = 1 | 2 | 3 | 4;

export const CreateCertificatePage: React.FC<CreateCertificatePageProps> = ({
  templates,
  activeTemplate,
  onChangeTemplate,
  recipients,
  onChangeRecipients,
  availableColumns,
  onChangeColumns,
  fields,
  onChangeFields,
  onUploadCustomTemplate,
  onDeleteCustomTemplate,
  onProceedToMailer,
  currentCampaignName,
  onChangeCampaignName,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [previewRecipientIdx, setPreviewRecipientIdx] = useState<number>(0);

  // Generation & ZIP states
  const [isGeneratingBatch, setIsGeneratingBatch] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; percent: number }>({
    current: 0,
    total: 0,
    percent: 0,
  });
  const [generatedCertificates, setGeneratedCertificates] = useState<
    Array<{ recipient: Recipient; dataUrl: string; filename: string }>
  >([]);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const { showToast } = useToast();

  const currentRecipient = recipients[previewRecipientIdx] || recipients[0] || null;

  // Render live preview in Step 4
  useEffect(() => {
    if (currentStep === 4 && previewCanvasRef.current && activeTemplate) {
      loadCertificateImage(activeTemplate.imageUrl).then((img) => {
        if (!previewCanvasRef.current) return;
        renderCertificateCanvas({
          canvas: previewCanvasRef.current,
          templateImage: img,
          fields,
          recipient: currentRecipient,
          isExport: false,
          scale: 0.5,
        });
      });
    }
  }, [currentStep, previewRecipientIdx, fields, currentRecipient, activeTemplate]);

  // Step 4: Download current single certificate PNG
  const handleDownloadCurrent = async () => {
    if (!currentRecipient) {
      showToast("error", "No Recipient", "Please select a recipient first.");
      return;
    }
    try {
      showToast("info", "Rendering...", "Generating high-resolution certificate...");
      const img = await loadCertificateImage(activeTemplate.imageUrl);
      const dataUrl = await generateSingleCertificatePng(img, fields, currentRecipient);
      const filename = sanitizeFilename(currentRecipient.name);
      triggerDownload(dataUrl, filename);
      showToast("success", "Downloaded", `Saved ${filename}`);
    } catch (err: any) {
      showToast("error", "Generation Failed", err.message || "Could not generate certificate");
    }
  };

  // Step 4: Batch generate all certificates
  const handleGenerateAll = async () => {
    if (recipients.length === 0) {
      showToast("error", "No Recipients", "Please upload or add recipients in Step 2.");
      return;
    }

    setIsGeneratingBatch(true);
    setBatchProgress({ current: 0, total: recipients.length, percent: 0 });

    try {
      const img = await loadCertificateImage(activeTemplate.imageUrl);
      const batchResult: Array<{ recipient: Recipient; dataUrl: string; filename: string }> = [];

      for (let i = 0; i < recipients.length; i++) {
        const r = recipients[i];
        const dataUrl = await generateSingleCertificatePng(img, fields, r);
        const filename = sanitizeFilename(r.name);

        batchResult.push({
          recipient: r,
          dataUrl,
          filename,
        });

        const current = i + 1;
        const percent = Math.round((current / recipients.length) * 100);
        setBatchProgress({ current, total: recipients.length, percent });

        // Yield to allow UI update
        await new Promise((res) => setTimeout(res, 20));
      }

      setGeneratedCertificates(batchResult);

      // Save campaign progress to local storage
      const campaign: Campaign = {
        id: `camp-${Date.now()}`,
        name: currentCampaignName || "Certificate Campaign",
        templateId: activeTemplate.id,
        templateName: activeTemplate.name,
        recipients,
        templateFields: fields,
        emailSubject: "Congratulations {{name}} — Your Certificate",
        emailBody:
          "Hello {{name}},\n\nCongratulations on successfully completing {{course}}.\n\nPlease find your certificate attached to this email.\n\nBest regards,\nCertPilot Team",
        status: "generated",
        generatedCount: batchResult.length,
        sentCount: 0,
        failedCount: 0,
        createdAt: new Date().toISOString(),
      };
      storage.saveCampaign(campaign);

      showToast(
        "success",
        "Certificates Generated!",
        `Successfully generated ${batchResult.length} personalized high-resolution certificates.`
      );
    } catch (err: any) {
      console.error(err);
      showToast("error", "Batch Generation Error", err.message || "Failed to generate certificates");
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  // Step 4: Download all as ZIP
  const handleDownloadZip = async () => {
    if (generatedCertificates.length === 0) {
      showToast("info", "Generating...", "Generating certificates before zipping...");
      await handleGenerateAll();
    }

    setIsZipping(true);
    try {
      const blob = await createCertificatesZip(generatedCertificates);
      const zipName = `${(currentCampaignName || "Certificates").replace(/\s+/g, "_")}_Batch.zip`;
      triggerDownload(blob, zipName);
      showToast("success", "ZIP Downloaded", `Saved ${zipName}`);
    } catch (err: any) {
      console.error(err);
      showToast("error", "ZIP Error", "Failed to compress certificates.");
    } finally {
      setIsZipping(false);
    }
  };

  const steps = [
    { num: 1, label: "Template", icon: Layers },
    { num: 2, label: "Recipients", icon: Users },
    { num: 3, label: "Canvas Editor", icon: Sliders },
    { num: 4, label: "Generate & ZIP", icon: Eye },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Wizard Steps Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Campaign Name Input */}
          <div className="max-w-xs">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
              Campaign Name
            </label>
            <input
              type="text"
              value={currentCampaignName}
              onChange={(e) => onChangeCampaignName(e.target.value)}
              placeholder="e.g. Annual Tech Summit 2026"
              className="font-bold text-sm text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-600 focus:outline-none w-full pb-0.5"
            />
          </div>

          {/* Stepper Navigation */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0">
            {steps.map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.num;
              const isPast = currentStep > step.num;

              return (
                <button
                  key={step.num}
                  onClick={() => setCurrentStep(step.num as WizardStep)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : isPast
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      isActive
                        ? "bg-white text-blue-600 font-bold"
                        : isPast
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isPast ? "✓" : step.num}
                  </span>
                  <span className="whitespace-nowrap">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[560px]">
        {/* Step 1: Upload or Choose Template */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    Step 1: Choose or Upload Certificate Background
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select one of our four pre-built certificate designs or upload your organization's custom PNG/JPG.
                  </p>
                </div>

                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  Next: Recipient Data &rarr;
                </button>
              </div>

              <TemplateSelector
                templates={templates}
                selectedTemplateId={activeTemplate.id}
                onSelectTemplate={(tpl) => {
                  onChangeTemplate(tpl);
                  onChangeFields(tpl.fields);
                }}
                onUploadCustomTemplate={onUploadCustomTemplate}
                onDeleteCustomTemplate={onDeleteCustomTemplate}
              />
            </div>
          </div>
        )}

        {/* Step 2: Upload Recipient Data */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Step 2: Upload Recipient Information
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload an Excel (.xlsx, .xls) or CSV spreadsheet with recipient names, emails, and custom columns.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                  >
                    &larr; Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    disabled={recipients.length === 0}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Canvas Editor &rarr;
                  </button>
                </div>
              </div>

              <SpreadsheetUploader
                recipients={recipients}
                onRecipientsChange={onChangeRecipients}
                availableColumns={availableColumns}
                onColumnsChange={onChangeColumns}
              />
            </div>
          </div>
        )}

        {/* Step 3: Visual Canvas Editor & Field Mapping */}
        {currentStep === 3 && (
          <div className="space-y-4">
            {/* Header with next step trigger */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  Step 3: Visual Canvas & Field Mapping
                </h3>
                <p className="text-xs text-slate-500">
                  Drag text elements directly on canvas or use the right-hand panel for typography & variable mapping.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  &larr; Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  Next: Preview & Generate &rarr;
                </button>
              </div>
            </div>

            {/* Split Screen: Canvas (Left 8) + Field Inspector (Right 4) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[680px]">
              <div className="lg:col-span-8 h-full">
                <CanvasEditor
                  templateImageUrl={activeTemplate.imageUrl}
                  fields={fields}
                  onFieldsChange={onChangeFields}
                  selectedFieldId={selectedFieldId}
                  onSelectField={setSelectedFieldId}
                  currentRecipient={currentRecipient}
                  availableColumns={availableColumns}
                />
              </div>

              <div className="lg:col-span-4 h-full rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <FieldControls
                  fields={fields}
                  onFieldsChange={onChangeFields}
                  selectedFieldId={selectedFieldId}
                  onSelectField={setSelectedFieldId}
                  availableColumns={availableColumns}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Live Preview, Batch Generation & ZIP Download */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    Step 4: Live Certificate Preview & Batch Generation
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review rendered certificates for any recipient, download individually, or package all as ZIP.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                  >
                    &larr; Back to Editor
                  </button>
                  <button
                    onClick={onProceedToMailer}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Proceed to Bulk Emailer &rarr;
                  </button>
                </div>
              </div>

              {/* Recipient Selector Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Previewing Recipient:</span>
                  <select
                    value={previewRecipientIdx}
                    onChange={(e) => setPreviewRecipientIdx(Number(e.target.value))}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-blue-500 text-xs"
                  >
                    {recipients.map((r, i) => (
                      <option key={r._id || i} value={i}>
                        {i + 1}. {r.name} ({r.course || "General"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewRecipientIdx((i) => Math.max(0, i - 1))}
                    disabled={previewRecipientIdx === 0}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                    title="Previous Recipient"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-700" />
                  </button>
                  <span className="font-mono text-slate-500 font-medium">
                    {previewRecipientIdx + 1} / {recipients.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewRecipientIdx((i) => Math.min(recipients.length - 1, i + 1))}
                    disabled={previewRecipientIdx >= recipients.length - 1}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                    title="Next Recipient"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
              </div>

              {/* Live Canvas Preview Frame */}
              <div className="flex items-center justify-center p-6 bg-slate-100 rounded-2xl border border-slate-200 overflow-auto">
                <div className="shadow-2xl rounded-xl overflow-hidden bg-white border border-slate-300 max-w-full">
                  <canvas ref={previewCanvasRef} className="block max-w-full h-auto" />
                </div>
              </div>

              {/* Progress Bar for Batch Generation */}
              {isGeneratingBatch && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      Generating certificates...
                    </span>
                    <span>
                      {batchProgress.current} / {batchProgress.total} certificates generated ({batchProgress.percent}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-blue-200/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-200"
                      style={{ width: `${batchProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons: Download Current, Generate All, Download ZIP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Download Current PNG */}
                <button
                  type="button"
                  onClick={handleDownloadCurrent}
                  className="py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 shadow-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <FileDown className="w-4 h-4 text-blue-600" />
                  Download Current Certificate (PNG)
                </button>

                {/* Generate All */}
                <button
                  type="button"
                  onClick={handleGenerateAll}
                  disabled={isGeneratingBatch}
                  className="py-3 px-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl font-bold text-xs text-blue-700 shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isGeneratingBatch ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  )}
                  Generate All ({recipients.length})
                </button>

                {/* Download ZIP */}
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={isZipping || isGeneratingBatch}
                  className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isZipping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Archive className="w-4 h-4 text-sky-400" />
                  )}
                  Download All as ZIP (.zip)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
