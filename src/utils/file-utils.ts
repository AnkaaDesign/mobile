// packages/utils/src/file-utils.ts
// Consolidated file utilities with Brazilian formatting and MIME type support

import { formatNumberWithDecimals } from "./number";
import type { File as AnkaaFile } from '../types';

// =====================
// Basic File Utilities (from utils/file.ts)
// =====================

/**
 * Extracts the file extension from a filename
 * @param filename Filename or path
 * @returns File extension (without the dot) or empty string
 */
export const getFileExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf(".");
  return lastDot !== -1 ? filename.substring(lastDot + 1).toLowerCase() : "";
};

/**
 * Gets the filename without extension
 * @param filename Filename or path
 * @returns Filename without extension
 */
export const getFileNameWithoutExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf(".");
  return lastDot !== -1 ? filename.substring(0, lastDot) : filename;
};

/**
 * Formats file size into a human-readable string (legacy format)
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  if (!bytes || isNaN(bytes)) return "Unknown size";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Formats file size into a compact string
 * @param bytes File size in bytes
 * @returns Formatted compact string (e.g., "2.5MB")
 */
export const formatFileSizeCompact = (bytes: number): string => {
  if (bytes === 0) return "0B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
};

// Size conversion utilities
export const bytesToMB = (bytes: number): number => bytes / (1024 * 1024);
export const bytesToKB = (bytes: number): number => bytes / 1024;
export const mbToBytes = (mb: number): number => mb * 1024 * 1024;
export const kbToBytes = (kb: number): number => kb * 1024;

// =====================
// File Type Category (from lib/file.ts)
// =====================

export type FileTypeCategory = 'image' | 'video' | 'pdf' | 'document';

/**
 * Gets a MIME type based on file extension (from lib/file.ts)
 * @param filename Filename with extension
 * @returns Mime type or application/octet-stream if unknown
 */
export const getMimeTypeFromFilename = (filename: string): string => {
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
};

// =====================
// API URL Utilities (from utils/file.ts)
// =====================

export const getApiBaseUrl = (): string => {
  // Check for global __ANKAA_API_URL__ (set by the app)
  if (typeof global !== "undefined" && (global as any).__ANKAA_API_URL__) {
    return (global as any).__ANKAA_API_URL__;
  }

  // Check for process.env in React Native/Expo environments
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Default fallback
  return "http://localhost:3030";
};

/**
 * Normalizes a thumbnail URL to ensure it's a complete URL
 * If the URL is relative (starts with /files), it prepends the API base URL
 * If it's already a complete URL (starts with http), it returns it as-is
 */
export const normalizeThumbnailUrl = (thumbnailUrl: string | undefined | null): string | undefined => {
  if (!thumbnailUrl) return undefined;

  // If already a complete URL, return as-is
  if (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://')) {
    return thumbnailUrl;
  }

  const apiBaseUrl = getApiBaseUrl();

  // Remove leading /api if present (old format)
  const cleanPath = thumbnailUrl.startsWith('/api/')
    ? thumbnailUrl.substring(4) // Remove '/api'
    : thumbnailUrl;

  // Ensure path starts with /
  const path = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

  return `${apiBaseUrl}${path}`;
};

/**
 * Gets the URL to serve/view a file (from utils/file.ts)
 * @param file File object with id
 * @param baseUrl Optional API base URL
 * @returns Complete file URL
 */
export const getFileUrl = (file: AnkaaFile, baseUrl?: string): string => {
  const apiUrl = baseUrl || getApiBaseUrl();
  // NOTE: No /api prefix! Backend routes are /files/serve/{id}
  return `${apiUrl}/files/serve/${file.id}`;
};

/**
 * Gets the download URL for a file (from utils/file.ts)
 * @param file File object with id
 * @param baseUrl Optional API base URL
 * @returns Complete download URL
 */
export const getFileDownloadUrl = (file: AnkaaFile, baseUrl?: string): string => {
  const apiUrl = baseUrl || getApiBaseUrl();
  // NOTE: No /api prefix! Backend routes are /files/{id}/download
  return `${apiUrl}/files/${file.id}/download`;
};

