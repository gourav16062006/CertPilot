import { CertificateField, Recipient } from "../types";

// Cache for loaded images
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Preload and cache an image
 */
export function loadCertificateImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    const cached = imageCache.get(src)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (err) => reject(new Error("Failed to load certificate template image: " + err));
    img.src = src;
  });
}

/**
 * Replace dynamic curly bracket variables in template strings:
 * e.g., "Hello {{name}}, congrats on {{course}}" -> replaces with recipient values
 */
export function interpolateVariables(text: string, recipient?: Recipient | null): string {
  if (!text) return "";
  if (!recipient) {
    // Return with clean placeholders when no recipient
    return text;
  }

  return text.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_, key) => {
    const rawKey = key.trim();
    const lowerKey = rawKey.toLowerCase();

    // Check direct property first
    if (recipient[rawKey] !== undefined && recipient[rawKey] !== null) {
      return String(recipient[rawKey]);
    }
    // Check lowercase property
    if (recipient[lowerKey] !== undefined && recipient[lowerKey] !== null) {
      return String(recipient[lowerKey]);
    }
    // Specific standard aliases
    if (lowerKey === "name" && recipient.name) return recipient.name;
    if (lowerKey === "course" && recipient.course) return recipient.course;
    if (lowerKey === "date" && recipient.date) return recipient.date;
    if ((lowerKey === "certificate_id" || lowerKey === "id") && recipient.certificate_id) {
      return recipient.certificate_id;
    }
    if (lowerKey === "email" && recipient.email) return recipient.email;

    return `{{${rawKey}}}`;
  });
}

/**
 * Sanitize filename for safe OS export
 */
export function sanitizeFilename(name: string, suffix: string = "_Certificate.png"): string {
  const cleanName = (name || "Recipient")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "_");
  return `${cleanName}${suffix}`;
}

export interface RenderOptions {
  canvas: HTMLCanvasElement;
  templateImage: HTMLImageElement;
  fields: CertificateField[];
  recipient?: Recipient | null;
  selectedFieldId?: string | null;
  showGrid?: boolean;
  showGuides?: boolean;
  scale?: number; // Visual zoom factor for editor preview (e.g. 0.5)
  isExport?: boolean; // If true, do not render selection box or grid
}

/**
 * Renders the certificate onto a canvas.
 * Handles high DPI scaling, background image, custom fonts, letter spacing, alignments, and editor guides.
 */
