import JSZip from "jszip";
import { Recipient } from "../types";
import { sanitizeFilename } from "./canvasRenderer";

export interface ZipProgressCallback {
  (current: number, total: number, percentage: number, currentName: string): void;
}

/**
 * Packs multiple certificate PNG base64 strings into a downloadable zip file
 */
export async function createCertificatesZip(
  certificates: Array<{ recipient: Recipient; dataUrl: string; filename?: string }>,
  onProgress?: ZipProgressCallback
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder("certificates") || zip;
  const total = certificates.length;

  for (let i = 0; i < total; i++) {
    const item = certificates[i];
    const rawFilename = item.filename || sanitizeFilename(item.recipient.name);
    // Ensure filename ends with .png
    const filename = rawFilename.endsWith(".png") ? rawFilename : `${rawFilename}.png`;

    // Strip base64 metadata
    const base64Data = item.dataUrl.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");

    folder.file(filename, base64Data, { base64: true });

    if (onProgress) {
      const percentage = Math.round(((i + 1) / total) * 100);
      onProgress(i + 1, total, percentage, item.recipient.name);
    }
  }

  // Generate ZIP blob
  const content = await zip.generateAsync(
    {
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      // Optional internal zip compression progress
    }
  );

  return content;
}

/**
 * Triggers browser download of a Blob or URL
 */
export function triggerDownload(blobOrUrl: Blob | string, filename: string) {
  const link = document.createElement("a");
  if (typeof blobOrUrl === "string") {
    link.href = blobOrUrl;
  } else {
    link.href = URL.createObjectURL(blobOrUrl);
  }
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (typeof blobOrUrl !== "string") {
    setTimeout(() => URL.revokeObjectURL(link.href), 3000);
  }
}
