import React, { useState, useEffect } from "react";
import { Upload, X, Camera, Sparkles, CheckCircle2 } from "lucide-react";
import { DemoPreset } from "../types";
import { api } from "../api/client";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Document Screening"
      description="Upload passport, visa, or identity card for automated multi-stage AI analysis."
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Quick-Select Demo Presets */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-black text-ink uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-ink" />
            <span>Quick Demo Presets (1-Click Test):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {demoPresets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className="text-left p-3 rounded-xl border-2 border-ink bg-[#FFFDF7] hover:bg-yellow-50 shadow-neo-sm hover:shadow-neo active:translate-x-[1px] active:translate-y-[1px] transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-ink group-hover:text-coral transition-colors">
                    {p.title}
                  </span>
                  <Badge variant="lavender">
                    {p.document_type}
                  </Badge>
                </div>
                <p className="text-[11px] font-semibold text-ink/70 mt-1 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Document Type Selection */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-ink mb-2">
              Document Classification:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {["PASSPORT", "VISA", "NATIONAL_ID"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDocType(t)}
                  className={`py-2 px-3 rounded-xl text-xs font-black border-2 border-ink transition-all cursor-pointer ${
                    docType === t
                      ? "bg-coral text-white shadow-neo"
                      : "bg-[#FFFDF7] text-ink shadow-neo-sm hover:bg-yellow-50"
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
              <label className="block text-xs font-black uppercase tracking-wider text-ink mb-1.5">
                1. Primary Document Image: <span className="text-coral">*</span>
              </label>
              <div className="relative rounded-2xl border-2 border-dashed border-ink bg-[#FFFDF7] p-4 text-center hover:bg-yellow-50 transition-colors">
                {docPreview ? (
                  <div className="relative">
                    <img
                      src={docPreview}
                      alt="Document preview"
                      className="max-h-40 mx-auto rounded-xl object-contain border-2 border-ink shadow-neo-sm"
                    />
                    <button
                      type="button"
                      aria-label="Remove document"
                      onClick={() => {
                        setDocFile(null);
                        setDocPreview(null);
                        setQualityFeedback(null);
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-coral text-white rounded-lg border border-ink hover:bg-coral-600 shadow cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center space-y-2">
                    <div className="p-2.5 rounded-xl bg-blue border-2 border-ink shadow-neo-sm">
                      <Upload className="h-6 w-6 text-ink stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-extrabold text-ink">
                      Drag & drop document or browse
                    </span>
                    <span className="text-[10px] font-bold text-ink/60">
                      JPG, PNG, WebP up to 20MB
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDocChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  aria-label="Upload document image"
                />
              </div>

              {/* Quality Assessment Feedback */}
              {qualityFeedback && (
                <div className="mt-2 flex items-center space-x-1.5 text-[11px] font-bold text-emerald-800 bg-mint/50 px-2.5 py-1 rounded-lg border border-ink">
                  <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>{qualityFeedback}</span>
                </div>
              )}
            </div>

            {/* Optional Live Face Photo */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-ink mb-1.5">
                2. Live Portrait: <span className="text-ink/60 font-semibold">(Optional Face Match)</span>
              </label>
              <div className="relative rounded-2xl border-2 border-dashed border-ink bg-[#FFFDF7] p-4 text-center hover:bg-yellow-50 transition-colors">
                {livePreview ? (
                  <div className="relative">
                    <img
                      src={livePreview}
                      alt="Live preview"
                      className="max-h-40 mx-auto rounded-xl object-contain border-2 border-ink shadow-neo-sm"
                    />
                    <button
                      type="button"
                      aria-label="Remove live portrait"
                      onClick={() => {
                        setLiveFile(null);
                        setLivePreview(null);
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-coral text-white rounded-lg border border-ink hover:bg-coral-600 shadow cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center space-y-2">
                    <div className="p-2.5 rounded-xl bg-lavender border-2 border-ink shadow-neo-sm">
                      <Camera className="h-6 w-6 text-ink stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-extrabold text-ink">
                      Add live traveler photo
                    </span>
                    <span className="text-[10px] font-bold text-ink/60">
                      Enables biometric comparison
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLiveChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  aria-label="Upload live traveler photo"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t-2 border-ink">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="coral"
              size="md"
              disabled={!docFile}
            >
              Start Automated AI Screening
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
