import React, { useState, useRef } from "react";
import { ZoomIn, ZoomOut, RotateCw, Maximize2, Layers, Eye, ShieldAlert, Users } from "lucide-react";
import { ExtractedField, TamperResultItem, FaceResultItem } from "../types";
import { Button } from "./ui/Button";

interface DocumentViewerProps {
  documentUrl?: string | null;
  livePhotoUrl?: string | null;
  fields: ExtractedField[];
  tamperResults: TamperResultItem[];
  faceResult?: FaceResultItem | null;
  selectedFieldName?: string | null;
  onSelectField?: (fieldName: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentUrl,
  fields,
  tamperResults,
  faceResult,
  selectedFieldName,
  onSelectField,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeLayer, setActiveLayer] = useState<"original" | "ocr_boxes" | "ela_heatmap" | "biometrics">("original");

  // Pan state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const elaResult = tamperResults.find((t) => t.anomaly_type === "ELA_COMPRESSION");
  const heatmapUrl = elaResult?.heatmap_path;

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="flex flex-col h-full rounded-2xl border-2 border-ink bg-white overflow-hidden shadow-neo">
      {/* Viewer Header & Layer Controls */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-1.5 border-b-2 border-ink bg-[#FFFDF7] min-h-[52px]">
        {/* Layer Buttons: Consistent h-10 container with h-8 buttons */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border-2 border-ink shadow-neo-sm h-10">
          <Button
            size="sm"
            variant={activeLayer === "original" ? "blue" : "ghost"}
            onClick={() => setActiveLayer("original")}
            icon={<Eye className="h-3.5 w-3.5 stroke-[2.5]" />}
            aria-label="View original document"
            className="h-8 px-2 text-xs font-black"
          >
            <span>Original</span>
          </Button>

          <Button
            size="sm"
            variant={activeLayer === "ocr_boxes" ? "orange" : "ghost"}
            onClick={() => setActiveLayer("ocr_boxes")}
            icon={<Layers className="h-3.5 w-3.5 stroke-[2.5]" />}
            aria-label="View OCR bounding boxes overlay"
            className="h-8 px-2 text-xs font-black"
          >
            <span className="hidden xl:inline">OCR </span><span>BBoxes</span>
          </Button>

          <Button
            size="sm"
            variant={activeLayer === "ela_heatmap" ? "coral" : "ghost"}
            onClick={() => setActiveLayer("ela_heatmap")}
            disabled={!heatmapUrl}
            icon={<ShieldAlert className="h-3.5 w-3.5 stroke-[2.5]" />}
            aria-label="View ELA compression forensics heatmap"
            className="h-8 px-2 text-xs font-black"
          >
            <span className="hidden xl:inline">ELA </span><span>Forensics</span>
          </Button>

          <Button
            size="sm"
            variant={activeLayer === "biometrics" ? "lavender" : "ghost"}
            onClick={() => setActiveLayer("biometrics")}
            icon={<Users className="h-3.5 w-3.5 stroke-[2.5]" />}
            aria-label="View biometric face comparison"
            className="h-8 px-2 text-xs font-black"
          >
            <span className="hidden xl:inline">Face </span><span>Biometrics</span>
          </Button>
        </div>

        {/* Zoom & Rotation Controls: Exact matching 32px height for all buttons and zoom indicator */}
        <div className="flex items-center space-x-1 h-10" role="toolbar" aria-label="Document viewer zoom and rotation controls">
          <Button
            size="icon"
            variant="outline"
            onClick={handleZoomOut}
            title="Zoom out"
            aria-label="Zoom out"
            className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-lg border-2 border-ink bg-white shadow-neo-sm hover:bg-cream"
          >
            <ZoomOut className="h-3.5 w-3.5 stroke-[2.5]" />
          </Button>
          <span
            className="h-8 w-12 inline-flex items-center justify-center font-mono text-[11px] font-black text-ink bg-cream rounded-lg border-2 border-ink shadow-neo-sm select-none"
            aria-label={`Current zoom level ${Math.round(zoom * 100)} percent`}
          >
            {Math.round(zoom * 100)}%
          </span>
          <Button
            size="icon"
            variant="outline"
            onClick={handleZoomIn}
            title="Zoom in"
            aria-label="Zoom in"
            className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-lg border-2 border-ink bg-white shadow-neo-sm hover:bg-cream"
          >
            <ZoomIn className="h-3.5 w-3.5 stroke-[2.5]" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={handleRotate}
            title="Rotate 90 degrees clockwise"
            aria-label="Rotate 90 degrees clockwise"
            className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-lg border-2 border-ink bg-white shadow-neo-sm hover:bg-cream"
          >
            <RotateCw className="h-3.5 w-3.5 stroke-[2.5]" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={handleReset}
            title="Fit to view"
            aria-label="Reset zoom and rotation to fit view"
            className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-lg border-2 border-ink bg-white shadow-neo-sm hover:bg-cream"
          >
            <Maximize2 className="h-3.5 w-3.5 stroke-[2.5]" />
          </Button>
        </div>
      </div>

      {/* Main Image Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative flex-1 overflow-hidden bg-[#F8F6EF] flex items-center justify-center select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          backgroundImage: "radial-gradient(#171717 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0",
        }}
      >
        {activeLayer === "biometrics" ? (
          /* Side-by-side Biometric Comparison */
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-6 max-w-full">
            {/* Document Portrait */}
            <div className="flex flex-col items-center bg-white p-4 rounded-2xl border-2 border-ink shadow-neo">
              <span className="text-xs font-black uppercase tracking-wider text-ink mb-2">
                DOCUMENT PORTRAIT
              </span>
              <div className="w-48 h-56 rounded-xl overflow-hidden border-2 border-ink bg-cream flex items-center justify-center">
                {faceResult?.doc_portrait_url ? (
                  <img
                    src={faceResult.doc_portrait_url}
                    alt="Document portrait crop"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-ink/50">No portrait crop</span>
                )}
              </div>
              <div className="mt-2.5 px-3 py-1 rounded-lg bg-mint/50 border border-ink text-xs font-bold text-ink">
                Quality: {Math.round((faceResult?.quality_score || 0.8) * 100)}%
              </div>
            </div>

            {/* Presented / Live Face */}
            <div className="flex flex-col items-center bg-white p-4 rounded-2xl border-2 border-ink shadow-neo">
              <span className="text-xs font-black uppercase tracking-wider text-ink mb-2">
                PRESENTED LIVE IMAGE
              </span>
              <div className="w-48 h-56 rounded-xl overflow-hidden border-2 border-ink bg-cream flex items-center justify-center">
                {faceResult?.live_photo_url ? (
                  <img
                    src={faceResult.live_photo_url}
                    alt="Presented live traveler face"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-ink/50">No live photo provided</span>
                )}
              </div>
              <div className="mt-2.5 px-3 py-1 rounded-lg bg-lavender/50 border border-ink text-xs font-bold text-ink">
                Similarity: {faceResult?.outcome === "NOT_PERFORMED" ? "N/A" : `${Math.round((faceResult?.similarity_score || 0) * 100)}%`}
              </div>
            </div>
          </div>
        ) : (
          /* Document Canvas with Overlays */
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transition: isDragging ? "none" : "transform 0.15s ease-out",
            }}
            className="relative max-w-full max-h-full flex items-center justify-center"
          >
            {documentUrl ? (
              <div className="relative inline-block rounded-xl overflow-hidden border-3 border-ink shadow-neo-lg bg-white">
                {/* Base Forensic Image */}
                <img
                  src={activeLayer === "ela_heatmap" && heatmapUrl ? heatmapUrl : documentUrl}
                  alt="Identity Document Forensic Canvas"
                  className="max-h-[440px] max-w-[92%] md:max-w-[480px] lg:max-w-[520px] w-auto object-contain pointer-events-none"
                  draggable={false}
                />

                {/* Layer: OCR Bounding Boxes */}
                {activeLayer === "ocr_boxes" && (
                  <div className="absolute inset-0 pointer-events-auto" aria-label="OCR Bounding Box Overlays">
                    {fields.map((f) => {
                      if (!f.bbox) return null;
                      const [bx, by, bw, bh] = f.bbox;
                      const isSelected = selectedFieldName === f.field_name;

                      return (
                        <div
                          key={f.field_name}
                          role="button"
                          tabIndex={0}
                          aria-label={`Highlight ${f.field_name}: ${f.value}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectField && onSelectField(f.field_name);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onSelectField && onSelectField(f.field_name);
                            }
                          }}
                          style={{
                            left: `${bx * 100}%`,
                            top: `${by * 100}%`,
                            width: `${bw * 100}%`,
                            height: `${bh * 100}%`,
                          }}
                          className={`absolute border-2 transition-all cursor-pointer group ${
                            isSelected
                              ? "border-ink bg-orange/40 ring-3 ring-ink z-20"
                              : "border-ink bg-blue/25 hover:bg-blue/40 z-10"
                          }`}
                        >
                          <div className="absolute -top-7 left-0 rounded-lg bg-ink px-2 py-0.5 text-[10px] font-mono font-bold text-white whitespace-nowrap shadow-neo-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-30">
                            {f.field_name}: {f.value} ({Math.round(f.confidence * 100)}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-ink/60 font-bold text-sm bg-white p-6 rounded-2xl border-2 border-ink shadow-neo">
                No document image loaded
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info / Overlay Legend */}
      <div className="h-10 px-4 border-t-2 border-ink bg-[#FFFDF7] flex items-center justify-between text-xs font-bold text-ink shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-ink/70">Active Layer:</span>
          <span className="rounded-md bg-blue/40 px-2 py-0.5 border border-ink uppercase tracking-wider text-[10px] font-black">
            {activeLayer.replace("_", " ")}
          </span>
          {activeLayer === "ela_heatmap" && (
            <span className="text-coral font-black text-[10px] ml-1">
              (JET Heatmap: Compression Delta)
            </span>
          )}
        </div>
        <div className="hidden sm:block text-ink/60 text-[11px] font-semibold">
          Drag to reposition • Click field to highlight
        </div>
      </div>
    </div>
  );
};
