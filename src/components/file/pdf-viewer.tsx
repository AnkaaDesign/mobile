/**
 * PDF Viewer Component for Mobile
 * Native PDF viewing with page navigation and controls
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconX, IconChevronLeft, IconChevronRight, IconDownload, IconShare } from '@tabler/icons-react-native';
import { useTheme } from '@/lib/theme';
import { useFileViewerOrientation } from '@/hooks/use-file-viewer-orientation';

// Conditionally import react-native-pdf (not supported in Expo Go)
let Pdf: any = null;
try {
  Pdf = require('react-native-pdf').default;
} catch (error) {
  console.warn('react-native-pdf not available in Expo Go');
}
import type { File as AnkaaFile } from '../../types';
import { getFileUrl } from '../../utils/file-viewer-utils';
// import { showToast } from '../ui/toast';

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
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pdfUrl = getFileUrl(file, baseUrl);

  // Enable orientation change when PDF viewer is open
  useFileViewerOrientation({ isOpen: open });

  // Auto-hide controls after 3 seconds
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    setControlsVisible(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  }, []);

  // Toggle controls visibility on tap
  const toggleControls = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    setControlsVisible(prev => {
      if (!prev) {
        // If showing controls, start the auto-hide timer
        controlsTimeoutRef.current = setTimeout(() => {
          setControlsVisible(false);
        }, 3000);
      }
      return !prev;
    });
  }, []);

  // Initialize controls timeout when modal opens
  useEffect(() => {
    if (open) {
      resetControlsTimeout();
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [open, resetControlsTimeout]);

  // Handle PDF load complete
  const handleLoadComplete = useCallback((numberOfPages: number) => {
    console.log('[PDF Viewer] Loaded successfully:', numberOfPages, 'pages');
    setTotalPages(numberOfPages);
    setLoading(false);
    setError(null);
  }, []);

  // Handle PDF load error
  const handleError = useCallback((error: object) => {
    console.error('[PDF Viewer] Load error:', error);
    setLoading(false);
    setError('Erro ao carregar PDF. Tente novamente ou baixe o arquivo.');
    Alert.alert('Erro', 'Erro ao carregar PDF');
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

  // Handle load progress
  const handleLoadProgress = useCallback((percent: number) => {
    console.log('[PDF Viewer] Loading progress:', percent);
    setLoadProgress(percent);
  }, []);

  // Close modal
  const handleClose = useCallback(() => {
    setCurrentPage(1);
    setTotalPages(0);
    setLoading(true);
    setLoadProgress(0);
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
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Header */}
        {controlsVisible && (
          <View style={[styles.header, { paddingTop: 12, backgroundColor: isDark ? '#000' : '#fff' }]}>
            <View style={styles.headerLeft}>
              <Pressable onPress={handleClose} style={styles.iconButton}>
                <IconX size={24} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={styles.headerCenter}>
              <Text style={[styles.filename, { color: colors.foreground }]} numberOfLines={1}>
                {file.filename}
              </Text>
              {totalPages > 0 && (
                <Text style={[styles.pageCounter, { color: colors.mutedForeground }]}>
                  Página {currentPage} de {totalPages}
                </Text>
              )}
            </View>

            <View style={styles.headerRight}>
              {onDownload && (
                <Pressable onPress={handleDownload} style={styles.iconButton}>
                  <IconDownload size={24} color={colors.foreground} />
                </Pressable>
              )}
              {onShare && (
                <Pressable onPress={handleShare} style={[styles.iconButton, styles.iconButtonLast]}>
                  <IconShare size={24} color={colors.foreground} />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* PDF View */}
        <View style={styles.pdfContainer}>
          {!Pdf ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Visualização de PDF Indisponível</Text>
              <Text style={styles.errorMessage}>
                A visualização de PDF não está disponível no Expo Go. Use um development build ou baixe o arquivo.
              </Text>
              <View style={styles.errorActions}>
                {onDownload && (
                  <Pressable
                    style={[styles.button, styles.buttonPrimary]}
                    onPress={handleDownload}
                  >
                    <Text style={styles.buttonTextPrimary}>Baixar PDF</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ) : error ? (
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
            <>
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
                // Zoom configuration - allow much greater zoom for detailed viewing
                minScale={0.5}
                maxScale={10}
                scale={1.0}
                // Android rendering quality improvements
                enableAntialiasing={true}
                // Fit width for better initial display and to fix Android blur
                fitPolicy={0}
                // Enable double-tap zoom gesture
                enableDoubleTapZoom={true}
                // Use PDF's native single tap to toggle controls (allows zoom gestures to work)
                onPageSingleTap={toggleControls}
                renderActivityIndicator={() => (
                  <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
                )}
                onLoadProgress={handleLoadProgress}
              />
              {/* NOTE: Removed tapOverlay - it was blocking PDF zoom gestures.
                  Using onPageSingleTap instead for controls toggle */}
            </>
          )}
        </View>

        {/* Footer Controls */}
        {controlsVisible && totalPages > 1 && !error && (
          <View style={[styles.footer, { paddingBottom: 12, backgroundColor: isDark ? '#000' : '#fff' }]}>
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
                  color={currentPage === 1 ? colors.mutedForeground : colors.foreground}
                />
                <Text
                  style={[
                    styles.navButtonText,
                    { color: currentPage === 1 ? colors.mutedForeground : colors.foreground },
                  ]}
                >
                  Anterior
                </Text>
              </Pressable>

              <Text style={[styles.pageInfo, { color: colors.foreground }]}>
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
                    { color: currentPage === totalPages ? colors.mutedForeground : colors.foreground },
                  ]}
                >
                  Próxima
                </Text>
                <IconChevronRight
                  size={24}
                  color={currentPage === totalPages ? colors.mutedForeground : colors.foreground}
                />
              </Pressable>
            </View>
          </View>
        )}

        {/* Loading Indicator with Progress Bar */}
        {loading && !error && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={styles.loadingText}>Carregando PDF...</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.round(loadProgress * 100)}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(loadProgress * 100)}%</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
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
    backgroundColor: '#000',
  },
  pdf: {
    flex: 1,
    backgroundColor: '#000',
  },
  loader: {
    marginTop: 100,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.3)',
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
  progressContainer: {
    alignItems: 'center',
    marginTop: 16,
    width: '80%',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066cc',
    borderRadius: 3,
  },
  progressText: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
  },
});

export default PDFViewer;
