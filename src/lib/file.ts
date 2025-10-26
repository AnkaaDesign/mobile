/**
 * File utilities for handling different file types and operations
 */

/**
 * File type category
 */
export type FileTypeCategory = 'image' | 'video' | 'pdf' | 'document';

/**
 * Formats file size into a human-readable string
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  if (!bytes || isNaN(bytes)) return "Unknown size";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Sanitizes a filename to ensure it's safe for filesystem operations
 * @param filename Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
}

/**
 * Extracts the file extension from a filename
 * @param filename Filename or path
 * @returns File extension (without the dot) or empty string
 */
export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * Determines if a file is an image based on its mimetype or filename
 * @param mimetype File MIME type
 * @param filename Optional filename to check extension
 * @returns True if the file is an image
 */
export function isImageFile(mimetype: string, filename?: string): boolean {
  if (mimetype.startsWith("image/")) return true;
  if (filename) {
    const ext = getFileExtension(filename);
    return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic", "heif"].includes(ext);
  }
  return false;
}

/**
 * Determines if a file is a video based on its mimetype or filename
 * @param mimetype File MIME type
 * @param filename Optional filename to check extension
 * @returns True if the file is a video
 */
export function isVideoFile(mimetype: string, filename?: string): boolean {
  if (mimetype.startsWith("video/")) return true;
  if (filename) {
    const ext = getFileExtension(filename);
    return ["mp4", "mov", "avi", "wmv", "flv", "mkv", "webm", "m4v", "3gp"].includes(ext);
  }
  return false;
}

/**
 * Determines if a file is a PDF based on its mimetype or filename
 * @param mimetype File MIME type
 * @param filename Optional filename to check extension
 * @returns True if the file is a PDF
 */
export function isPdfFile(mimetype: string, filename?: string): boolean {
  if (mimetype === "application/pdf") return true;
  if (filename && getFileExtension(filename) === "pdf") return true;
  return false;
}

/**
 * Gets a MIME type based on file extension
 * @param filename Filename with extension
 * @returns Mime type or application/octet-stream if unknown
 */
export function getMimeTypeFromFilename(filename: string): string {
  const ext = getFileExtension(filename);
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    heic: "image/heic",
    heif: "image/heif",
    // Videos
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    wmv: "video/x-ms-wmv",
    flv: "video/x-flv",
    mkv: "video/x-matroska",
    webm: "video/webm",
    m4v: "video/x-m4v",
    "3gp": "video/3gpp",
    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

/**
 * Gets the file type category
 * @param mimetype File MIME type
 * @param filename Filename with extension
 * @returns File type category: 'image', 'video', 'pdf', or 'document'
 */
export function getFileTypeCategory(mimetype: string, filename?: string): FileTypeCategory {
  if (isImageFile(mimetype, filename)) return "image";
  if (isVideoFile(mimetype, filename)) return "video";
  if (isPdfFile(mimetype, filename)) return "pdf";
  return "document";
}