/**
 * Gets the thumbnail URL for an image file (from utils/file.ts)
 * @param file File object with id
 * @param size Thumbnail size
 * @param baseUrl Optional API base URL
 * @returns Complete thumbnail URL or empty string for non-images
 */
export const getFileThumbnailUrl = (file: AnkaaFile, size: "small" | "medium" | "large" = "medium", baseUrl?: string): string => {
  const apiUrl = baseUrl || getApiBaseUrl();
  // NOTE: No /api prefix! Backend routes are /files/thumbnail/{id}
  return `${apiUrl}/files/thumbnail/${file.id}?size=${size}`;
};

// =====================
// File Category Detection (from utils/file.ts)
// =====================

export const getFileCategoryFromExtension = (extension: string): string => {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "ico"];
  const documentExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf", "odt", "ods", "odp"];
  const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv", "m4v"];
  const audioExtensions = ["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a"];
  const archiveExtensions = ["zip", "rar", "7z", "tar", "gz", "bz2", "xz"];

  const ext = extension.toLowerCase();

  if (imageExtensions.includes(ext)) return "image";
  if (documentExtensions.includes(ext)) return "document";
  if (videoExtensions.includes(ext)) return "video";
  if (audioExtensions.includes(ext)) return "audio";
  if (archiveExtensions.includes(ext)) return "archive";

  return "other";
};

export const getFileCategory = (file: AnkaaFile): string => {
  return getFileCategoryFromExtension(getFileExtension(file.filename));
};

// =====================
// File Icon Utilities (from utils/file.ts)
// =====================

export const getFileIcon = (file: AnkaaFile): string => {
  const category = getFileCategory(file);
  return getFileCategoryIcon(category);
};

export const getFileCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    image: "🖼️",
    document: "📄",
    video: "🎥",
    audio: "🎵",
    archive: "📦",
    other: "📎",
  };
  return icons[category] || icons.other;
};

export const getFileIconClass = (file: AnkaaFile): string => {
  const category = getFileCategory(file);
  const classes: Record<string, string> = {
    image: "file-image",
    document: "file-document",
    video: "file-video",
    audio: "file-audio",
    archive: "file-archive",
    other: "file-other",
  };
  return classes[category] || classes.other;
};

// =====================
// File Validation Utilities (from utils/file.ts)
// =====================

export const isFileSizeValid = (file: AnkaaFile, maxSizeMB: number = 10): boolean => {
  return bytesToMB(file.size) <= maxSizeMB;
};

export const isFileTypeAllowed = (file: AnkaaFile, allowedTypes: string[]): boolean => {
  const extension = getFileExtension(file.filename);
  return allowedTypes.includes(extension);
};

