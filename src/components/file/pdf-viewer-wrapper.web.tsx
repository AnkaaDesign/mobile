/**
 * PDF Viewer Wrapper - Web Version
 * Provides a fallback for web since react-native-pdf is native-only
 */

import React, { useEffect } from 'react';
import type { File as AnkaaFile } from '../../types';

export interface PDFViewerProps {
  file: AnkaaFile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: (file: AnkaaFile) => Promise<void>;
  onShare?: (file: AnkaaFile) => Promise<void>;
  baseUrl?: string;
}

export const PDFViewerWrapper: React.FC<PDFViewerProps> = ({
  file,
  open,
  onOpenChange,
  onDownload,
}) => {
  useEffect(() => {
    if (open) {
      // Close the modal immediately on web
      onOpenChange(false);

      // Trigger download if available
      if (onDownload) {
        onDownload(file);
      }
    }
  }, [open, file, onOpenChange, onDownload]);

  // Web doesn't render anything - PDFs should be opened in new tab or downloaded
  return null;
};

export default PDFViewerWrapper;
