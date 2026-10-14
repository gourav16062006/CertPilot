import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Magnet,
  Eye,
  RotateCw,
  Move,
  Layers,
} from "lucide-react";
import { CertificateField, Recipient } from "../types";
import { renderCertificateCanvas, loadCertificateImage } from "../utils/canvasRenderer";

interface CanvasEditorProps {
  templateImageUrl: string;
  fields: CertificateField[];
  onFieldsChange: (fields: CertificateField[]) => void;
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  currentRecipient?: Recipient | null;
  availableColumns?: string[];
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  templateImageUrl,
  fields,
  onFieldsChange,
  selectedFieldId,
  onSelectField,
  currentRecipient,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [templateImg, setTemplateImg] = useState<HTMLImageElement | null>(null);

  // Editor viewport settings
  const [scale, setScale] = useState<number>(0.55);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  // Dragging & interacting state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [fieldStartPos, setFieldStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [interactionMode, setInteractionMode] = useState<"drag" | "resize" | "rotate" | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [initialWidth, setInitialWidth] = useState<number>(0);
  const [initialHeight, setInitialHeight] = useState<number>(0);

  // Load template image
  useEffect(() => {
    let isMounted = true;
    loadCertificateImage(templateImageUrl)
      .then((img) => {
        if (isMounted) setTemplateImg(img);
      })
      .catch((err) => console.error("Template load error", err));

    return () => {
      isMounted = false;
    };
  }, [templateImageUrl]);

  // Render on canvas whenever template, fields, recipient, or display options change
  const renderCanvas = useCallback(async () => {
    if (!canvasRef.current || !templateImg) return;

    await renderCertificateCanvas({
      canvas: canvasRef.current,
      templateImage: templateImg,
      fields,
      recipient: currentRecipient,
      selectedFieldId,
      showGrid,
      showGuides,
      scale,
      isExport: false,
    });
  }, [templateImg, fields, currentRecipient, selectedFieldId, showGrid, showGuides, scale]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Fit canvas to container width
  const fitToScreen = () => {
    if (!containerRef.current || !templateImg) return;
    const containerW = containerRef.current.clientWidth - 48; // padding
    const containerH = containerRef.current.clientHeight - 48;
    const templateW = templateImg.naturalWidth || 1920;
    const templateH = templateImg.naturalHeight || 1358;

    const scaleW = containerW / templateW;
    const scaleH = containerH / templateH;
    const idealScale = Math.min(scaleW, scaleH, 0.85);
    setScale(Math.max(0.2, Number(idealScale.toFixed(2))));
  };

  // Convert client mouse coordinates to template coordinates
  const getTemplateCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !templateImg) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert to unscaled template coordinates
    const templateX = clientX / scale;
    const templateY = clientY / scale;