export const validateFileUpload = (
  file: AnkaaFile,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
    allowedCategories?: string[];
  } = {},
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const { maxSizeMB = 10, allowedTypes, allowedCategories } = options;

  // Size validation
  if (!isFileSizeValid(file, maxSizeMB)) {
    errors.push(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
  }

  // Type validation
  if (allowedTypes && !isFileTypeAllowed(file, allowedTypes)) {
    errors.push(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(", ")}`);
  }

  // Category validation
  if (allowedCategories) {
    const category = getFileCategory(file);
    if (!allowedCategories.includes(category)) {
      errors.push(`Categoria de arquivo não permitida. Categorias aceitas: ${allowedCategories.join(", ")}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// =====================
// File Display Utilities (from utils/file.ts)
// =====================

export const formatFileDisplay = (file: AnkaaFile): string => {
  return `${file.filename} (${formatFileSize(file.size)})`;
};

export const formatFileFullDisplay = (file: AnkaaFile): string => {
  const category = getFileCategory(file);
  const icon = getFileIcon(file);
  return `${icon} ${file.filename} - ${formatFileSize(file.size)} - ${category}`;
};

export const formatFileInfo = (file: AnkaaFile): { name: string; size: string; type: string; category: string; icon: string } => {
  return {
    name: file.filename,
    size: formatFileSize(file.size),
    type: file.mimetype,
    category: getFileCategory(file),
    icon: getFileIcon(file),
  };
};

export const getFileDisplayName = (file: AnkaaFile, maxLength: number = 50): string => {
  if (file.filename.length <= maxLength) return file.filename;
  const extension = getFileExtension(file.filename);
  const nameWithoutExt = getFileNameWithoutExtension(file.filename);
  const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4) + "...";
  return extension ? `${truncatedName}.${extension}` : truncatedName;
};

// =====================
// File Operations (from utils/file.ts)
// =====================

export const groupFilesByDate = (files: AnkaaFile[], groupBy: "day" | "week" | "month" = "day"): Record<string, AnkaaFile[]> => {
  const grouped: Record<string, AnkaaFile[]> = {};

  files.forEach((file) => {
    const date = new Date(file.createdAt);
    let key: string;

    switch (groupBy) {
      case "day":
        key = date.toISOString().split("T")[0];
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
        break;
      case "month":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(file);
  });

  return grouped;
};

// =====================
// Enhanced MIME Type Detection
// =====================

export const getFileTypeFromMime = (mimeType: string): string => {
  const type = mimeType.toLowerCase();

  // Image types
  if (type.startsWith("image/")) {
    return "image";
  }

  // Video types
  if (type.startsWith("video/")) {
    return "video";
  }

  // Audio types
  if (type.startsWith("audio/")) {
    return "audio";
  }

  // Document types
  if (
    type.includes("pdf") ||
    type.includes("msword") ||
    type.includes("wordprocessingml") ||
    type.includes("spreadsheetml") ||
    type.includes("presentationml") ||
    type.includes("opendocument") ||
    type.includes("rtf") ||
    type.includes("text/plain")
  ) {
    return "document";
  }

  // Archive types
  if (type.includes("zip") || type.includes("rar") || type.includes("7z") || type.includes("tar") || type.includes("gzip") || type.includes("bzip")) {
    return "archive";
  }

  // Code types
  if (type.includes("javascript") || type.includes("typescript") || type.includes("json") || type.includes("xml") || type.includes("html") || type.includes("css")) {
    return "code";
  }

  return "other";
};

// =====================
// Enhanced File Size Formatting (Brazilian)
// =====================

export const formatFileSizeBrazilian = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  // Use Brazilian number formatting with comma as decimal separator
  const formattedValue = formatNumberWithDecimals(value, 2, "pt-BR");
  return `${formattedValue} ${sizes[i]}`;
};

export const formatFileSizeCompactBrazilian = (bytes: number): string => {
  if (bytes === 0) return "0B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  const formattedValue = formatNumberWithDecimals(value, 1, "pt-BR");
  return `${formattedValue}${sizes[i]}`;
};

// =====================
// Enhanced File Type Validation with MIME Support
// =====================

/**
 * Determines if a file is an image
 * Supports both standalone parameters and File objects
 * @param filenameOrFile Filename string or File object
 * @param mimeType Optional MIME type (ignored if first param is File object)
 * @returns True if the file is an image
 */
export function isImageFile(filenameOrFile: string | AnkaaFile, mimeType?: string): boolean {
  // Handle File object
  if (typeof filenameOrFile === 'object' && 'filename' in filenameOrFile) {
    const file = filenameOrFile as AnkaaFile;
    if (file.mimetype && file.mimetype.startsWith("image/")) return true;
    const ext = getFileExtension(file.filename);
    return ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "ico", "tiff", "tif", "avif", "heic", "heif"].includes(ext);
  }

  // Handle standalone parameters (filename first, mimeType second - standardized)
  const filename = filenameOrFile as string;
  if (mimeType) {
    if (mimeType.startsWith("image/")) return true;
    // Also check filename extension as fallback
  }

  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "ico", "tiff", "tif", "avif", "heic", "heif"];
  const extension = getFileExtension(filename);
  return imageExtensions.includes(extension);
}

/**
 * Determines if a file is a PDF
 * Supports both standalone parameters and File objects
 * @param filenameOrFile Filename string or File object
 * @param mimeType Optional MIME type (ignored if first param is File object)
 * @returns True if the file is a PDF
 */
