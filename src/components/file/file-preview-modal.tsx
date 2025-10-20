import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { PanGestureHandler, PinchGestureHandler, State } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS, interpolate, Extrapolate } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  IconX,
  IconDownload,
  IconExternalLink,
  IconVectorBezier,
  IconRotateClockwise,
  IconRotate2,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { File as AnkaaFile } from '../../types';
import { isImageFile, formatFileSize, getFileExtension } from '../../utils';
import * as FileSystem from "expo-file-system/legacy";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const SWIPE_THRESHOLD = 50;

// EPS file detection
const isEpsFile = (file: AnkaaFile): boolean => {
  const epsMimeTypes = ["application/postscript", "application/x-eps", "application/eps", "image/eps", "image/x-eps"];
  return epsMimeTypes.includes(file.mimetype.toLowerCase());
};

// Check if file can be previewed
const isPreviewableFile = (file: AnkaaFile): boolean => {
  return isImageFile(file) || (isEpsFile(file) && !!file.thumbnailUrl);
};

export interface FilePreviewModalProps {
  files: AnkaaFile[];
  initialFileIndex?: number;
  visible: boolean;
  onClose: () => void;
  baseUrl?: string;
  enableSwipeNavigation?: boolean;
  enablePinchZoom?: boolean;
  enableRotation?: boolean;
  showThumbnailStrip?: boolean;
  showImageCounter?: boolean;
}

