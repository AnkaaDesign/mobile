/**
 * File Viewer Provider for Mobile
 * Complete file viewing system matching web implementation
 * Now supports: Images, PDFs, Videos, and more
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { File as AnkaaFile } from '../../types';
// Toast removed - using Alert for user feedback

// Import utilities and service
import {
  getDownloadUrl,
  isImageFile,
} from '../../utils/file-viewer-utils';
import {
  determineFileViewAction,
  showActionWarning,
} from '../../utils/file-viewer-service';

// Import viewer components
import { FilePreviewModal } from './file-preview-modal';
import PDFViewerWrapper from './pdf-viewer-wrapper';
import VideoPlayerWrapper from './video-player-wrapper';

// =====================
// Type Definitions
// =====================

export interface FileViewerState {
  // Image preview
  isImageModalOpen: boolean;
  // PDF preview
  isPdfModalOpen: boolean;
  // Video preview
  isVideoModalOpen: boolean;
  // Shared state
  currentFiles: AnkaaFile[];
  currentFileIndex: number;
}

export interface FileViewerActions {
  // Image modal
  openImageModal: (files: AnkaaFile[], initialIndex?: number) => void;
  closeImageModal: () => void;
  // PDF modal
  openPdfModal: (file: AnkaaFile) => void;
  closePdfModal: () => void;
  // Video modal
  openVideoModal: (file: AnkaaFile) => void;
  closeVideoModal: () => void;
  // Generic file viewing
  viewFile: (file: AnkaaFile) => void;
  viewFiles: (files: AnkaaFile[], initialIndex: number) => void;
  // File operations
  downloadFile: (file: AnkaaFile) => Promise<void>;
  shareFile: (file: AnkaaFile) => Promise<void>;
  openFile: (file: AnkaaFile) => Promise<void>;
}

export interface FileViewerContextValue {
  state: FileViewerState;
  actions: FileViewerActions;
}

// =====================
// Context
// =====================

const FileViewerContext = createContext<FileViewerContextValue | null>(null);

export interface FileViewerProviderProps {
  children: React.ReactNode;
  baseUrl?: string;
}

// =====================
// Provider Component
// =====================

export const FileViewerProvider: React.FC<FileViewerProviderProps> = ({
  children,
  baseUrl,
}) => {
  const [state, setState] = useState<FileViewerState>({
    isImageModalOpen: false,
    isPdfModalOpen: false,
    isVideoModalOpen: false,
    currentFiles: [],
    currentFileIndex: 0,
  });

  // =====================
  // Image Modal Actions
  // =====================

  const openImageModal = useCallback((files: AnkaaFile[], initialIndex: number = 0) => {
    console.log('[File Viewer] Opening image modal:', files.length, 'files');
    setState(prev => ({
      ...prev,
      isImageModalOpen: true,
      currentFiles: files,
      currentFileIndex: initialIndex,
    }));
  }, []);

  const closeImageModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isImageModalOpen: false,
    }));

    // Clear files after animation
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentFiles: [],
        currentFileIndex: 0,
      }));
    }, 300);
  }, []);

  // =====================
  // PDF Modal Actions
  // =====================

  const openPdfModal = useCallback((file: AnkaaFile) => {
    console.log('[File Viewer] Opening PDF modal:', file.filename);
    setState(prev => ({
      ...prev,
      isPdfModalOpen: true,
      currentFiles: [file],
      currentFileIndex: 0,
    }));
  }, []);

  const closePdfModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPdfModalOpen: false,
    }));

    // Clear files after animation
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentFiles: [],
        currentFileIndex: 0,
      }));
    }, 300);
  }, []);

  // =====================
  // Video Modal Actions
  // =====================

  const openVideoModal = useCallback((file: AnkaaFile) => {
    console.log('[File Viewer] Opening video modal:', file.filename);
    setState(prev => ({
      ...prev,
      isVideoModalOpen: true,
      currentFiles: [file],
      currentFileIndex: 0,
    }));
  }, []);

  const closeVideoModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVideoModalOpen: false,
    }));

    // Clear files after animation
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentFiles: [],
        currentFileIndex: 0,
      }));
    }, 300);
  }, []);

  // =====================
  // File Operations
  // =====================

  const downloadFile = useCallback(async (file: AnkaaFile) => {
    try {
      const downloadUrl = getDownloadUrl(file, baseUrl);
      const fileUri = FileSystem.documentDirectory + file.filename;

      const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri);

      if (downloadResult.status === 200) {
        Alert.alert('Sucesso', 'Arquivo baixado com sucesso!');
        return;
      } else {
        throw new Error('Download falhou');
      }
    } catch (error) {
      console.error('[File Viewer] Download error:', error);
      Alert.alert('Erro', 'Erro ao baixar arquivo');
      throw error;
    }
  }, [baseUrl]);

  const shareFile = useCallback(async (file: AnkaaFile) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert(
          'Compartilhamento não disponível',
          'Seu dispositivo não suporta compartilhamento de arquivos.'
        );
        return;
      }

      // Download to cache first
      const downloadUrl = getDownloadUrl(file, baseUrl);
      const fileUri = FileSystem.cacheDirectory + file.filename;
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri);

      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: file.mimetype,
          dialogTitle: 'Compartilhar arquivo',
          UTI: file.mimetype,
        });
      } else {
        throw new Error('Download falhou');
      }
    } catch (error) {
      console.error('[File Viewer] Share error:', error);
      Alert.alert('Erro', 'Erro ao compartilhar arquivo');
    }
  }, [baseUrl]);

  const openFile = useCallback(async (file: AnkaaFile) => {
    try {
      // For Android and iOS, share sheet allows opening with external apps
      await shareFile(file);
    } catch (error) {
      console.error('[File Viewer] Open file error:', error);
      Alert.alert('Erro', 'Erro ao abrir arquivo');
    }
  }, [shareFile]);

  // =====================
  // Smart File Viewing (Main Entry Point)
  // =====================

  const viewFile = useCallback((file: AnkaaFile) => {
    console.log('[File Viewer] View file:', file.filename, file.mimetype);

    // Determine what action to take using the service layer
    const action = determineFileViewAction(file);

    console.log('[File Viewer] Action determined:', action.type);

    // Show warning if present
    showActionWarning(action);

    // Execute action
    switch (action.type) {
      case 'modal':
        if (action.component === 'image') {
          openImageModal([file], 0);
        } else if (action.component === 'pdf') {
          openPdfModal(file);
        } else if (action.component === 'video') {
          openVideoModal(file);
        }
        break;

      case 'share':
        shareFile(file);
        break;

      case 'download':
        downloadFile(file);
        break;

      default:
        console.warn('[File Viewer] Unknown action type:', (action as any).type);
        shareFile(file);
    }
  }, [openImageModal, openPdfModal, openVideoModal, shareFile, downloadFile]);

  const viewFiles = useCallback((files: AnkaaFile[], initialIndex: number) => {
    console.log('[File Viewer] View files:', files.length, 'initial index:', initialIndex);

    // Import canPreviewFile to check which files are previewable
    const canPreviewFile = (file: AnkaaFile): boolean => {
      // Check if image
      if (isImageFile(file)) return true;

      // Check if PDF
      const pdfMimeTypes = ['application/pdf'];
      const isPdf = pdfMimeTypes.includes(file.mimetype?.toLowerCase() || '') ||
                    file.filename?.toLowerCase().endsWith('.pdf');
      if (isPdf) return true;

      // Check if video
      const isVideo = file.mimetype?.toLowerCase().startsWith('video/') ||
                      ['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv', 'm4v'].some(ext =>
                        file.filename?.toLowerCase().endsWith(`.${ext}`)
                      );
      if (isVideo) return true;

      // Check if EPS with thumbnail
      const epsMimeTypes = ['application/postscript', 'application/x-eps', 'application/eps', 'image/eps', 'image/x-eps'];
      const isEps = epsMimeTypes.includes(file.mimetype?.toLowerCase() || '');
      if (isEps && file.thumbnailUrl) return true;

      return false;
    };

    // Filter to previewable files (images, PDFs, videos, EPS with thumbnails)
    const previewableFiles = files.filter(f => canPreviewFile(f));

    if (previewableFiles.length === 0) {
      // No previewable files, try to view the target file individually (will open share sheet)
      if (files[initialIndex]) {
        viewFile(files[initialIndex]);
      }
      return;
    }

    // Find the index of the initial file in the filtered array
    const targetFile = files[initialIndex];
    const adjustedIndex = previewableFiles.findIndex(f => f.id === targetFile?.id);
    const finalIndex = adjustedIndex >= 0 ? adjustedIndex : 0;

    // Open the unified image modal (which now handles PDFs and videos too)
    openImageModal(previewableFiles, finalIndex);
  }, [viewFile, openImageModal]);

  // =====================
  // Memoized Context Value
  // =====================

  const actions = useMemo<FileViewerActions>(() => ({
    openImageModal,
    closeImageModal,
    openPdfModal,
    closePdfModal,
    openVideoModal,
    closeVideoModal,
    viewFile,
    viewFiles,
    downloadFile,
    shareFile,
    openFile,
  }), [
    openImageModal,
    closeImageModal,
    openPdfModal,
    closePdfModal,
    openVideoModal,
    closeVideoModal,
    viewFile,
    viewFiles,
    downloadFile,
    shareFile,
    openFile,
  ]);

  const contextValue = useMemo<FileViewerContextValue>(() => ({
    state,
    actions,
  }), [state, actions]);

  // Get current file for modals
  const currentFile = state.currentFiles[state.currentFileIndex];

  // =====================
  // Render
  // =====================

  return (
    <FileViewerContext.Provider value={contextValue}>
      {children}

      {/* Image Preview Modal */}
      <FilePreviewModal
        files={state.currentFiles}
        initialFileIndex={state.currentFileIndex}
        visible={state.isImageModalOpen}
        onClose={closeImageModal}
        baseUrl={baseUrl}
        enableSwipeNavigation={true}
        enablePinchZoom={true}
        enableRotation={true}
        showThumbnailStrip={state.currentFiles.length > 1}
        showImageCounter={true}
      />

      {/* PDF Viewer Modal */}
      {currentFile && (
        <PDFViewerWrapper
          file={currentFile}
          open={state.isPdfModalOpen}
          onOpenChange={closePdfModal}
          onDownload={downloadFile}
          onShare={shareFile}
          baseUrl={baseUrl}
        />
      )}

      {/* Video Player Modal */}
      {currentFile && (
        <VideoPlayerWrapper
          file={currentFile}
          open={state.isVideoModalOpen}
          onOpenChange={closeVideoModal}
          onDownload={downloadFile}
          onShare={shareFile}
          baseUrl={baseUrl}
        />
      )}
    </FileViewerContext.Provider>
  );
};

// =====================
// Hook
// =====================

/**
 * Hook to use the file viewer context
 */
export const useFileViewer = (): FileViewerContextValue => {
  const context = useContext(FileViewerContext);
  if (!context) {
    throw new Error('useFileViewer must be used within a FileViewerProvider');
  }
  return context;
};

// =====================
// Exports
// =====================

export default FileViewerProvider;

// Re-export utilities for convenience
export {
  getApiBaseUrl,
  getFileUrl,
  getDownloadUrl,
  isImageFile,
  isPDFFile,
  isVideoFile,
  isEpsFile,
} from '../../utils/file-viewer-utils';

export {
  determineFileViewAction,
  getFileTypeLabel,
  canPreview,
} from '../../utils/file-viewer-service';