export function isPdfFile(filenameOrFile: string | AnkaaFile, mimeType?: string): boolean {
  // Handle File object
  if (typeof filenameOrFile === 'object' && 'filename' in filenameOrFile) {
    const file = filenameOrFile as AnkaaFile;
    if (file.mimetype && file.mimetype.toLowerCase().includes("pdf")) return true;
    return getFileExtension(file.filename) === "pdf";
  }

  // Handle standalone parameters (filename first, mimeType second - standardized)
  const filename = filenameOrFile as string;
  if (mimeType && mimeType.toLowerCase().includes("pdf")) {
    return true;
  }

  return getFileExtension(filename) === "pdf";
}

/**
 * Determines if a file is a video
 * Supports both standalone parameters and File objects
 * @param filenameOrFile Filename string or File object
 * @param mimeType Optional MIME type (ignored if first param is File object)
 * @returns True if the file is a video
 */
export function isVideoFile(filenameOrFile: string | AnkaaFile, mimeType?: string): boolean {
  // Handle File object
  if (typeof filenameOrFile === 'object' && 'filename' in filenameOrFile) {
    const file = filenameOrFile as AnkaaFile;
    if (file.mimetype && file.mimetype.startsWith("video/")) return true;
    const ext = getFileExtension(file.filename);
    return ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv", "m4v", "3gp", "ogv", "m2v", "mpg", "mpeg"].includes(ext);
  }

  // Handle standalone parameters (filename first, mimeType second - standardized)
  const filename = filenameOrFile as string;
  if (mimeType && mimeType.startsWith("video/")) {
    return true;
  }

  const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv", "m4v", "3gp", "ogv", "m2v", "mpg", "mpeg"];
  const extension = getFileExtension(filename);
  return videoExtensions.includes(extension);
}

/**
 * Determines if a file is audio
 * Supports both standalone parameters and File objects
 * @param filenameOrFile Filename string or File object
 * @param mimeType Optional MIME type (ignored if first param is File object)
 * @returns True if the file is audio
 */
export function isAudioFile(filenameOrFile: string | AnkaaFile, mimeType?: string): boolean {
  // Handle File object
  if (typeof filenameOrFile === 'object' && 'filename' in filenameOrFile) {
    const file = filenameOrFile as AnkaaFile;
    if (file.mimetype && file.mimetype.startsWith("audio/")) return true;
    const ext = getFileExtension(file.filename);
    return ["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a", "opus", "aiff", "au"].includes(ext);
  }

  // Handle standalone parameters (filename first, mimeType second - standardized)
  const filename = filenameOrFile as string;
  if (mimeType && mimeType.startsWith("audio/")) {
    return true;
  }

  const audioExtensions = ["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a", "opus", "aiff", "au"];
  const extension = getFileExtension(filename);
  return audioExtensions.includes(extension);
}

/**
 * Determines if a file is a document
 * Supports both standalone parameters and File objects
 * @param filenameOrFile Filename string or File object
 * @param mimeType Optional MIME type (ignored if first param is File object)
 * @returns True if the file is a document
 */
export function isDocumentFile(filenameOrFile: string | AnkaaFile, mimeType?: string): boolean {
  // Handle File object
  if (typeof filenameOrFile === 'object' && 'filename' in filenameOrFile) {
    const file = filenameOrFile as AnkaaFile;
    return getFileCategory(file) === "document";
  }

  // Handle standalone parameters (filename first, mimeType second - standardized)
  const filename = filenameOrFile as string;
  if (mimeType) {
    return getFileTypeFromMime(mimeType) === "document";
  }

  const documentExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf", "odt", "ods", "odp", "csv", "pages", "numbers", "key"];
  const extension = getFileExtension(filename);
  return documentExtensions.includes(extension);
}

/**
 * Determines if a file is an archive
 * Supports both standalone parameters and File objects
 * @param filenameOrFile Filename string or File object
 * @param mimeType Optional MIME type (ignored if first param is File object)
 * @returns True if the file is an archive
 */
export function isArchiveFile(filenameOrFile: string | AnkaaFile, mimeType?: string): boolean {
  // Handle File object
  if (typeof filenameOrFile === 'object' && 'filename' in filenameOrFile) {
    const file = filenameOrFile as AnkaaFile;
    return getFileCategory(file) === "archive";
  }

  // Handle standalone parameters (filename first, mimeType second - standardized)
  const filename = filenameOrFile as string;
  if (mimeType) {
    return getFileTypeFromMime(mimeType) === "archive";
  }

  const archiveExtensions = ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "lzma", "z"];
  const extension = getFileExtension(filename);
  return archiveExtensions.includes(extension);
}