    return { x: templateX, y: templateY };
  };

  // Find field at coordinate
  const hitTestField = (x: number, y: number): { field: CertificateField; isHandle?: boolean; handle?: string } | null => {
    if (!templateImg) return null;
    const templateW = templateImg.naturalWidth || 1920;
    const templateH = templateImg.naturalHeight || 1358;

    // Check currently selected field handles first
    if (selectedFieldId) {
      const selected = fields.find((f) => f.id === selectedFieldId);
      if (selected) {
        const posX = selected.x <= 100 ? (selected.x / 100) * templateW : selected.x;
        const posY = selected.y <= 100 ? (selected.y / 100) * templateH : selected.y;
        const w = selected.width || 800;
        const h = selected.height || 60;

        // Check rotation handle (circle at top)
        const rotX = posX;
        const rotY = posY - h / 2 - 24;
        const distRot = Math.hypot(x - rotX, y - rotY);
        if (distRot <= 16) {
          return { field: selected, isHandle: true, handle: "rotate" };
        }

        // Check right resize handle
        const rightHandleX = posX + w / 2;
        const rightHandleY = posY;
        if (Math.hypot(x - rightHandleX, y - rightHandleY) <= 16) {
          return { field: selected, isHandle: true, handle: "right" };
        }

        // Check left resize handle
        const leftHandleX = posX - w / 2;
        const leftHandleY = posY;
        if (Math.hypot(x - leftHandleX, y - leftHandleY) <= 16) {
          return { field: selected, isHandle: true, handle: "left" };
        }
      }
    }

    // Hit test elements in reverse order (top to bottom)
    for (let i = fields.length - 1; i >= 0; i--) {
      const f = fields[i];
      const posX = f.x <= 100 ? (f.x / 100) * templateW : f.x;
      const posY = f.y <= 100 ? (f.y / 100) * templateH : f.y;
      const w = (f.width || 600) + 24;
      const h = (f.height || 60) + 24;

      if (
        x >= posX - w / 2 &&
        x <= posX + w / 2 &&
        y >= posY - h / 2 &&
        y <= posY + h / 2
      ) {
        return { field: f };
      }
    }

    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getTemplateCoords(e);
    const hit = hitTestField(coords.x, coords.y);

    if (hit) {
      onSelectField(hit.field.id);
      setIsDragging(true);
      setDragStartPos(coords);

      const templateW = templateImg?.naturalWidth || 1920;
      const templateH = templateImg?.naturalHeight || 1358;
      const posX = hit.field.x <= 100 ? (hit.field.x / 100) * templateW : hit.field.x;
      const posY = hit.field.y <= 100 ? (hit.field.y / 100) * templateH : hit.field.y;

      setFieldStartPos({ x: posX, y: posY });
      setInitialWidth(hit.field.width || 600);
      setInitialHeight(hit.field.height || 60);

      if (hit.isHandle && hit.handle === "rotate") {
        setInteractionMode("rotate");
      } else if (hit.isHandle) {
        setInteractionMode("resize");
        setResizeHandle(hit.handle || null);
      } else {
        setInteractionMode("drag");
      }
    } else {
      // Clicked on empty background
      onSelectField(null);
      setIsDragging(false);
      setInteractionMode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedFieldId || !templateImg || !interactionMode) return;

    const coords = getTemplateCoords(e);
    const deltaX = coords.x - dragStartPos.x;
    const deltaY = coords.y - dragStartPos.y;

    const templateW = templateImg.naturalWidth || 1920;
    const templateH = templateImg.naturalHeight || 1358;

    const updatedFields = fields.map((field) => {
      if (field.id !== selectedFieldId) return field;

      if (interactionMode === "drag") {
        let newX = fieldStartPos.x + deltaX;
        let newY = fieldStartPos.y + deltaY;

        // Snap to grid if enabled
        if (snapToGrid) {
          const gridSize = 20;
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
        }

        // Snap to center guide if close (within 15px)
        if (Math.abs(newX - templateW / 2) < 15) {
          newX = templateW / 2;
        }

        return {
          ...field,
          x: Math.round(newX),
          y: Math.round(newY),
        };
      }

      if (interactionMode === "resize") {
        let newWidth = initialWidth;
        if (resizeHandle === "right") {
          newWidth = Math.max(100, initialWidth + deltaX * 2);
        } else if (resizeHandle === "left") {
          newWidth = Math.max(100, initialWidth - deltaX * 2);
        }
        return {
          ...field,
          width: Math.round(newWidth),
        };
      }

      if (interactionMode === "rotate") {
        const posX = field.x <= 100 ? (field.x / 100) * templateW : field.x;
        const posY = field.y <= 100 ? (field.y / 100) * templateH : field.y;
        const angleRad = Math.atan2(coords.y - posY, coords.x - posX);
        let angleDeg = Math.round((angleRad * 180) / Math.PI) + 90;

        // Snap to 0, 45, 90, 180, etc.
        if (Math.abs(angleDeg) < 3) angleDeg = 0;
        return {
          ...field,
          rotation: angleDeg,
        };
      }

      return field;
    });

    onFieldsChange(updatedFields);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setInteractionMode(null);
    setResizeHandle(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/5 rounded-2xl border border-slate-200/80 overflow-hidden select-none">
      {/* Canvas Toolbar */}
      <div className="h-12 px-4 bg-white border-b border-slate-200 flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom controls */}
          <button
            onClick={() => setScale((s) => Math.max(0.2, Number((s - 0.1).toFixed(2))))}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-slate-600 font-semibold w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(1.5, Number((s + 0.1).toFixed(2))))}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={fitToScreen}
            className="flex items-center gap-1 px-2.5 py-1 hover:bg-slate-100 rounded-lg text-slate-600 font-medium transition-colors"
            title="Fit to Container"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fit</span>
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
              showGrid ? "bg-blue-50 text-blue-700 font-semibold" : "hover:bg-slate-100 text-slate-600"
            }`}
            title="Toggle Grid Lines"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grid</span>
          </button>

          {/* Snap to Grid */}
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
              snapToGrid ? "bg-blue-50 text-blue-700 font-semibold" : "hover:bg-slate-100 text-slate-600"
            }`}
            title="Toggle Snap to Grid"
          >
            <Magnet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Snap</span>
          </button>

          {/* Alignment Guides */}
          <button
            onClick={() => setShowGuides(!showGuides)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
              showGuides ? "bg-blue-50 text-blue-700 font-semibold" : "hover:bg-slate-100 text-slate-600"
            }`}
            title="Toggle Center Alignment Guides"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guides</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Scrollable Stage */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-100/70"
      >
        <div className="relative shadow-2xl rounded-lg bg-white overflow-hidden border border-slate-300">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="block cursor-crosshair touch-none"
            style={{
              width: templateImg ? `${Math.round((templateImg.naturalWidth || 1920) * scale)}px` : "100%",
              height: templateImg ? `${Math.round((templateImg.naturalHeight || 1358) * scale)}px` : "auto",
            }}
          />
        </div>
      </div>

      {/* Footer Instructions / Selected Status */}
      <div className="h-8 px-4 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span>Click any text to select & drag</span>
          <span>•</span>
          <span>Drag right handle to resize box</span>
          <span>•</span>
          <span>Drag top blue dot to rotate</span>
        </div>
        <div>
          {selectedFieldId ? (
            <span className="font-semibold text-blue-600">
              Selected: {fields.find((f) => f.id === selectedFieldId)?.name}
            </span>
          ) : (
            <span>No field selected</span>
          )}
        </div>
      </div>
    </div>
  );
};
