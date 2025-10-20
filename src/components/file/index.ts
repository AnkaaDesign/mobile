// File components for mobile
export { FileViewerProvider, useFileViewer } from "./file-viewer";
export type { FileViewerState, FileViewerContextValue, FileViewerActions } from "./file-viewer";

export { FilePreviewModal } from "./file-preview-modal";
export type { FilePreviewModalProps } from "./file-preview-modal";

// Export wrappers instead of direct components for Expo Go compatibility
export { default as PDFViewer } from "./pdf-viewer-wrapper";
export type { PDFViewerProps } from "./pdf-viewer";

export { default as VideoPlayer } from "./video-player-wrapper";
export type { VideoPlayerProps } from "./video-player";

export { FileItem } from "./file-item";
export type { FileItemProps, FileViewMode } from "./file-item";

export { useFilePreview, filePreviewUtils } from "../../hooks/use-file-preview";
export type { UseFilePreviewOptions, UseFilePreviewReturn } from "../../hooks/use-file-preview";

// Export utilities
export * from "../../utils/file-viewer-utils";
export * from "../../utils/file-viewer-service";