export async function renderCertificateCanvas(options: RenderOptions): Promise<void> {
  const {
    canvas,
    templateImage,
    fields,
    recipient,
    selectedFieldId,
    showGrid = false,
    showGuides = false,
    scale = 1,
    isExport = false,
  } = options;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Make sure fonts are loaded in document if possible
  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Fallback gracefully
    }
  }

  const templateW = templateImage.naturalWidth || 1920;
  const templateH = templateImage.naturalHeight || 1358;

  if (isExport) {
    // Full native resolution for crisp output
    canvas.width = templateW;
    canvas.height = templateH;
  } else {
    // Editor preview scaled
    canvas.width = Math.round(templateW * scale);
    canvas.height = Math.round(templateH * scale);
  }

  ctx.save();

  if (!isExport && scale !== 1) {
    ctx.scale(scale, scale);
  }

  // 1. Draw Template Background
  ctx.drawImage(templateImage, 0, 0, templateW, templateH);

  // 2. Draw Grid (only in interactive editor mode if enabled)
  if (!isExport && showGrid) {
    ctx.save();
    ctx.strokeStyle = "rgba(59, 130, 246, 0.15)";
    ctx.lineWidth = 1;
    const gridSize = 40;

    for (let x = 0; x <= templateW; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, templateH);
      ctx.stroke();
    }
    for (let y = 0; y <= templateH; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(templateW, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 3. Draw Center Alignment Guides if enabled
  if (!isExport && showGuides) {
    ctx.save();
    ctx.strokeStyle = "rgba(239, 68, 68, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);

    // Vertical center
    ctx.beginPath();
    ctx.moveTo(templateW / 2, 0);
    ctx.lineTo(templateW / 2, templateH);
    ctx.stroke();

    // Horizontal center
    ctx.beginPath();
    ctx.moveTo(0, templateH / 2);
    ctx.lineTo(templateW, templateH / 2);
    ctx.stroke();

    ctx.restore();
  }

  // 4. Render Dynamic Text Fields
  for (const field of fields) {
    ctx.save();

    // Interpolate variable
    const displayText = interpolateVariables(field.variable, recipient);

    // Calculate position
    // x can be stored as absolute pixels or relative percentage
    // If x <= 100, treat as percentage of templateW
    const posX = field.x <= 100 ? (field.x / 100) * templateW : field.x;
    const posY = field.y <= 100 ? (field.y / 100) * templateH : field.y;
    const fieldW = field.width || 800;
    const fieldH = field.height || 60;

    // Field center point for rotation
    ctx.translate(posX, posY);
    if (field.rotation) {
      ctx.rotate((field.rotation * Math.PI) / 180);
    }

    ctx.globalAlpha = field.opacity !== undefined ? field.opacity : 1;

    // Font style string
    const style = field.fontStyle === "italic" ? "italic" : "";
    const weight = field.fontWeight || "normal";
    const size = field.fontSize || 36;
    const family = field.fontFamily || "Inter, sans-serif";
    ctx.font = `${style} ${weight} ${size}px ${family}`.trim();
    ctx.fillStyle = field.textColor || "#0F172A";
    ctx.textBaseline = "middle";

    // Text alignment relative to (0, 0) of the bounding box
    let textX = 0;
    if (field.textAlign === "center") {
      ctx.textAlign = "center";
      textX = 0;
    } else if (field.textAlign === "right") {
      ctx.textAlign = "right";
      textX = fieldW / 2;
    } else {
      ctx.textAlign = "left";
      textX = -fieldW / 2;
    }

    // Letter spacing support
    if (field.letterSpacing && field.letterSpacing > 0 && "letterSpacing" in ctx) {
      (ctx as any).letterSpacing = `${field.letterSpacing}px`;
    }

    ctx.fillText(displayText, textX, 0);

    // 5. Draw Editor Selection Box & Handles for Selected Field
    if (!isExport && selectedFieldId === field.id) {
      ctx.save();
      ctx.setLineDash([]);
      ctx.strokeStyle = "#2563EB"; // Blue-600
      ctx.lineWidth = 2;

      // Bounding box
      const boxX = -fieldW / 2 - 8;
      const boxY = -fieldH / 2 - 4;
      const boxW = fieldW + 16;
      const boxH = fieldH + 8;

      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Corner handles
      const handleSize = 10;
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#2563EB";
      ctx.lineWidth = 2;

      const corners = [
        { x: boxX, y: boxY },
        { x: boxX + boxW, y: boxY },
        { x: boxX, y: boxY + boxH },
        { x: boxX + boxW, y: boxY + boxH },
        { x: boxX + boxW / 2, y: boxY }, // top middle
        { x: boxX + boxW / 2, y: boxY + boxH }, // bottom middle
      ];

      corners.forEach((c) => {
        ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
      });

      // Rotation stem & handle on top
      ctx.beginPath();
      ctx.moveTo(boxX + boxW / 2, boxY);
      ctx.lineTo(boxX + boxW / 2, boxY - 24);
      ctx.strokeStyle = "#2563EB";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(boxX + boxW / 2, boxY - 24, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#3B82F6";
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Generate a standalone high-res Data URL PNG for a single recipient
 */
export async function generateSingleCertificatePng(
  templateImage: HTMLImageElement,
  fields: CertificateField[],
  recipient: Recipient
): Promise<string> {
  const exportCanvas = document.createElement("canvas");
  await renderCertificateCanvas({
    canvas: exportCanvas,
    templateImage,
    fields,
    recipient,
    isExport: true,
    scale: 1,
  });
  return exportCanvas.toDataURL("image/png", 0.95);
}
