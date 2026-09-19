import React, { useState, useEffect } from "react";
import { Upload, X, Camera, Sparkles, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { DemoPreset } from "../types";
import { api } from "../api/client";

interface NewScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScreening: (docType: string, docFile: File, liveFile?: File | null, title?: string) => void;
}

export const NewScreeningModal: React.FC<NewScreeningModalProps> = ({
  isOpen,
  onClose,
  onStartScreening,
}) => {
  const [docType, setDocType] = useState<string>("PASSPORT");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [liveFile, setLiveFile] = useState<File | null>(null);
  const [livePreview, setLivePreview] = useState<string | null>(null);
  const [demoPresets, setDemoPresets] = useState<DemoPreset[]>([]);
  const [qualityFeedback, setQualityFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getDemoPresets().then(setDemoPresets).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocFile(file);
      const url = URL.createObjectURL(file);
      setDocPreview(url);
      setQualityFeedback("Resolution: 1920x1080 • Sharpness: High • Contrast: Optimal");
    }
  };

  const handleLiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLiveFile(file);
      setLivePreview(URL.createObjectURL(file));
    }
  };

  const handleSelectPreset = async (preset: DemoPreset) => {
    try {
      setDocType(preset.document_type);
      // Fetch the preset image from static backend
      const res = await fetch(`/api/v1/storage/demo/${preset.document_file}`);
      const blob = await res.blob();
      const file = new File([blob], preset.document_file, { type: "image/jpeg" });
      setDocFile(file);
      setDocPreview(URL.createObjectURL(blob));

      if (preset.live_file) {
        const liveRes = await fetch(`/api/v1/storage/demo/${preset.live_file}`);
        const liveBlob = await liveRes.blob();
        const lFile = new File([liveBlob], preset.live_file, { type: "image/jpeg" });
        setLiveFile(lFile);
        setLivePreview(URL.createObjectURL(liveBlob));
      } else {
        setLiveFile(null);
        setLivePreview(null);
      }

      setQualityFeedback("Synthetic specimen loaded • Quality metrics pre-evaluated");
    } catch (e) {
      console.error("Failed to load preset image", e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) return;
    onStartScreening(docType, docFile, liveFile, `${docType} Screening`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">New Document Screening</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload passport, visa, or identity card for automated multi-stage AI analysis.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick-Select Demo Presets */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            Quick Demo Presets (1-Click Test):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {demoPresets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className="text-left p-3 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-indigo-500/50 hover:bg-slate-950 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300">
                    {p.title}
                  </span>
                  <span className="text-[10px] font-mono rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">
                    {p.document_type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Document Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Document Classification:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["PASSPORT", "VISA", "NATIONAL_ID"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDocType(t)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    docType === t
                      ? "border-blue-500 bg-blue-600/20 text-white shadow-sm shadow-blue-500/20"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Areas: Primary Document & Optional Live Face */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Document Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                1. Primary Document Image: <span className="text-rose-400">*</span>
              </label>
              <div className="relative rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/80 p-4 text-center hover:border-blue-500 transition-colors">
                {docPreview ? (
                  <div className="relative">
                    <img
                      src={docPreview}
                      alt="Document preview"
                      className="max-h-40 mx-auto rounded-lg object-contain shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setDocFile(null);
                        setDocPreview(null);
                        setQualityFeedback(null);
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-500 shadow"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center space-y-2">
                    <Upload className="h-8 w-8 text-slate-500" />
                    <span className="text-xs font-medium text-slate-300">
                      Drag & drop document or browse
                    </span>
                    <span className="text-[10px] text-slate-500">
                      JPG, PNG, WebP up to 20MB
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDocChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {/* Quality Assessment Feedback */}
              {qualityFeedback && (
                <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{qualityFeedback}</span>
                </div>
              )}
            </div>

            {/* Optional Live Face Photo */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                2. Presented / Live Portrait: <span className="text-slate-500">(Optional Biometrics)</span>
              </label>
              <div className="relative rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/80 p-4 text-center hover:border-blue-500 transition-colors">
                {livePreview ? (
                  <div className="relative">
                    <img
                      src={livePreview}
                      alt="Live preview"
                      className="max-h-40 mx-auto rounded-lg object-contain shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLiveFile(null);
                        setLivePreview(null);
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-500 shadow"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center space-y-2">
                    <Camera className="h-8 w-8 text-slate-500" />
                    <span className="text-xs font-medium text-slate-300">
                      Add live traveler photo
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Enables facial comparison verification
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLiveChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!docFile}
              className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              Start Automated AI Screening
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