/**
 * Gets the file type category (from lib/file.ts)
 * @param mimetype File MIME type
 * @param filename Filename with extension
 * @returns File type category: 'image', 'video', 'pdf', or 'document'
 */
export function getFileTypeCategory(mimetype: string, filename?: string): FileTypeCategory {
  if (isImageFile(filename || '', mimetype)) return "image";
  if (isVideoFile(filename || '', mimetype)) return "video";
  if (isPdfFile(filename || '', mimetype)) return "pdf";
  return "document";
}

// =====================
// Enhanced Filename Generation and Sanitization
// =====================

export const generateUniqueFilename = (
  originalFilename: string,
  existingFilenames: string[] = [],
  options: {
    preserveExtension?: boolean;
    separator?: string;
    maxLength?: number;
  } = {},
): string => {
  const { preserveExtension = true, separator = "_", maxLength = 255 } = options;

  const extension = preserveExtension ? getFileExtension(originalFilename) : "";
  const nameWithoutExt = preserveExtension && extension ? originalFilename.substring(0, originalFilename.lastIndexOf(".")) : originalFilename;

  let uniqueName = originalFilename;
  let counter = 1;

  while (existingFilenames.includes(uniqueName)) {
    const suffix = `${separator}${counter}`;

    if (preserveExtension && extension) {
      uniqueName = `${nameWithoutExt}${suffix}.${extension}`;
    } else {
      uniqueName = `${nameWithoutExt}${suffix}`;
    }

    // Check if name exceeds max length
    if (uniqueName.length > maxLength) {
      const maxNameLength = maxLength - suffix.length - (extension ? extension.length + 1 : 0);
      const truncatedName = nameWithoutExt.substring(0, maxNameLength);

      if (preserveExtension && extension) {
        uniqueName = `${truncatedName}${suffix}.${extension}`;
      } else {
        uniqueName = `${truncatedName}${suffix}`;
      }
    }

    counter++;
  }

  return uniqueName;
};

/**
 * Simple filename sanitization (from lib/file.ts)
 * @param filename Original filename
 * @returns Sanitized filename (simple version)
 */
export function sanitizeFilenameSimple(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
}

/**
 * Advanced filename sanitization with options
 * @param filename Original filename
 * @param options Sanitization options
 * @returns Sanitized filename
 */
export const sanitizeFilename = (
  filename: string,
  options: {
    removeSpaces?: boolean;
    preserveCase?: boolean;
    maxLength?: number;
    allowUnicode?: boolean;
    replacement?: string;
  } = {},
): string => {
  const { removeSpaces = true, preserveCase = false, maxLength = 255, allowUnicode = true, replacement = "_" } = options;

  let sanitized = filename.trim();

  // Remove or replace dangerous characters
  if (allowUnicode) {
    // Allow Unicode characters but remove dangerous ones for file systems
    sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1f]/g, replacement);
  } else {
    // Only allow ASCII alphanumeric, dots, hyphens, and underscores
    sanitized = sanitized.replace(/[^\w\s.-]/gi, replacement);
  }

  // Handle spaces
  if (removeSpaces) {
    sanitized = sanitized.replace(/\s+/g, replacement);
  } else {
    sanitized = sanitized.replace(/\s+/g, " ");
  }

  // Remove multiple consecutive separators
  const escapedReplacement = replacement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const multipleReplacementRegex = new RegExp(`${escapedReplacement}{2,}`, "g");
  sanitized = sanitized
    .replace(multipleReplacementRegex, replacement)
    .replace(/-{2,}/g, "-")
    .replace(/\.{2,}/g, ".");

  // Remove leading/trailing separators
  const leadingTrailingRegex = new RegExp(`^[${escapedReplacement}.-]+|[${escapedReplacement}.-]+$`, "g");
  sanitized = sanitized.replace(leadingTrailingRegex, "");

  // Handle case
  if (!preserveCase) {
    sanitized = sanitized.toLowerCase();
  }

  // Truncate if necessary while preserving extension
  if (sanitized.length > maxLength) {
    const extension = getFileExtension(sanitized);
    if (extension) {
      const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf("."));
      const maxNameLength = maxLength - extension.length - 1; // -1 for the dot

      if (maxNameLength > 0) {
        sanitized = `${nameWithoutExt.substring(0, maxNameLength)}.${extension}`;
      } else {
        sanitized = sanitized.substring(0, maxLength);
      }
    } else {
      sanitized = sanitized.substring(0, maxLength);
    }
  }

  return sanitized || "arquivo"; // Default name if everything was removed
};