export function FilePreviewModal({
  files,
  initialFileIndex = 0,
  visible,
  onClose,
  baseUrl = "",
  enableSwipeNavigation = true,
  enablePinchZoom = true,
  enableRotation = true,
  showThumbnailStrip = true,
  showImageCounter = true,
}: FilePreviewModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Constants for padding calculations
  const HEADER_BASE_PADDING = 16;
  const FOOTER_BASE_PADDING = 16;
  const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : 24;

  // State-based padding that recalculates when modal opens
  const [safeTopPadding, setSafeTopPadding] = useState(STATUSBAR_HEIGHT + HEADER_BASE_PADDING);
  const [safeBottomPadding, setSafeBottomPadding] = useState(FOOTER_BASE_PADDING);

  // Recalculate safe padding when modal becomes visible or insets change
  useEffect(() => {
    if (visible) {
      // Small delay to ensure SafeArea context is fully initialized
      const timer = setTimeout(() => {
        const topPadding = Math.max(insets.top || STATUSBAR_HEIGHT, STATUSBAR_HEIGHT) + HEADER_BASE_PADDING;
        const bottomPadding = Math.max(insets.bottom || 0, 0) + FOOTER_BASE_PADDING;

        setSafeTopPadding(topPadding);
        setSafeBottomPadding(bottomPadding);

        console.log('📐 [FilePreviewModal] SafeArea Recalculated:', {
          insetsTop: insets.top,
          insetsBottom: insets.bottom,
          calculatedTopPadding: topPadding,
          calculatedBottomPadding: bottomPadding,
          platform: Platform.OS,
          timestamp: new Date().toISOString()
        });
      }, 100); // 100ms delay to ensure context is ready

      return () => clearTimeout(timer);
    }
  }, [visible, insets.top, insets.bottom]);

  // State management
  const [currentIndex, setCurrentIndex] = useState(initialFileIndex);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isControlsVisible, setIsControlsVisible] = useState(true);

  // Animated values
  const scale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const baseTranslateX = useSharedValue(0);
  const baseTranslateY = useSharedValue(0);
  const swipeTranslateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Refs
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter previewable files
  const previewableFiles = React.useMemo(() => files.map((file, index) => ({ file, originalIndex: index })).filter(({ file }) => isPreviewableFile(file)), [files]);

  const currentFile = files[currentIndex];
  const isCurrentFilePreviewable = currentFile && isPreviewableFile(currentFile);

  // Find current image index within previewable files
  const currentImageIndex = React.useMemo(() => {
    if (!isCurrentFilePreviewable) return -1;
    return previewableFiles.findIndex(({ originalIndex }) => originalIndex === currentIndex);
  }, [currentIndex, previewableFiles, isCurrentFilePreviewable]);

  const totalImages = previewableFiles.length;

  // Reset states when file changes
  useEffect(() => {
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    baseTranslateX.value = 0;
    baseTranslateY.value = 0;
    focalX.value = 0;
    focalY.value = 0;
    swipeTranslateX.value = 0;
    setRotation(0);
    setImageLoading(true);
    setImageError(false);
  }, [currentIndex]);

  // Initialize current index
  useEffect(() => {
    setCurrentIndex(initialFileIndex);
  }, [initialFileIndex]);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    setIsControlsVisible(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setIsControlsVisible(false);
    }, 3000);
  }, []);

  // Show controls on interaction
  const showControls = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  useEffect(() => {
    if (visible) {
      resetControlsTimeout();
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [visible, resetControlsTimeout]);

  // Navigation functions
  const handlePrevious = useCallback(() => {
    if (!isCurrentFilePreviewable || totalImages <= 1) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const prevImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : totalImages - 1;
    setCurrentIndex(previewableFiles[prevImageIndex].originalIndex);
    showControls();
  }, [isCurrentFilePreviewable, currentImageIndex, totalImages, previewableFiles, showControls]);

  const handleNext = useCallback(() => {
    if (!isCurrentFilePreviewable || totalImages <= 1) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextImageIndex = currentImageIndex < totalImages - 1 ? currentImageIndex + 1 : 0;
    setCurrentIndex(previewableFiles[nextImageIndex].originalIndex);
    showControls();
  }, [isCurrentFilePreviewable, currentImageIndex, totalImages, previewableFiles, showControls]);

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(scale.value * 1.5, MAX_ZOOM);
    scale.value = withSpring(newScale);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showControls();
  }, [showControls]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(scale.value / 1.5, MIN_ZOOM);
    scale.value = withSpring(newScale);

    // Reset position if zoomed out enough
    if (newScale <= 1) {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showControls();
  }, [showControls]);

  const handleResetZoom = useCallback(() => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    focalX.value = 0;
    focalY.value = 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showControls();
  }, [showControls]);

  // Rotation functions
  const handleRotateRight = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showControls();
  }, [showControls]);

  const handleRotateLeft = useCallback(() => {
    setRotation((prev) => (prev - 90 + 360) % 360);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showControls();
  }, [showControls]);

  // Download/Share/Open functions
  const handleDownload = useCallback(async () => {
    if (!currentFile) return;

    try {
      showControls();

      const fileUrl = getFileUrl(currentFile, baseUrl);
      const fileUri = FileSystem.documentDirectory + currentFile.filename;

      Alert.alert("Baixando arquivo...", "Aguarde enquanto o arquivo é baixado.");

      // Download file
      const { uri } = await FileSystem.downloadAsync(fileUrl, fileUri);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Alert.alert("Sucesso", "Arquivo salvo com sucesso!");
    } catch (error) {
      console.error("Error downloading file:", error);
      Alert.alert("Erro", "Não foi possível baixar o arquivo.");
    }
  }, [currentFile, baseUrl, showControls]);

  const handleShare = useCallback(async () => {
    if (!currentFile) return;

    try {
      showControls();

      const Sharing = await import("expo-sharing");
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert("Compartilhamento não disponível", "Seu dispositivo não suporta compartilhamento de arquivos.");
        return;
      }

      const fileUrl = getFileUrl(currentFile, baseUrl);
      const fileUri = FileSystem.cacheDirectory + currentFile.filename;

      // Download to cache
      const { uri } = await FileSystem.downloadAsync(fileUrl, fileUri);

      // Share file - on iOS this opens share sheet, on Android opens with appropriate app
      await Sharing.shareAsync(uri, {
        mimeType: currentFile.mimetype,
        dialogTitle: "Abrir com...",
        UTI: currentFile.mimetype,
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("Error sharing/opening file:", error);
      Alert.alert("Erro", "Não foi possível abrir o arquivo.");
    }
  }, [currentFile, baseUrl, showControls]);

  // Open file with appropriate viewer (uses share sheet which allows opening)
  const handleOpenFile = useCallback(async () => {
    await handleShare(); // Share sheet allows opening with appropriate apps
  }, [handleShare]);

  // Pinch gesture handler - improved for smoother scaling
  const pinchGestureHandler = (event: any) => {
    'worklet';
    if (event.nativeEvent.state === State.BEGAN) {
      focalX.value = event.nativeEvent.focalX;
      focalY.value = event.nativeEvent.focalY;
    } else if (event.nativeEvent.state === State.ACTIVE) {
      if (!enablePinchZoom) return;

      // Clamp scale value for smooth zooming
      const newScale = Math.max(MIN_ZOOM, Math.min(event.nativeEvent.scale, MAX_ZOOM));
      scale.value = newScale; // Direct assignment for responsive feel

      // Handle focal point for zoom center
      if (event.nativeEvent.scale > 1) {
        const focal = {
          x: event.nativeEvent.focalX - SCREEN_WIDTH / 2,
          y: event.nativeEvent.focalY - SCREEN_HEIGHT / 2,
        };

        translateX.value = focal.x * (1 - 1 / event.nativeEvent.scale);
        translateY.value = focal.y * (1 - 1 / event.nativeEvent.scale);
      }
    } else if (event.nativeEvent.state === State.END) {
      // Snap to boundaries with smooth spring animation
      if (scale.value < 1) {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      } else if (scale.value > MAX_ZOOM) {
        scale.value = withSpring(MAX_ZOOM, { damping: 15, stiffness: 150 });
      }

      runOnJS(showControls)();
    }
  };

  // Pan gesture handler for zoomed images - improved for smoothness
  const panGestureHandler = (event: any) => {
    'worklet';
    if (event.nativeEvent.state === State.BEGAN) {
      // Store current position as base for this gesture
      baseTranslateX.value = translateX.value;
      baseTranslateY.value = translateY.value;
      runOnJS(showControls)();
    } else if (event.nativeEvent.state === State.ACTIVE) {
      if (scale.value > 1) {
        // Pan when zoomed - add delta to base for smooth continuous panning
        translateX.value = baseTranslateX.value + event.nativeEvent.translationX;
        translateY.value = baseTranslateY.value + event.nativeEvent.translationY;
      } else if (enableSwipeNavigation) {
        // Swipe for navigation
        swipeTranslateX.value = event.nativeEvent.translationX;
        opacity.value = interpolate(Math.abs(event.nativeEvent.translationX), [0, SCREEN_WIDTH / 3], [1, 0.7], Extrapolate.CLAMP);
      }
    } else if (event.nativeEvent.state === State.END) {
      if (scale.value > 1) {
        // Boundary check for panning with smooth spring animation
        const maxTranslateX = (SCREEN_WIDTH * scale.value - SCREEN_WIDTH) / 2;
        const maxTranslateY = (SCREEN_HEIGHT * scale.value - SCREEN_HEIGHT) / 2;

        const clampedX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX.value));
        const clampedY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY.value));

        translateX.value = withSpring(clampedX, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(clampedY, { damping: 15, stiffness: 150 });

        // Update base values for next gesture
        baseTranslateX.value = clampedX;
        baseTranslateY.value = clampedY;
      } else if (enableSwipeNavigation) {
        // Handle swipe navigation
        const shouldNavigate = Math.abs(event.nativeEvent.translationX) > SWIPE_THRESHOLD;

        if (shouldNavigate) {
          if (event.nativeEvent.translationX > 0) {
            runOnJS(handlePrevious)();
          } else {
            runOnJS(handleNext)();
          }
        }

        // Reset swipe state with smooth animation
        swipeTranslateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        opacity.value = withSpring(1, { damping: 15, stiffness: 150 });
      }
    }
  };

  // Animated styles (pinch/pan zoom only, no rotation)
  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value + swipeTranslateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    } as any;
  });

  const animatedControlsStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isControlsVisible ? 1 : 0, { duration: 300 }),
    };
  });

  // Image load handlers
  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  if (!currentFile) return null;

  const isPDF = getFileExtension(currentFile.filename).toLowerCase() === "pdf";
  const isEPS = isEpsFile(currentFile);

  // Helper function to get proper file URL
  const getFileUrl = (file: AnkaaFile): string => {
    const apiUrl = baseUrl || (global as any).__ANKAA_API_URL__ || "http://localhost:3030";

    // Check if file has a URL property that might contain localhost
    if (file.url && file.url.startsWith('http')) {
      const urlObj = new URL(file.url);
      const correctedUrl = `${apiUrl}${urlObj.pathname}${urlObj.search}`;
      console.log('🔍 [FilePreviewModal] Corrected file URL:', {
        original: file.url,
        corrected: correctedUrl
      });
      return correctedUrl;
    }

    const url = `${apiUrl}/files/serve/${file.id}`;
    console.log('🔍 [FilePreviewModal] getFileUrl:', {
      filename: file.filename,
      fileId: file.id,
      baseUrl,
      globalUrl: (global as any).__ANKAA_API_URL__,
      finalUrl: url
    });
    return url;
  };

  // Helper function to get thumbnail URL
  const getFileThumbnailUrl = (file: AnkaaFile, size: "small" | "medium" | "large" = "medium"): string => {
    const apiUrl = baseUrl || (global as any).__ANKAA_API_URL__ || "http://localhost:3030";

    console.log('🔍 [getFileThumbnailUrl] Called with:', {
      filename: file.filename,
      baseUrl,
      apiUrl,
      fileThumbnailUrl: file.thumbnailUrl,
      requestedSize: size
    });

    // If file has thumbnailUrl, use it
    if (file.thumbnailUrl) {
      // If already absolute URL, replace localhost with correct API URL and ensure size parameter
      if (file.thumbnailUrl.startsWith('http')) {
        // Extract the path from the URL
        const urlObj = new URL(file.thumbnailUrl);
        // Always add or update the size parameter
        const correctedUrl = `${apiUrl}${urlObj.pathname}?size=${size}`;
        console.log('🔍 [FilePreviewModal] Corrected thumbnailUrl with size:', {
          original: file.thumbnailUrl,
          corrected: correctedUrl,
          size: size
        });
        return correctedUrl;
      }
      // Otherwise construct URL
      const url = `${apiUrl}/files/thumbnail/${file.id}?size=${size}`;
      console.log('🔍 [FilePreviewModal] Constructed thumbnail URL:', url);
      return url;
    }

    // For images, use the serve endpoint
    if (isImageFile(file)) {
      const url = `${apiUrl}/files/serve/${file.id}`;
      console.log('🔍 [FilePreviewModal] Using serve URL for image:', url);
      return url;
    }

    console.log('⚠️ [FilePreviewModal] No URL generated for file:', file.filename);
    return "";
  };

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.container}>
        {/* Background */}
        <View style={StyleSheet.flatten([StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.95)' }])} />

        {/* Main Content */}
        <View style={styles.content}>
          {/* Header */}
          <Animated.View style={StyleSheet.flatten([
            styles.header,
            animatedControlsStyle,
            { paddingTop: safeTopPadding }
          ])}>
            <View style={styles.headerLeft}>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {currentFile.filename}
                </Text>
                <Text style={styles.fileSize}>{formatFileSize(currentFile.size)}</Text>
                {isCurrentFilePreviewable && totalImages > 1 && showImageCounter && (
                  <Badge style={styles.imageCounter} textStyle={styles.imageCounterText}>
                    {`${currentImageIndex + 1} de ${totalImages}`}
                  </Badge>
                )}
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton} onPress={onClose} activeOpacity={0.7}>
                <IconX size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Image Container */}
          <View style={styles.imageContainer}>
            {isCurrentFilePreviewable ? (
              <>
                <PinchGestureHandler onHandlerStateChange={pinchGestureHandler}>
                  <Animated.View style={styles.imageWrapper}>
                    <PanGestureHandler onHandlerStateChange={panGestureHandler}>
                      <Animated.View style={styles.imageWrapper}>
                        <TouchableOpacity activeOpacity={1} onPress={showControls} style={styles.imageWrapper}>
                          <Animated.View style={animatedImageStyle}>
                            <Image
                              key={`main-image-${currentFile.id}-${currentIndex}`}
                              source={{
                                uri: (() => {
                                  const url = isEPS && currentFile.thumbnailUrl
                                    ? getFileThumbnailUrl(currentFile, "large")
                                    : getFileUrl(currentFile);
                                  console.log('🖼️ [MainImage] About to load:', {
                                    filename: currentFile.filename,
                                    isEPS,
                                    hasThumbnailUrl: !!currentFile.thumbnailUrl,
                                    finalUrl: url,
                                    imageLoading,
                                    imageError
                                  });
                                  return url;
                                })(),
                                cache: 'reload'
                              }}
                              style={styles.image}
                              resizeMode="contain"
                              onLoadStart={() => {
                                console.log('⏳ [MainImage] Load started:', currentFile.filename);
                              }}
                              onLoad={() => {
                                console.log('✅ [MainImage] Loaded successfully:', currentFile.filename);
                                handleImageLoad();
                              }}
                              onError={(error) => {
                                console.error('❌ [MainImage] Failed to load:', {
                                  filename: currentFile.filename,
                                  url: isEPS && currentFile.thumbnailUrl
                                    ? getFileThumbnailUrl(currentFile, "large")
                                    : getFileUrl(currentFile),
                                  error: error.nativeEvent
                                });
                                handleImageError();
                              }}
                              onLoadEnd={() => {
                                console.log('🏁 [MainImage] Load ended (success or error):', currentFile.filename);
                              }}
                            />
                          </Animated.View>

                          {/* Loading Overlay */}
                          {imageLoading && (
                            <View style={styles.imageOverlay}>
                              <ActivityIndicator size="large" color={colors.primary} />
                              <Text style={styles.loadingText}>Carregando...</Text>
                            </View>
                          )}

                          {/* Error Overlay */}
                          {imageError && (
                            <View style={styles.imageOverlay}>
                              <Text style={styles.errorIcon}>⚠️</Text>
                              <Text style={styles.errorTitle}>Erro ao carregar</Text>
                              <Text style={styles.errorText}>Não foi possível carregar a imagem</Text>
                              <View style={styles.errorButtonRow}>
                                <TouchableOpacity style={styles.errorButton} onPress={handleOpenFile} activeOpacity={0.7}>
                                  <IconExternalLink size={16} color={colors.background} />
                                  <Text style={styles.errorButtonText}>Abrir</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.errorButton} onPress={handleDownload} activeOpacity={0.7}>
                                  <IconDownload size={16} color={colors.background} />
                                  <Text style={styles.errorButtonText}>Salvar</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    </PanGestureHandler>
                  </Animated.View>
                </PinchGestureHandler>
              </>
            ) : (
              // Non-previewable files
              <View style={styles.filePreviewContainer}>
                <TouchableOpacity style={styles.filePreviewWrapper} onPress={showControls} activeOpacity={1}>
                  {isPDF ? (
                    <>
                      <Text style={styles.filePreviewIcon}>📄</Text>
                      <Text style={styles.filePreviewTitle}>{currentFile.filename}</Text>
                      <Text style={styles.filePreviewSubtitle}>Documento PDF • {formatFileSize(currentFile.size)}</Text>
                      <View style={styles.filePreviewActions}>
                        <TouchableOpacity style={styles.fileActionButton} onPress={handleOpenFile} activeOpacity={0.7}>
                          <IconExternalLink size={18} color={colors.background} />
                          <Text style={styles.fileActionButtonText}>Abrir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.fileActionButton} onPress={handleDownload} activeOpacity={0.7}>
                          <IconDownload size={18} color={colors.background} />
                          <Text style={styles.fileActionButtonText}>Salvar</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : isEPS && !currentFile.thumbnailUrl ? (
                    <>
                      <IconVectorBezier size={64} color={colors.primary} />
                      <Text style={styles.filePreviewTitle}>{currentFile.filename}</Text>
                      <Text style={styles.filePreviewSubtitle}>Arquivo EPS • {formatFileSize(currentFile.size)}</Text>
                      <Text style={styles.filePreviewNote}>Visualização não disponível</Text>
                      <View style={styles.filePreviewActions}>
                        <TouchableOpacity style={styles.fileActionButton} onPress={handleOpenFile} activeOpacity={0.7}>
                          <IconExternalLink size={18} color={colors.background} />
                          <Text style={styles.fileActionButtonText}>Abrir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.fileActionButton} onPress={handleDownload} activeOpacity={0.7}>
                          <IconDownload size={18} color={colors.background} />
                          <Text style={styles.fileActionButtonText}>Salvar</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.filePreviewIcon}>📎</Text>
                      <Text style={styles.filePreviewTitle}>{currentFile.filename}</Text>
                      <Text style={styles.filePreviewSubtitle}>{formatFileSize(currentFile.size)}</Text>
                      <View style={styles.filePreviewActions}>
                        <TouchableOpacity style={styles.fileActionButton} onPress={handleOpenFile} activeOpacity={0.7}>
                          <IconExternalLink size={18} color={colors.background} />
                          <Text style={styles.fileActionButtonText}>Abrir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.fileActionButton} onPress={handleDownload} activeOpacity={0.7}>
                          <IconDownload size={18} color={colors.background} />
                          <Text style={styles.fileActionButtonText}>Salvar</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Bottom Controls */}
          {isCurrentFilePreviewable && (
            <Animated.View style={StyleSheet.flatten([styles.bottomControls, animatedControlsStyle])}>
              <View style={styles.controlsRow}>
                {/* Action Controls */}
                <View style={styles.actionControls}>
                  <TouchableOpacity style={styles.controlButton} onPress={handleOpenFile} activeOpacity={0.7}>
                    <IconExternalLink size={20} color={colors.foreground} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.controlButton} onPress={handleDownload} activeOpacity={0.7}>
                    <IconDownload size={20} color={colors.foreground} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Thumbnail Strip */}
          {isCurrentFilePreviewable && totalImages > 1 && showThumbnailStrip && (
            <Animated.View style={StyleSheet.flatten([
              styles.thumbnailStrip,
              animatedControlsStyle,
              { paddingBottom: safeBottomPadding }
            ])}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailScrollContent}>
                {previewableFiles.map(({ file, originalIndex }, index) => {
                  const isActive = originalIndex === currentIndex;

                  return (
                    <TouchableOpacity
                      key={file.id}
                      style={StyleSheet.flatten([styles.thumbnailButton, isActive && styles.thumbnailButtonActive])}
                      onPress={() => {
                        setCurrentIndex(originalIndex);
                        showControls();
                      }}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{
                          uri: getFileThumbnailUrl(file, "small"),
                        }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                        onError={(error) => {
                          console.error('❌ [Thumbnail] Failed to load:', {
                            filename: file.filename,
                            url: getFileThumbnailUrl(file, "small"),
                            error: error.nativeEvent
                          });
                        }}
                        onLoad={() => {
                          console.log('✅ [Thumbnail] Loaded successfully:', file.filename);
                        }}
                      />
                      {isActive && <View style={styles.thumbnailActiveOverlay} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fileName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  fileSize: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  imageCounter: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageCounterText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    flex: 1,
    position: "relative",
  },
  imageWrapper: {
    flex: 1,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 200, // Account for header and controls
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    color: "white",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  errorIcon: {
    fontSize: 64,
  },
  errorTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  errorText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  errorButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  errorButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  errorButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  navigationContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    pointerEvents: "box-none",
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  navButtonLeft: {
    // Position specific styles if needed
  },
  navButtonRight: {
    // Position specific styles if needed
  },
  filePreviewContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filePreviewWrapper: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 32,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 32,
    maxWidth: SCREEN_WIDTH - 64,
  },
  filePreviewIcon: {
    fontSize: 72,
  },
  filePreviewTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  filePreviewSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    textAlign: "center",
  },
  filePreviewNote: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    textAlign: "center",
  },
  filePreviewActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  fileActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  fileActionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  bottomControls: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  zoomControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 24,
    padding: 4,
  },
  rotationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  zoomText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "center",
  },
  thumbnailStrip: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingVertical: 12,
  },
  thumbnailScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    flexGrow: 1,
    justifyContent: 'center',
  },
  thumbnailButton: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbnailButtonActive: {
    borderColor: "white",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailActiveOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
