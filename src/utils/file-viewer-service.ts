/**
 * File Viewer Service for Mobile
 * Business logic layer for determining how to view files
 * Matches web implementation patterns
 */

import { Alert } from 'react-native';
import type { File as AnkaaFile } from '../types';
import {
  detectFileCategory,
  canPreviewFile,
  validateFileSize,
  DEFAULT_CONFIG,
  type FileViewerConfig,
  type FileCategory,
} from './file-viewer-utils';

// =====================
// Action Types
// =====================

export type FileViewAction =
  | { type: 'modal'; component: 'image' | 'pdf' | 'video'; file: AnkaaFile }
  | { type: 'share'; warning?: string }
  | { type: 'download'; warning?: string };

// =====================
// File Viewer Service
// =====================

export class FileViewerService {
  private config: FileViewerConfig;

  constructor(config: Partial<FileViewerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Determine what action to take when viewing a file
   * This is the core routing logic
   */
  determineFileViewAction(file: AnkaaFile): FileViewAction {
    const category = detectFileCategory(file);

    // Handle each category
    switch (category) {
      case 'images':
        return this.handleImageFile(file);

      case 'pdfs':
        return this.handlePDFFile(file);

      case 'videos':
        return this.handleVideoFile(file);

      case 'eps':
        return this.handleEPSFile(file);

      case 'documents':
      case 'archives':
        return { type: 'share' };

      default:
        return { type: 'download' };
    }
  }

  /**
   * Handle image files
   */
  private handleImageFile(file: AnkaaFile): FileViewAction {
    // Check file size
    if (!validateFileSize(file, this.config.maxFileSize! / (1024 * 1024))) {
      return {
        type: 'share',
        warning: 'Imagem muito grande. Abrindo com aplicativo externo.',
      };
    }

    return { type: 'modal', component: 'image', file };
  }

  /**
   * Handle PDF files
   */
  private handlePDFFile(file: AnkaaFile): FileViewAction {
    const maxPDFSizeMB = this.config.pdfMaxFileSize! / (1024 * 1024);

    // Check if PDF is too large for in-app viewing
    if (!validateFileSize(file, maxPDFSizeMB)) {
      return {
        type: 'share',
        warning: `PDF muito grande (${this.formatFileSize(file.size)}). Recomendamos abrir com aplicativo externo.`,
      };
    }

    return { type: 'modal', component: 'pdf', file };
  }

  /**
   * Handle video files
   */
  private handleVideoFile(file: AnkaaFile): FileViewAction {
    const maxVideoSizeMB = this.config.videoMaxFileSize! / (1024 * 1024);

    // Check if video is too large
    if (!validateFileSize(file, maxVideoSizeMB)) {
      return {
        type: 'share',
        warning: `Vídeo muito grande (${this.formatFileSize(file.size)}). Abrindo com aplicativo externo.`,
      };
    }

    return { type: 'modal', component: 'video', file };
  }

  /**
   * Handle EPS files
   */
  private handleEPSFile(file: AnkaaFile): FileViewAction {
    // EPS can only be previewed if it has a thumbnail
    if (file.thumbnailUrl) {
      return { type: 'modal', component: 'image', file };
    }

    // No thumbnail, must download or share
    return {
      type: 'share',
      warning: 'Arquivo EPS não possui visualização. Abrindo com aplicativo externo.',
    };
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  }

  /**
   * Validate file for security
   */
  validateFileSecurity(file: AnkaaFile): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (!this.config.enableSecurity) {
      return { isValid: true, warnings };
    }

    // Check file size
    const maxSizeMB = this.config.maxFileSize! / (1024 * 1024);
    if (!validateFileSize(file, maxSizeMB)) {
      warnings.push(`Arquivo excede o tamanho máximo permitido (${maxSizeMB} MB)`);
    }

    // Check for potentially dangerous extensions
    const dangerousExtensions = [
      'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs',
      'js', 'jse', 'wsf', 'wsh', 'msi', 'dll'
    ];

    const extension = file.filename?.split('.').pop()?.toLowerCase();
    if (extension && dangerousExtensions.includes(extension)) {
      warnings.push('Tipo de arquivo potencialmente perigoso');
    }

    // Check for suspicious MIME types
    const dangerousMimeTypes = [
      'application/x-msdownload',
      'application/x-msdos-program',
      'application/x-executable',
    ];

    if (dangerousMimeTypes.includes(file.mimetype?.toLowerCase() || '')) {
      warnings.push('Tipo MIME suspeito detectado');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Get user-friendly file type label
   */
  getFileTypeLabel(file: AnkaaFile): string {
    const category = detectFileCategory(file);

    const labels: Record<FileCategory, string> = {
      images: 'Imagem',
      pdfs: 'PDF',
      videos: 'Vídeo',
      audio: 'Áudio',
      documents: 'Documento',
      archives: 'Arquivo compactado',
      eps: 'EPS',
      other: 'Arquivo',
    };

    return labels[category] || labels.other;
  }

  /**
   * Check if file can be previewed
   */
  canPreviewFile(file: AnkaaFile): boolean {
    return canPreviewFile(file);
  }

  /**
   * Get recommended action for file
   */
  getRecommendedAction(file: AnkaaFile): string {
    const action = this.determineFileViewAction(file);

    switch (action.type) {
      case 'modal':
        return 'Visualizar';
      case 'share':
        return 'Abrir com...';
      case 'download':
        return 'Baixar';
      default:
        return 'Visualizar';
    }
  }
}

// =====================
// Service Instance
// =====================

export const fileViewerService = new FileViewerService();

// =====================
// Convenience Functions
// =====================

/**
 * Determine file view action
 */
export const determineFileViewAction = (file: AnkaaFile, config?: Partial<FileViewerConfig>): FileViewAction => {
  const service = config ? new FileViewerService(config) : fileViewerService;
  return service.determineFileViewAction(file);
};

/**
 * Validate file security
 */
export const validateFileSecurity = (file: AnkaaFile, config?: Partial<FileViewerConfig>) => {
  const service = config ? new FileViewerService(config) : fileViewerService;
  return service.validateFileSecurity(file);
};

/**
 * Get file type label
 */
export const getFileTypeLabel = (file: AnkaaFile): string => {
  return fileViewerService.getFileTypeLabel(file);
};

/**
 * Check if file can be previewed
 */
export const canPreview = (file: AnkaaFile): boolean => {
  return fileViewerService.canPreviewFile(file);
};

/**
 * Show warning alert if action has one
 */
export const showActionWarning = (action: FileViewAction): void => {
  if ('warning' in action && action.warning) {
    Alert.alert('Aviso', action.warning, [{ text: 'OK' }]);
  }
};