// =====================
// Enhanced File Validation
// =====================

export const validateFileType = (
  filename: string,
  mimeType: string,
  allowedTypes: {
    extensions?: string[];
    mimeTypes?: string[];
    categories?: string[];
  },
): { valid: boolean; error?: string } => {
  const extension = getFileExtension(filename);
  const category = getFileTypeFromMime(mimeType);

  // Check extensions
  if (allowedTypes.extensions && allowedTypes.extensions.length > 0) {
    if (!allowedTypes.extensions.includes(extension)) {
      return {
        valid: false,
        error: `Tipo de arquivo não permitido. Extensões aceitas: ${allowedTypes.extensions.join(", ")}`,
      };
    }
  }

  // Check MIME types
  if (allowedTypes.mimeTypes && allowedTypes.mimeTypes.length > 0) {
    const isAllowed = allowedTypes.mimeTypes.some((allowed) => mimeType.toLowerCase().includes(allowed.toLowerCase()));

    if (!isAllowed) {
      return {
        valid: false,
        error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.mimeTypes.join(", ")}`,
      };
    }
  }

  // Check categories
  if (allowedTypes.categories && allowedTypes.categories.length > 0) {
    if (!allowedTypes.categories.includes(category)) {
      return {
        valid: false,
        error: `Categoria de arquivo não permitida. Categorias aceitas: ${allowedTypes.categories.join(", ")}`,
      };
    }
  }

  return { valid: true };
};

export const validateFileSize = (
  sizeInBytes: number,
  constraints: {
    maxSizeInMB?: number;
    minSizeInBytes?: number;
    useBrazilianFormat?: boolean;
  } = {},
): { valid: boolean; error?: string } => {
  const { maxSizeInMB = 100, minSizeInBytes = 1, useBrazilianFormat = true } = constraints;

  if (sizeInBytes < minSizeInBytes) {
    const minSizeFormatted = useBrazilianFormat ? formatFileSizeBrazilian(minSizeInBytes) : formatFileSize(minSizeInBytes);

    return {
      valid: false,
      error: `Arquivo muito pequeno. Tamanho mínimo: ${minSizeFormatted}`,
    };
  }

  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (sizeInBytes > maxSizeInBytes) {
    const maxSizeFormatted = useBrazilianFormat ? formatFileSizeBrazilian(maxSizeInBytes) : formatFileSize(maxSizeInBytes);

    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${maxSizeFormatted}`,
    };
  }

  return { valid: true };
};

// =====================
// File Icon Mapping
// =====================

export const getFileIconFromMime = (mimeType: string): string => {
  const type = mimeType.toLowerCase();

  // Specific file type icons (using common icon library names)
  if (type.includes("pdf")) return "file-pdf";
  if (type.includes("msword") || type.includes("wordprocessingml")) return "file-word";
  if (type.includes("spreadsheetml") || type.includes("ms-excel")) return "file-excel";
  if (type.includes("presentationml") || type.includes("ms-powerpoint")) return "file-powerpoint";
  if (type.includes("text/plain")) return "file-text";
  if (type.includes("json")) return "file-code";
  if (type.includes("xml") || type.includes("html")) return "file-code";
  if (type.includes("javascript") || type.includes("typescript")) return "file-code";
  if (type.includes("css")) return "file-code";
  if (type.includes("zip") || type.includes("rar") || type.includes("7z")) return "file-archive";

  // Category-based icons
  const category = getFileTypeFromMime(mimeType);
  const categoryIcons: Record<string, string> = {
    image: "file-image",
    video: "file-video",
    audio: "file-audio",
    document: "file-document",
    archive: "file-archive",
    code: "file-code",
    other: "file",
  };

  return categoryIcons[category] || "file";
};

