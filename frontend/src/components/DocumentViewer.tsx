import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCw, Maximize2, Layers, Eye, ShieldAlert, Users } from "lucide-react";
import { ExtractedField, TamperResultItem, FaceResultItem } from "../types";

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
  livePhotoUrl,
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
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
      {/* Viewer Header & Layer Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveLayer("original")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeLayer === "original"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Original</span>
          </button>

          <button
            onClick={() => setActiveLayer("ocr_boxes")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeLayer === "ocr_boxes"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>OCR BBoxes</span>
          </button>

          <button
            onClick={() => setActiveLayer("ela_heatmap")}
            disabled={!heatmapUrl}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeLayer === "ela_heatmap"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                : "text-slate-400 hover:text-slate-200 disabled:opacity-40"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>ELA Forensics</span>
          </button>

          <button
            onClick={() => setActiveLayer("biometrics")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeLayer === "biometrics"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Face Biometrics</span>
          </button>
        </div>

        {/* Zoom & Rotation Controls */}
        <div className="flex items-center space-x-1 text-slate-300">
          <button
            onClick={handleZoomOut}
            title="Zoom out"
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono px-1 w-12 text-center text-slate-400">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            title="Zoom in"
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleRotate}
            title="Rotate 90°"
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleReset}
            title="Fit to view"
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Image Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative flex-1 overflow-hidden bg-slate-950 flex items-center justify-center select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {activeLayer === "biometrics" ? (
          /* Side-by-side Biometric Comparison */
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-6 max-w-full">
            {/* Document Portrait */}
            <div className="flex flex-col items-center bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 mb-2">DOCUMENT PORTRAIT</span>
              <div className="w-48 h-56 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center">
                {faceResult?.doc_portrait_url ? (
                  <img
                    src={faceResult.doc_portrait_url}
                    alt="Document portrait"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-slate-500">No portrait crop</span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 mt-2">
                Quality: {Math.round((faceResult?.quality_score || 0.8) * 100)}%
              </span>
            </div>

            {/* Presented / Live Face */}
            <div className="flex flex-col items-center bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 mb-2">PRESENTED LIVE IMAGE</span>
              <div className="w-48 h-56 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center">
                {faceResult?.live_photo_url ? (
                  <img
                    src={faceResult.live_photo_url}
                    alt="Presented live face"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-slate-500">No live photo provided</span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 mt-2">
                Similarity: {faceResult?.outcome === "NOT_PERFORMED" ? "N/A" : `${Math.round(faceResult?.similarity_score || 0 * 100)}%`}
              </span>
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
              <div className="relative inline-block shadow-2xl rounded-lg overflow-hidden border border-slate-800">
                {/* Base Image */}
                <img
                  src={activeLayer === "ela_heatmap" && heatmapUrl ? heatmapUrl : documentUrl}
                  alt="Identity Document"
                  className="max-h-[68vh] object-contain pointer-events-none"
                  draggable={false}
                />

                {/* Layer: OCR Bounding Boxes */}
                {activeLayer === "ocr_boxes" && (
                  <div className="absolute inset-0 pointer-events-auto">
                    {fields.map((f) => {
                      if (!f.bbox) return null;
                      const [bx, by, bw, bh] = f.bbox;
                      const isSelected = selectedFieldName === f.field_name;

                      return (
                        <div
                          key={f.field_name}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectField && onSelectField(f.field_name);
                          }}
                          style={{
                            left: `${bx * 100}%`,
                            top: `${by * 100}%`,
                            width: `${bw * 100}%`,
                            height: `${bh * 100}%`,
                          }}
                          className={`absolute border transition-all cursor-pointer group ${
                            isSelected
                              ? "border-yellow-400 bg-yellow-400/25 ring-2 ring-yellow-400/50 z-20"
                              : "border-blue-400/70 bg-blue-500/10 hover:border-blue-300 hover:bg-blue-400/20 z-10"
                          }`}
                        >
                          <div className="absolute -top-5 left-0 rounded bg-slate-900/90 px-1.5 py-0.5 text-[9px] font-mono text-blue-300 whitespace-nowrap border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                            {f.field_name}: {f.value} ({Math.round(f.confidence * 100)}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-600 text-sm">No document image loaded</div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info / Overlay Legend */}
      <div className="p-2.5 px-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-3">
          <span>Active Layer: <strong className="text-slate-200 uppercase">{activeLayer.replace("_", " ")}</strong></span>
          {activeLayer === "ela_heatmap" && (
            <span className="text-amber-400 font-medium">Heatmap shows high-compression discrepancy zones (JET colormap)</span>
          )}
        </div>
        <div className="hidden sm:block text-slate-500">
          Scroll or drag to reposition • Click field to highlight
        </div>
      </div>
    </div>
  );
};
