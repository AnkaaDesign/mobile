/**
 * PDF Viewer Wrapper - 100% Safe for Expo Go
 * Only attempts to load native PDF viewer if NOT in Expo Go
 */

import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import type { File as _AnkaaFile } from '../../types';
import { PDFViewerProps } from './pdf-viewer';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Lazy load component reference
let PDFViewerComponent: React.ComponentType<PDFViewerProps> | null = null;
let loadAttempted = false;

export const PDFViewerWrapper: React.FC<PDFViewerProps> = (props) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Skip loading entirely in Expo Go
    if (isExpoGo) {
      console.log('[PDF Wrapper] Running in Expo Go - PDF viewer disabled');
      setIsReady(true);
      return;
    }

    // Only attempt to load once
    if (loadAttempted) {
      setIsReady(true);
      return;
    }

    loadAttempted = true;

    // Try to load the native PDF module (only in dev builds)
    const loadPDFViewer = async () => {
      try {
        const module = await import('./pdf-viewer');
        PDFViewerComponent = module.default;
        console.log('[PDF Wrapper] Native PDF viewer loaded successfully');
      } catch (error) {
        console.log('[PDF Wrapper] Native PDF viewer not available:', error);
        PDFViewerComponent = null;
      } finally {
        setIsReady(true);
      }
    };

    loadPDFViewer();
  }, []);

  // Don't render until we've checked availability
  if (!isReady) {
    return null;
  }

  // If modal is opening
  if (props.open) {
    // In Expo Go or no native viewer available - use fallback
    if (isExpoGo || !PDFViewerComponent) {
      // Close the modal immediately
      props.onOpenChange(false);

      // Show alert and share
      setTimeout(() => {
        Alert.alert(
          'Visualização de PDF',
          isExpoGo
            ? 'O visualizador de PDF não está disponível no Expo Go. Use um development build para visualizar PDFs dentro do app.\n\nAbrindo com aplicativo externo...'
            : 'O visualizador de PDF não está disponível. Abrindo com aplicativo externo...',
          [
            {
              text: 'OK',
              onPress: () => {
                if (props.onShare) {
                  props.onShare(props.file);
                }
              },
            },
          ]
        );
      }, 100);

      return null;
    }

    // Native viewer available - use it!
    return <PDFViewerComponent {...props} />;
  }

  return null;
};

export default PDFViewerWrapper;
