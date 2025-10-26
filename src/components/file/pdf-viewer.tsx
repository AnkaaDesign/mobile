/**
 * PDF Viewer Component for Mobile
 * Native PDF viewing with page navigation and controls
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Modal,
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { IconX, IconChevronLeft, IconChevronRight, IconDownload, IconShare } from '@tabler/icons-react-native';
import type { File as AnkaaFile } from '../../types';
import { getFileUrl } from '../../utils/file-viewer-utils';
import { showToast } from '../ui/toast';

export interface PDFViewerProps {
  file: AnkaaFile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: (file: AnkaaFile) => Promise<void>;
  onShare?: (file: AnkaaFile) => Promise<void>;
  baseUrl?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  open,
  onOpenChange,
  onDownload,
  onShare,
  baseUrl,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);

  const pdfUrl = getFileUrl(file, baseUrl);

  // Handle PDF load complete
  const handleLoadComplete = useCallback((numberOfPages: number) => {
    console.log('[PDF Viewer] Loaded successfully:', numberOfPages, 'pages');
    setTotalPages(numberOfPages);
    setLoading(false);
    setError(null);
  }, []);

  // Handle PDF load error
  const handleError = useCallback((error: Error) => {
    console.error('[PDF Viewer] Load error:', error);
    setLoading(false);
    setError('Erro ao carregar PDF. Tente novamente ou baixe o arquivo.');
    showToast({
      message: 'Erro ao carregar PDF',
      type: 'error',
    });
  }, []);

  // Handle page change
  const handlePageChanged = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle download
  const handleDownload = useCallback(async () => {
    if (onDownload) {
      try {
        await onDownload(file);
      } catch (err) {
        console.error('[PDF Viewer] Download error:', err);
      }
    }
  }, [file, onDownload]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (onShare) {
      try {
        await onShare(file);
      } catch (err) {
        console.error('[PDF Viewer] Share error:', err);
      }
    }
  }, [file, onShare]);

  // Toggle controls visibility
  const handlePress = useCallback(() => {
    setControlsVisible(prev => !prev);
  }, []);

  // Close modal
  const handleClose = useCallback(() => {
    setCurrentPage(1);
    setTotalPages(0);
    setLoading(true);
    setError(null);
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Modal
      visible={open}
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Header */}
        {controlsVisible && (
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable onPress={handleClose} style={styles.iconButton}>
                <IconX size={24} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.headerCenter}>
              <Text style={styles.filename} numberOfLines={1}>
                {file.filename}
              </Text>
              {totalPages > 0 && (
                <Text style={styles.pageCounter}>
                  Página {currentPage} de {totalPages}
                </Text>
              )}
            </View>

            <View style={styles.headerRight}>
              {onDownload && (
                <Pressable onPress={handleDownload} style={styles.iconButton}>
                  <IconDownload size={24} color="#fff" />
                </Pressable>
              )}
              {onShare && (
                <Pressable onPress={handleShare} style={[styles.iconButton, styles.iconButtonLast]}>
                  <IconShare size={24} color="#fff" />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* PDF View */}
        <View style={styles.pdfContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Erro ao Carregar PDF</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <View style={styles.errorActions}>
                <Pressable
                  style={[styles.button, styles.buttonOutline]}
                  onPress={() => {
                    setError(null);
                    setLoading(true);
                  }}
                >
                  <Text style={styles.buttonTextOutline}>Tentar Novamente</Text>
                </Pressable>
                {onDownload && (
                  <Pressable
                    style={[styles.button, styles.buttonPrimary]}
                    onPress={handleDownload}
                  >
                    <Text style={styles.buttonTextPrimary}>Baixar</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ) : (
            <Pdf
              source={{
                uri: pdfUrl,
                cache: true,
              }}
              trustAllCerts={false}
              onLoadComplete={handleLoadComplete}
              onPageChanged={handlePageChanged}
              onError={handleError}
              onPressLink={(uri) => {
                console.log('[PDF Viewer] Link pressed:', uri);
              }}
              style={styles.pdf}
              enablePaging={true}
              horizontal={false}
              spacing={10}
              renderActivityIndicator={() => (
                <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
              )}
              onLoadProgress={(percent) => {
                console.log('[PDF Viewer] Loading progress:', percent);
              }}
            />
          )}
        </View>

        {/* Footer Controls */}
        {controlsVisible && totalPages > 1 && !error && (
          <View style={styles.footer}>
            <View style={styles.navigationControls}>
              <Pressable
                onPress={() => {
                  if (currentPage > 1) {
                    // PDF component handles page change
                  }
                }}
                disabled={currentPage === 1}
                style={[
                  styles.navButton,
                  currentPage === 1 && styles.navButtonDisabled,
                ]}
              >
                <IconChevronLeft
                  size={24}
                  color={currentPage === 1 ? '#666' : '#fff'}
                />
                <Text
                  style={[
                    styles.navButtonText,
                    currentPage === 1 && styles.navButtonTextDisabled,
                  ]}
                >
                  Anterior
                </Text>
              </Pressable>

              <Text style={styles.pageInfo}>
                {currentPage} / {totalPages}
              </Text>

              <Pressable
                onPress={() => {
                  if (currentPage < totalPages) {
                    // PDF component handles page change
                  }
                }}
                disabled={currentPage === totalPages}
                style={[
                  styles.navButton,
                  currentPage === totalPages && styles.navButtonDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.navButtonText,
                    currentPage === totalPages && styles.navButtonTextDisabled,
                  ]}
                >
                  Próxima
                </Text>
                <IconChevronRight
                  size={24}
                  color={currentPage === totalPages ? '#666' : '#fff'}
                />
              </Pressable>
            </View>
          </View>
        )}

        {/* Loading Indicator */}
        {loading && !error && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={styles.loadingText}>Carregando PDF...</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flex: 0,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerRight: {
    flex: 0,
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  iconButtonLast: {
    marginLeft: 8,
  },
  filename: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  pageCounter: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  pdf: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loader: {
    marginTop: 100,
  },
  footer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButtonDisabled: {
    backgroundColor: 'transparent',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 4,
  },
  navButtonTextDisabled: {
    color: '#666',
  },
  pageInfo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#0066cc',
    backgroundColor: 'transparent',
  },
  buttonPrimary: {
    backgroundColor: '#0066cc',
  },
  buttonTextOutline: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonTextPrimary: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
  },
});

export default PDFViewer;