export const getFileColorFromType = (mimeType: string): string => {
  const type = mimeType.toLowerCase();

  // Specific colors for common file types (using Tailwind CSS color names)
  if (type.includes("pdf")) return "red-600";
  if (type.includes("msword") || type.includes("wordprocessingml")) return "blue-600";
  if (type.includes("spreadsheetml") || type.includes("ms-excel")) return "green-600";
  if (type.includes("presentationml") || type.includes("ms-powerpoint")) return "orange-600";
  if (type.includes("image/")) return "purple-600";
  if (type.includes("video/")) return "pink-600";
  if (type.includes("audio/")) return "emerald-600";
  if (type.includes("text/")) return "gray-500";
  if (type.includes("json") || type.includes("javascript")) return "yellow-500";
  if (type.includes("css")) return "blue-400";
  if (type.includes("html")) return "orange-500";
  if (type.includes("zip") || type.includes("rar")) return "amber-700";

  return "gray-500"; // Default color
};

// Map MIME types to icon names for various icon libraries
export const MIME_TYPE_ICONS: Record<string, Record<string, string>> = {
  // FontAwesome icons
  fontawesome: {
    "application/pdf": "fa-file-pdf",
    "application/msword": "fa-file-word",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "fa-file-word",
    "application/vnd.ms-excel": "fa-file-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "fa-file-excel",
    "application/vnd.ms-powerpoint": "fa-file-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "fa-file-powerpoint",
    "text/plain": "fa-file-text",
    "application/json": "fa-file-code",
    "application/javascript": "fa-file-code",
    "text/css": "fa-file-code",
    "text/html": "fa-file-code",
    "application/zip": "fa-file-archive",
    "application/x-rar-compressed": "fa-file-archive",
    "image/*": "fa-file-image",
    "video/*": "fa-file-video",
    "audio/*": "fa-file-audio",
  },

  // Lucide icons
  lucide: {
    "application/pdf": "file-text",
    "application/msword": "file-text",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "file-text",
    "application/vnd.ms-excel": "file-spreadsheet",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "file-spreadsheet",
    "application/vnd.ms-powerpoint": "presentation",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "presentation",
    "text/plain": "file-text",
    "application/json": "file-code",
    "application/javascript": "file-code",
    "text/css": "file-code",
    "text/html": "file-code",
    "application/zip": "file-archive",
    "application/x-rar-compressed": "file-archive",
    "image/*": "image",
    "video/*": "video",
    "audio/*": "audio",
  },
};

export const getIconForMimeType = (mimeType: string, iconLibrary: "fontawesome" | "lucide" = "lucide"): string => {
  const icons = MIME_TYPE_ICONS[iconLibrary];

  // Try exact match first
  if (icons[mimeType]) {
    return icons[mimeType];
  }

  // Try category match
  const category = getFileTypeFromMime(mimeType);
  const categoryKey = `${category}/*`;
  if (icons[categoryKey]) {
    return icons[categoryKey];
  }

  // Default icon
  return iconLibrary === "fontawesome" ? "fa-file" : "file";
};

// =====================
// Thumbnail and URL Builders
// =====================

export const buildThumbnailUrl = (fileId: string, size: "xs" | "sm" | "md" | "lg" | "xl" = "md", baseUrl: string = "/api"): string => {
  const sizeParams: Record<string, string> = {
    xs: "64x64",
    sm: "128x128",
    md: "256x256",
    lg: "512x512",
    xl: "1024x1024",
  };

  return `${baseUrl}/files/${fileId}/thumbnail?size=${sizeParams[size]}`;
};

export const buildFileDownloadUrl = (fileId: string, filename?: string, baseUrl: string = "/api"): string => {
  const downloadUrl = `${baseUrl}/files/${fileId}/download`;
  return filename ? `${downloadUrl}?filename=${encodeURIComponent(filename)}` : downloadUrl;
};

export const buildFilePreviewUrl = (fileId: string, baseUrl: string = "/api"): string => {
  return `${baseUrl}/files/${fileId}/preview`;
};

// Note: The downloadFile function has been moved to the web app's utils
// as it requires browser-specific APIs (document)

// =====================
// File Processing Utilities
// =====================

