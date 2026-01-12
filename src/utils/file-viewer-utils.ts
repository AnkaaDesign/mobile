/**
 * File Viewer Utilities for Mobile
 * Provides URL generation, file detection, and helper functions
 * Matches web implementation patterns while adapting for React Native
 */

// @ts-ignore - expo-constants may not have types in this environment
import Constants from 'expo-constants';
import type { File as AnkaaFile } from '../types';

// =====================
// API URL Resolution (FIXED)
// =====================

/**
 * Get the API base URL with proper priority order
 * This fixes the localhost fallback bug
 */
export const getApiBaseUrl = (): string => {
  // Priority order:
  // 1. Expo constants (from app.json extra.apiUrl) - MOST RELIABLE for production builds
  // 2. Environment variable (for development)
  // 3. Global variable
  // 4. Fallback

  if (Constants.expoConfig?.extra?.apiUrl) {
    console.log('[File Viewer] Using API URL from app.json:', Constants.expoConfig.extra.apiUrl);
    return Constants.expoConfig.extra.apiUrl;
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log('[File Viewer] Using API URL from env:', process.env.EXPO_PUBLIC_API_URL);
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (typeof (globalThis as any).__ANKAA_API_URL__ !== 'undefined') {
    console.log('[File Viewer] Using API URL from global:', (globalThis as any).__ANKAA_API_URL__);
    return (globalThis as any).__ANKAA_API_URL__;
  }

  // Fallback - should not reach here if properly configured
  console.error('[File Viewer] No API_URL configured! Using fallback');
  return 'http://192.168.0.13:3030';
};

// =====================
// File URL Generation
// =====================

export interface FileUrls {
  serve: string;
  download: string;
  thumbnailSmall: string;
  thumbnailMedium: string;
  thumbnailLarge: string;
}

/**
 * Generate all URLs for a file
 * Matches web implementation
 */
export const generateFileUrls = (file: AnkaaFile, baseUrl?: string): FileUrls => {
  const apiUrl = baseUrl || getApiBaseUrl();

  return {
    serve: `${apiUrl}/files/serve/${file.id}`,
    download: `${apiUrl}/files/${file.id}/download`,
    thumbnailSmall: `${apiUrl}/files/thumbnail/${file.id}?size=small`,
    thumbnailMedium: `${apiUrl}/files/thumbnail/${file.id}?size=medium`,
    thumbnailLarge: `${apiUrl}/files/thumbnail/${file.id}?size=large`,
  };
};

export const getFileUrl = (file: AnkaaFile, baseUrl?: string): string => {
  const apiUrl = baseUrl || getApiBaseUrl();
  return `${apiUrl}/files/serve/${file.id}`;
};

export const getDownloadUrl = (file: AnkaaFile, baseUrl?: string): string => {
  const apiUrl = baseUrl || getApiBaseUrl();
  return `${apiUrl}/files/${file.id}/download`;
};

export const getThumbnailUrl = (
  file: AnkaaFile,
  size: 'small' | 'medium' | 'large' = 'medium',
  baseUrl?: string
): string => {
  const apiUrl = baseUrl || getApiBaseUrl();

  // If file has thumbnailUrl, use it (with proper URL construction)
  if (file.thumbnailUrl) {
    // Handle absolute URLs
    if (file.thumbnailUrl.startsWith('http')) {
      return file.thumbnailUrl;
    }

    // Handle relative URLs - ensure proper format
    const cleanPath = file.thumbnailUrl.startsWith('/')
      ? file.thumbnailUrl
      : `/${file.thumbnailUrl}`;

    return `${apiUrl}${cleanPath}?size=${size}`;
  }

  // Fallback to thumbnail endpoint
  return `${apiUrl}/files/thumbnail/${file.id}?size=${size}`;
};

// =====================
// File Type Detection
// =====================

export type FileCategory =
  | 'images'
  | 'pdfs'
  | 'videos'
  | 'audio'
  | 'documents'
  | 'archives'
  | 'eps'
  | 'other';

const MIME_TYPE_CATEGORIES: Record<string, FileCategory> = {
  // Images
  'image/jpeg': 'images',
  'image/jpg': 'images',
  'image/png': 'images',
  'image/gif': 'images',
  'image/webp': 'images',
  'image/svg+xml': 'images',
  'image/bmp': 'images',
  'image/tiff': 'images',
  'image/ico': 'images',

  // PDFs
  'application/pdf': 'pdfs',

  // Videos
  'video/mp4': 'videos',
  'video/mpeg': 'videos',
  'video/quicktime': 'videos',
  'video/x-msvideo': 'videos',
  'video/webm': 'videos',
  'video/x-matroska': 'videos',
  'video/x-flv': 'videos',

  // Audio
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/aac': 'audio',
  'audio/m4a': 'audio',

  // EPS
  'application/postscript': 'eps',
  'application/x-eps': 'eps',
  'application/eps': 'eps',
  'image/eps': 'eps',
  'image/x-eps': 'eps',

  // Documents
  'application/msword': 'documents',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'documents',
  'application/vnd.ms-excel': 'documents',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'documents',
  'application/vnd.ms-powerpoint': 'documents',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'documents',
  'text/plain': 'documents',
  'text/csv': 'documents',
  'text/rtf': 'documents',

  // Archives
  'application/zip': 'archives',
  'application/x-rar-compressed': 'archives',
  'application/x-7z-compressed': 'archives',
  'application/x-tar': 'archives',
  'application/gzip': 'archives',
};

const EXTENSION_CATEGORIES: Record<string, FileCategory> = {
  // Images
  jpg: 'images',
  jpeg: 'images',
  png: 'images',
  gif: 'images',
  webp: 'images',
  svg: 'images',
  bmp: 'images',
  tiff: 'images',
  ico: 'images',

  // PDFs
  pdf: 'pdfs',

  // Videos
  mp4: 'videos',
  avi: 'videos',
  mov: 'videos',
  wmv: 'videos',
  flv: 'videos',
  webm: 'videos',
  mkv: 'videos',
  m4v: 'videos',

  // Audio
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  aac: 'audio',
  m4a: 'audio',
  flac: 'audio',

  // EPS
  eps: 'eps',

  // Documents
  doc: 'documents',
  docx: 'documents',
  xls: 'documents',
  xlsx: 'documents',
  ppt: 'documents',
  pptx: 'documents',
  txt: 'documents',
  csv: 'documents',
  rtf: 'documents',

  // Archives
  zip: 'archives',
  rar: 'archives',
  '7z': 'archives',
  tar: 'archives',
  gz: 'archives',
};

/**
 * Detect file category from MIME type or extension
 * Matches web implementation logic
 */
export const detectFileCategory = (file: AnkaaFile): FileCategory => {
  // Try MIME type first
  const mimeType = file.mimetype?.toLowerCase();
  if (mimeType && MIME_TYPE_CATEGORIES[mimeType]) {
    return MIME_TYPE_CATEGORIES[mimeType];
  }

  // Fallback to extension
  const extension = file.filename?.split('.').pop()?.toLowerCase();
  if (extension && EXTENSION_CATEGORIES[extension]) {
    return EXTENSION_CATEGORIES[extension];
  }

  return 'other';
};

// =====================
// File Preview Capabilities
// =====================

/**
 * Check if file can be previewed in-app
 * Images: Always
 * EPS: Only if has thumbnail
 * PDF: Yes (will use native viewer)
 * Video: Yes (will use native player)
 * Others: No (will share to system)
 */
export const canPreviewFile = (file: AnkaaFile): boolean => {
  const category = detectFileCategory(file);

  switch (category) {
    case 'images':
      return true;
    case 'pdfs':
      return true; // We'll implement PDF viewer
    case 'videos':
      return true; // We'll implement video player
    case 'eps':
      return !!file.thumbnailUrl; // Only if has thumbnail
    default:
      return false;
  }
};

/**
 * Check if file is an image
 */
export const isImageFile = (file: AnkaaFile): boolean => {
  return detectFileCategory(file) === 'images' ||
         (detectFileCategory(file) === 'eps' && !!file.thumbnailUrl);
};

/**
 * Check if file is a PDF
 */
export const isPDFFile = (file: AnkaaFile): boolean => {
  return detectFileCategory(file) === 'pdfs';
};

/**
 * Check if file is a video
 */
export const isVideoFile = (file: AnkaaFile): boolean => {
  return detectFileCategory(file) === 'videos';
};

/**
 * Check if file is EPS
 */
export const isEpsFile = (file: AnkaaFile): boolean => {
  const epsMimeTypes = [
    'application/postscript',
    'application/x-eps',
    'application/eps',
    'image/eps',
    'image/x-eps'
  ];
  return epsMimeTypes.includes(file.mimetype?.toLowerCase() || '');
};

// =====================
// File Size Utilities
// =====================

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateFileSize = (file: AnkaaFile, maxSizeMB: number): boolean => {
  const fileSizeMB = file.size / (1024 * 1024);
  return fileSizeMB <= maxSizeMB;
};

// =====================
// Configuration
// =====================

export interface FileViewerConfig {
  baseUrl?: string;
  maxFileSize?: number; // bytes
  pdfMaxFileSize?: number; // bytes (for inline viewing)
  videoMaxFileSize?: number; // bytes (for inline playback)
  enableSecurity?: boolean;
}

export const DEFAULT_CONFIG: FileViewerConfig = {
  maxFileSize: 500 * 1024 * 1024, // 500MB
  pdfMaxFileSize: 50 * 1024 * 1024, // 50MB
  videoMaxFileSize: 100 * 1024 * 1024, // 100MB
  enableSecurity: true,
};

// =====================
// File Viewer Utility Object
// =====================

export const fileViewerUtils = {
  // URL generation
  getApiBaseUrl,
  generateFileUrls,
  getFileUrl,
  getDownloadUrl,
  getThumbnailUrl,

  // File detection
  detectFileCategory,
  canPreviewFile,
  isImageFile,
  isPDFFile,
  isVideoFile,
  isEpsFile,

  // Size utilities
  formatFileSize,
  validateFileSize,
};