export const getFileMetadata = (
  file: File,
): {
  name: string;
  size: number;
  type: string;
  category: string;
  extension: string;
  lastModified?: Date;
  isImage: boolean;
  isPdf: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isDocument: boolean;
  isArchive: boolean;
  formattedSize: string;
  formattedSizeBrazilian: string;
} => {
  const extension = getFileExtension(file.name);
  const category = getFileTypeFromMime(file.type);

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    category,
    extension,
    lastModified: new Date(file.lastModified),
    isImage: isImageFile(file.name, file.type),
    isPdf: isPdfFile(file.name, file.type),
    isVideo: isVideoFile(file.name, file.type),
    isAudio: isAudioFile(file.name, file.type),
    isDocument: isDocumentFile(file.name, file.type),
    isArchive: isArchiveFile(file.name, file.type),
    formattedSize: formatFileSize(file.size),
    formattedSizeBrazilian: formatFileSizeBrazilian(file.size),
  };
};

export const createFileHash = async (file: File): Promise<string> => {
  // Check if arrayBuffer method exists
  if (typeof file.arrayBuffer !== 'function') {
    throw new Error('File.arrayBuffer is not supported in this environment');
  }

  // Check if crypto.subtle is available
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('crypto.subtle is not available in this environment');
  }

  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const generateUploadId = (): string => {
  return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

// =====================
// Comprehensive File Validation
// =====================

export const validateFile = (
  file: File,
  constraints: {
    maxSizeInMB?: number;
    minSizeInBytes?: number;
    allowedExtensions?: string[];
    allowedMimeTypes?: string[];
    allowedCategories?: string[];
    useBrazilianFormat?: boolean;
  } = {},
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Size validation
  const sizeValidation = validateFileSize(file.size, constraints);
  if (!sizeValidation.valid && sizeValidation.error) {
    errors.push(sizeValidation.error);
  }

  // Type validation
  const typeValidation = validateFileType(file.name, file.type, {
    extensions: constraints.allowedExtensions,
    mimeTypes: constraints.allowedMimeTypes,
    categories: constraints.allowedCategories,
  });
  if (!typeValidation.valid && typeValidation.error) {
    errors.push(typeValidation.error);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// =====================
// Export Comprehensive File Utils Object
// =====================

// Consolidated export object with all utilities
export const fileUtils = {
  // Basic utilities
  getFileExtension,
  getFileNameWithoutExtension,

  // Size formatting
  formatFileSize,
  formatFileSizeCompact,
  formatFileSizeBrazilian,
  formatFileSizeCompactBrazilian,
  bytesToMB,
  bytesToKB,
  mbToBytes,
  kbToBytes,

  // MIME type utilities
  getMimeTypeFromFilename,
  getFileTypeFromMime,
  getFileTypeCategory,

  // API URL utilities
  getApiBaseUrl,
  normalizeThumbnailUrl,
  getFileUrl,
  getFileDownloadUrl,
  getFileThumbnailUrl,

  // File category detection
  getFileCategoryFromExtension,
  getFileCategory,

  // File type validation
  isImageFile,
  isPdfFile,
  isVideoFile,
  isAudioFile,
  isDocumentFile,
  isArchiveFile,

  // File icons
  getFileIcon,
  getFileCategoryIcon,
  getFileIconClass,
  getFileIconFromMime,
  getFileColorFromType,
  getIconForMimeType,
  MIME_TYPE_ICONS,

  // Validation
  isFileSizeValid,
  isFileTypeAllowed,
  validateFileUpload,
  validateFileType,
  validateFileSize,
  validateFile,

  // Filename handling
  sanitizeFilename,
  sanitizeFilenameSimple,
  generateUniqueFilename,

  // Display utilities
  formatFileDisplay,
  formatFileFullDisplay,
  formatFileInfo,
  getFileDisplayName,

  // File operations
  groupFilesByDate,

  // URL builders (enhanced)
  buildThumbnailUrl,
  buildFileDownloadUrl,
  buildFilePreviewUrl,

  // File processing
  getFileMetadata,
  createFileHash,
  generateUploadId,
};

// Legacy export for backward compatibility
export const fileUtilsEnhanced = fileUtils;
