import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDecay,
  runOnJS,
  interpolate,
  Extrapolate,
  cancelAnimation,
  clamp
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import NetInfo from "@react-native-community/netinfo";
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
const DOUBLE_TAP_ZOOM = 2.5;
const SWIPE_THRESHOLD = 50;
const MIN_FLING_VELOCITY = 500;
const OVERSCROLL_AMOUNT = 50;

// Spring configurations for native-like feel
const SPRING_CONFIG_ZOOM = {
  damping: 20,
  stiffness: 300,
  mass: 0.5,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

const SPRING_CONFIG_SNAP = {
  damping: 18,
  stiffness: 200,
  mass: 0.8,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

const SPRING_CONFIG_RESET = {
  damping: 25,
  stiffness: 350,
  mass: 0.5,
  overshootClamping: true,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

const SPRING_CONFIG_DISMISS = {
  damping: 15,
  stiffness: 150,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

// Platform-specific decay configuration
const DECAY_CONFIG = Platform.select({
  ios: {
    deceleration: 0.998,
    velocityFactor: 1,
  },
  android: {
    deceleration: 0.997,
    velocityFactor: 0.95,
  },
}) || { deceleration: 0.998, velocityFactor: 1 };

// EPS file detection
const isEpsFile = (file: AnkaaFile): boolean => {
  const epsMimeTypes = ["application/postscript", "application/x-eps", "application/eps", "image/eps", "image/x-eps"];
  return epsMimeTypes.includes(file.mimetype.toLowerCase());
};

// PDF file detection
const isPdfFile = (file: AnkaaFile): boolean => {
  return file.mimetype.toLowerCase() === "application/pdf" ||
         getFileExtension(file.filename).toLowerCase() === "pdf";
};

// Check if file can be previewed
const isPreviewableFile = (file: AnkaaFile): boolean => {
  return isImageFile(file) ||
         (isEpsFile(file) && !!file.thumbnailUrl) ||
         (isPdfFile(file) && !!file.thumbnailUrl);
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

  // State management
  const [currentIndex, setCurrentIndex] = useState(initialFileIndex);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Animated values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const swipeTranslateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const velocityX = useSharedValue(0);
  const velocityY = useSharedValue(0);

  // Track image dimensions for proper boundary calculation
  const imageDimensions = useSharedValue({ width: 0, height: 0 });

  // Refs
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageCache = useRef<Map<string, boolean>>(new Map());
  const preloadQueue = useRef<Set<string>>(new Set());

  // Filter previewable files
  const previewableFiles = useMemo(
    () => files.map((file, index) => ({ file, originalIndex: index }))
      .filter(({ file }) => isPreviewableFile(file)),
    [files]
  );

  const currentFile = files[currentIndex];
  const isCurrentFilePreviewable = currentFile && isPreviewableFile(currentFile);

  // Find current image index within previewable files
  const currentImageIndex = useMemo(() => {
    if (!isCurrentFilePreviewable) return -1;
    return previewableFiles.findIndex(({ originalIndex }) => originalIndex === currentIndex);
  }, [currentIndex, previewableFiles, isCurrentFilePreviewable]);

  const totalImages = previewableFiles.length;

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  // Preload adjacent images for smooth navigation
  useEffect(() => {
    if (!isCurrentFilePreviewable || totalImages <= 1) return;

    const preloadImage = (index: number) => {
      if (index >= 0 && index < totalImages) {
        const fileToPreload = previewableFiles[index].file;
        const url = getFileUrl(fileToPreload, baseUrl);

        if (!preloadQueue.current.has(url)) {
          preloadQueue.current.add(url);
          Image.prefetch(url).catch(() => {
            preloadQueue.current.delete(url);
          });
        }
      }
    };

    // Preload previous and next images
    preloadImage(currentImageIndex - 1);
    preloadImage(currentImageIndex + 1);
  }, [currentImageIndex, totalImages, previewableFiles, isCurrentFilePreviewable, baseUrl]);

  // Calculate image bounds based on actual dimensions
  const calculateImageBounds = useCallback((currentScale: number) => {
    'worklet';

    const imageWidth = imageDimensions.value.width || SCREEN_WIDTH;
    const imageHeight = imageDimensions.value.height || SCREEN_HEIGHT;

    const imageAspect = imageWidth / imageHeight;
    const containerAspect = SCREEN_WIDTH / (SCREEN_HEIGHT - 200);

    let displayWidth, displayHeight;

    if (imageAspect > containerAspect) {
      displayWidth = SCREEN_WIDTH;
      displayHeight = SCREEN_WIDTH / imageAspect;
    } else {
      displayHeight = SCREEN_HEIGHT - 200;
      displayWidth = (SCREEN_HEIGHT - 200) * imageAspect;
    }

    const scaledWidth = displayWidth * currentScale;
    const scaledHeight = displayHeight * currentScale;

    const maxTranslateX = Math.max(0, (scaledWidth - SCREEN_WIDTH) / 2);
    const maxTranslateY = Math.max(0, (scaledHeight - (SCREEN_HEIGHT - 200)) / 2);

    return {
      minX: -maxTranslateX,
      maxX: maxTranslateX,
      minY: -maxTranslateY,
      maxY: maxTranslateY,
    };
  }, []);

  // Reset states when file changes
  useEffect(() => {
    cancelAnimation(scale);
    cancelAnimation(translateX);
    cancelAnimation(translateY);

    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    focalX.value = 0;
    focalY.value = 0;
    swipeTranslateX.value = 0;
    opacity.value = 1;
    setRotation(0);
    setImageLoading(true);
    setImageError(false);
    setRetryCount(0);
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
      // Cleanup cache on unmount
      imageCache.current.clear();
      preloadQueue.current.clear();
    };
  }, [visible, resetControlsTimeout]);

  // Play haptic feedback
  const playHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' | 'edge') => {
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'edge':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
    }
  }, []);

  // Navigation functions
  const handlePrevious = useCallback(() => {
    if (!isCurrentFilePreviewable || totalImages <= 1) return;

    playHapticFeedback('light');
    const prevImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : totalImages - 1;
    setCurrentIndex(previewableFiles[prevImageIndex].originalIndex);
    showControls();
  }, [isCurrentFilePreviewable, currentImageIndex, totalImages, previewableFiles, showControls, playHapticFeedback]);

  const handleNext = useCallback(() => {
    if (!isCurrentFilePreviewable || totalImages <= 1) return;

    playHapticFeedback('light');
    const nextImageIndex = currentImageIndex < totalImages - 1 ? currentImageIndex + 1 : 0;
    setCurrentIndex(previewableFiles[nextImageIndex].originalIndex);
    showControls();
  }, [isCurrentFilePreviewable, currentImageIndex, totalImages, previewableFiles, showControls, playHapticFeedback]);

  // Create gesture handlers using modern API
  const pinchGesture = useMemo(() =>
    Gesture.Pinch()
      .enabled(enablePinchZoom)
      .onStart(() => {
        'worklet';
        savedScale.value = scale.value;
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      })
      .onChange((event) => {
        'worklet';
        const newScale = clamp(
          savedScale.value * event.scale,
          MIN_ZOOM,
          MAX_ZOOM
        );

        // Calculate focal point zoom
        const focalPointX = event.focalX - SCREEN_WIDTH / 2;
        const focalPointY = event.focalY - SCREEN_HEIGHT / 2;

        const scaleDelta = newScale / savedScale.value;

        // Keep focal point stationary during zoom
        translateX.value = savedTranslateX.value + (focalPointX - savedTranslateX.value) * (scaleDelta - 1);
        translateY.value = savedTranslateY.value + (focalPointY - savedTranslateY.value) * (scaleDelta - 1);

        scale.value = newScale;
      })
      .onEnd(() => {
        'worklet';
        const bounds = calculateImageBounds(scale.value);

        if (scale.value < 1) {
          scale.value = withSpring(1, SPRING_CONFIG_RESET);
          translateX.value = withSpring(0, SPRING_CONFIG_RESET);
          translateY.value = withSpring(0, SPRING_CONFIG_RESET);
          runOnJS(playHapticFeedback)('light');
        } else if (scale.value > MAX_ZOOM) {
          scale.value = withSpring(MAX_ZOOM, SPRING_CONFIG_SNAP);
        } else {
          // Snap to boundaries
          translateX.value = withSpring(
            clamp(translateX.value, bounds.minX, bounds.maxX),
            SPRING_CONFIG_SNAP
          );
          translateY.value = withSpring(
            clamp(translateY.value, bounds.minY, bounds.maxY),
            SPRING_CONFIG_SNAP
          );
        }

        runOnJS(showControls)();
      }),
    [enablePinchZoom, calculateImageBounds, showControls, playHapticFeedback]
  );

  const panGesture = useMemo(() =>
    Gesture.Pan()
      .onStart(() => {
        'worklet';
        cancelAnimation(translateX);
        cancelAnimation(translateY);
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        runOnJS(showControls)();
      })
      .onChange((event) => {
        'worklet';

        if (scale.value > 1) {
          // Pan when zoomed
          const bounds = calculateImageBounds(scale.value);

          translateX.value = clamp(
            savedTranslateX.value + event.translationX,
            bounds.minX - OVERSCROLL_AMOUNT,
            bounds.maxX + OVERSCROLL_AMOUNT
          );
          translateY.value = clamp(
            savedTranslateY.value + event.translationY,
            bounds.minY - OVERSCROLL_AMOUNT,
            bounds.maxY + OVERSCROLL_AMOUNT
          );

          velocityX.value = event.velocityX;
          velocityY.value = event.velocityY;
        } else if (enableSwipeNavigation) {
          // Swipe for navigation
          swipeTranslateX.value = event.translationX;
          opacity.value = interpolate(
            Math.abs(event.translationX),
            [0, SCREEN_WIDTH / 3],
            [1, 0.7],
            Extrapolate.CLAMP
          );
        }
      })
      .onFinalize((event) => {
        'worklet';

        if (scale.value > 1) {
          const bounds = calculateImageBounds(scale.value);
          const speed = Math.sqrt(event.velocityX ** 2 + event.velocityY ** 2);

          if (speed > MIN_FLING_VELOCITY) {
            // Apply momentum with decay
            translateX.value = withDecay({
              velocity: event.velocityX * DECAY_CONFIG.velocityFactor,
              clamp: [bounds.minX, bounds.maxX],
              deceleration: DECAY_CONFIG.deceleration,
              rubberBandEffect: true,
              rubberBandFactor: 0.6,
            });

            translateY.value = withDecay({
              velocity: event.velocityY * DECAY_CONFIG.velocityFactor,
              clamp: [bounds.minY, bounds.maxY],
              deceleration: DECAY_CONFIG.deceleration,
              rubberBandEffect: true,
              rubberBandFactor: 0.6,
            });
          } else {
            // Snap to boundaries
            translateX.value = withSpring(
              clamp(translateX.value, bounds.minX, bounds.maxX),
              SPRING_CONFIG_SNAP
            );
            translateY.value = withSpring(
              clamp(translateY.value, bounds.minY, bounds.maxY),
              SPRING_CONFIG_SNAP
            );
          }

          // Check for edge collision
          if (translateX.value <= bounds.minX || translateX.value >= bounds.maxX) {
            runOnJS(playHapticFeedback)('edge');
          }
        } else if (enableSwipeNavigation) {
          const shouldNavigate = Math.abs(event.translationX) > SWIPE_THRESHOLD;

          if (shouldNavigate) {
            const direction = event.translationX > 0 ? 1 : -1;
            runOnJS(direction > 0 ? handlePrevious : handleNext)();
          }

          swipeTranslateX.value = withSpring(0, SPRING_CONFIG_DISMISS);
          opacity.value = withSpring(1, SPRING_CONFIG_DISMISS);
        }
      }),
    [enableSwipeNavigation, calculateImageBounds, showControls, playHapticFeedback, handlePrevious, handleNext]
  );

  const doubleTapGesture = useMemo(() =>
    Gesture.Tap()
      .numberOfTaps(2)
      .onEnd((event) => {
        'worklet';
        const isZoomed = scale.value > 1;

        if (isZoomed) {
          // Zoom out
          scale.value = withSpring(1, SPRING_CONFIG_ZOOM);
          translateX.value = withSpring(0, SPRING_CONFIG_ZOOM);
          translateY.value = withSpring(0, SPRING_CONFIG_ZOOM);
        } else {
          // Zoom in to tap location
          const focalPointX = event.x - SCREEN_WIDTH / 2;
          const focalPointY = event.y - (SCREEN_HEIGHT - 200) / 2;

          translateX.value = withSpring(-focalPointX * (DOUBLE_TAP_ZOOM - 1), SPRING_CONFIG_ZOOM);
          translateY.value = withSpring(-focalPointY * (DOUBLE_TAP_ZOOM - 1), SPRING_CONFIG_ZOOM);
          scale.value = withSpring(DOUBLE_TAP_ZOOM, SPRING_CONFIG_ZOOM);
        }

        runOnJS(playHapticFeedback)('medium');
      }),
    [playHapticFeedback]
  );

  const singleTapGesture = useMemo(() =>
    Gesture.Tap()
      .numberOfTaps(1)
      .onEnd(() => {
        'worklet';
        runOnJS(showControls)();
      }),
    [showControls]
  );

  // Compose gestures
  const composedGestures = useMemo(() =>
    Gesture.Simultaneous(
      Gesture.Exclusive(doubleTapGesture, singleTapGesture),
      Gesture.Race(pinchGesture, panGesture)
    ),
    [doubleTapGesture, singleTapGesture, pinchGesture, panGesture]
  );

  // Download/Share/Open functions
  const handleDownload = useCallback(async () => {
    if (!currentFile) return;

    try {
      showControls();
      playHapticFeedback('light');

      const fileUrl = getFileUrl(currentFile, baseUrl);
      const fileUri = FileSystem.documentDirectory + currentFile.filename;

      Alert.alert("Baixando arquivo...", "Aguarde enquanto o arquivo é baixado.");

      const { uri } = await FileSystem.downloadAsync(fileUrl, fileUri);

      playHapticFeedback('heavy');
      Alert.alert("Sucesso", "Arquivo salvo com sucesso!");
    } catch (error) {
      console.error("Error downloading file:", error);
      Alert.alert("Erro", "Não foi possível baixar o arquivo.");
    }
  }, [currentFile, baseUrl, showControls, playHapticFeedback]);

  const handleShare = useCallback(async () => {
    if (!currentFile) return;

    try {
      showControls();
      playHapticFeedback('light');

      const Sharing = await import("expo-sharing");
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert("Compartilhamento não disponível", "Seu dispositivo não suporta compartilhamento de arquivos.");
        return;
      }

      const fileUrl = getFileUrl(currentFile, baseUrl);
      const fileUri = FileSystem.cacheDirectory + currentFile.filename;

      const { uri } = await FileSystem.downloadAsync(fileUrl, fileUri);

      await Sharing.shareAsync(uri, {
        mimeType: currentFile.mimetype,
        dialogTitle: "Abrir com...",
        UTI: currentFile.mimetype,
      });

      playHapticFeedback('light');
    } catch (error) {
      console.error("Error sharing/opening file:", error);
      Alert.alert("Erro", "Não foi possível abrir o arquivo.");
    }
  }, [currentFile, baseUrl, showControls, playHapticFeedback]);

  const handleOpenFile = useCallback(async () => {
    await handleShare();
  }, [handleShare]);

  // Animated styles
  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value + swipeTranslateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const animatedControlsStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isControlsVisible ? 1 : 0, { duration: 300 }),
      pointerEvents: isControlsVisible ? 'auto' : 'none',
    } as any;
  });

  // Image load handlers
  const handleImageLoad = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.source;
    imageDimensions.value = { width, height };
    setImageLoading(false);
    setImageError(false);

    // Mark as cached
    if (currentFile) {
      imageCache.current.set(currentFile.id, true);
    }
  }, [currentFile]);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);

    // Retry logic with exponential backoff
    if (retryCount < 3 && isConnected) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageLoading(true);
        setImageError(false);
      }, Math.pow(2, retryCount) * 1000);
    }
  }, [retryCount, isConnected]);

  if (!currentFile) return null;

  const isPDF = isPdfFile(currentFile);
  const isEPS = isEpsFile(currentFile);

  // Helper function to get proper file URL
  const getFileUrl = (file: AnkaaFile, baseUrl?: string): string => {
    const apiUrl = baseUrl || (global as any).__ANKAA_API_URL__ || "http://localhost:3030";

    if (file.url && file.url.startsWith('http')) {
      const urlObj = new URL(file.url);
      return `${apiUrl}${urlObj.pathname}${urlObj.search}`;
    }

    return `${apiUrl}/files/serve/${file.id}`;
  };

  // Helper function to get thumbnail URL
  const getFileThumbnailUrl = (file: AnkaaFile, size: "small" | "medium" | "large" = "medium"): string => {
    const apiUrl = baseUrl || (global as any).__ANKAA_API_URL__ || "http://localhost:3030";

    if (file.thumbnailUrl) {
      if (file.thumbnailUrl.startsWith('http')) {
        const urlObj = new URL(file.thumbnailUrl);
        return `${apiUrl}${urlObj.pathname}?size=${size}`;
      }
      return `${apiUrl}/files/thumbnail/${file.id}?size=${size}`;
    }

    if (isImageFile(file)) {
      return `${apiUrl}/files/serve/${file.id}`;
    }

    return "";
  };

  // Memoized thumbnail component for better performance
  const ThumbnailItem = React.memo(({
    file,
    isActive,
    onPress
  }: {
    file: AnkaaFile;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.thumbnailButton, isActive && styles.thumbnailButtonActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnailImageContainer}>
        <Image
          source={{
            uri: getFileThumbnailUrl(file, "small"),
            cache: imageCache.current.has(file.id) ? 'force-cache' : 'default',
          }}
          style={styles.thumbnailImage}
          resizeMode="cover"
        />
      </View>
      {isActive && <View style={styles.thumbnailActiveOverlay} />}
    </TouchableOpacity>
  ));

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

          <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.95)' }]}>
            {/* Header */}
            <Animated.View style={[styles.header, animatedControlsStyle]}>
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
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <IconX size={24} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Image Container */}
            <View style={styles.imageContainer}>
              {isCurrentFilePreviewable ? (
                <GestureDetector gesture={composedGestures}>
                  <Animated.View style={styles.imageWrapper}>
                    <TouchableOpacity activeOpacity={1} onPress={showControls} style={styles.imageWrapper}>
                      <Animated.View style={animatedImageStyle}>
                        <Image
                          key={`image-${currentFile.id}-${currentIndex}`}
                          source={{
                            uri: (isEPS || isPDF) && currentFile.thumbnailUrl
                              ? getFileThumbnailUrl(currentFile, "large")
                              : getFileUrl(currentFile, baseUrl),
                            cache: imageCache.current.has(currentFile.id) ? 'force-cache' : 'default',
                          }}
                          style={[
                            styles.image,
                            { transform: [{ rotate: `${rotation}deg` }] }
                          ]}
                          resizeMode="contain"
                          progressiveRenderingEnabled={true}
                          fadeDuration={200}
                          onLoad={handleImageLoad}
                          onError={handleImageError}
                        />
                      </Animated.View>

                      {/* Loading Overlay */}
                      {imageLoading && (
                        <View style={styles.imageOverlay}>
                          <ActivityIndicator size="large" color={colors.primary} />
                          <Text style={styles.loadingText}>Carregando...</Text>
                          {retryCount > 0 && (
                            <Text style={styles.retryText}>Tentativa {retryCount}/3</Text>
                          )}
                        </View>
                      )}

                      {/* Error Overlay */}
                      {imageError && retryCount >= 3 && (
                        <View style={styles.imageOverlay}>
                          <Text style={styles.errorIcon}>⚠️</Text>
                          <Text style={styles.errorTitle}>Erro ao carregar</Text>
                          <Text style={styles.errorText}>
                            {!isConnected ? "Sem conexão com internet" : "Não foi possível carregar a imagem"}
                          </Text>
                          <View style={styles.errorButtonRow}>
                            <TouchableOpacity
                              style={styles.errorButton}
                              onPress={handleOpenFile}
                              activeOpacity={0.7}
                            >
                              <IconExternalLink size={16} color={colors.background} />
                              <Text style={styles.errorButtonText}>Abrir</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.errorButton}
                              onPress={handleDownload}
                              activeOpacity={0.7}
                            >
                              <IconDownload size={16} color={colors.background} />
                              <Text style={styles.errorButtonText}>Salvar</Text>
                            </TouchableOpacity>
                            {isConnected && (
                              <TouchableOpacity
                                style={styles.errorButton}
                                onPress={() => {
                                  setRetryCount(0);
                                  setImageLoading(true);
                                  setImageError(false);
                                }}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.errorButtonText}>Tentar Novamente</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </GestureDetector>
              ) : (
                // Non-previewable files
                <View style={styles.filePreviewContainer}>
                  <TouchableOpacity style={styles.filePreviewWrapper} onPress={showControls} activeOpacity={1}>
                    {isPDF && !currentFile.thumbnailUrl ? (
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
              <Animated.View style={[styles.bottomControls, animatedControlsStyle]}>
                <View style={styles.controlsRow}>
                  <View style={styles.actionControls}>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={handleOpenFile}
                      activeOpacity={0.7}
                    >
                      <IconExternalLink size={20} color={colors.foreground} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={handleDownload}
                      activeOpacity={0.7}
                    >
                      <IconDownload size={20} color={colors.foreground} />
                    </TouchableOpacity>

                  </View>
                </View>
              </Animated.View>
            )}

            {/* Thumbnail Strip */}
            {isCurrentFilePreviewable && totalImages > 1 && showThumbnailStrip && (
              <Animated.View style={[styles.thumbnailStrip, animatedControlsStyle]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailScrollContent}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={5}
                  windowSize={5}
                >
                  {previewableFiles.map(({ file, originalIndex }, index) => (
                    <ThumbnailItem
                      key={`thumbnail-${index}-${originalIndex}`}
                      file={file}
                      isActive={originalIndex === currentIndex}
                      onPress={() => {
                        setCurrentIndex(originalIndex);
                        showControls();
                        playHapticFeedback('light');
                      }}
                    />
                  ))}
                </ScrollView>
              </Animated.View>
            )}
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    zIndex: 10,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 200,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    gap: 16,
  },
  loadingText: {
    color: "white",
    fontSize: 16,
  },
  retryText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
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
    flexWrap: 'wrap',
    justifyContent: 'center',
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
    justifyContent: "center",
  },
  actionControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailStrip: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingVertical: 12,
    paddingBottom: 24,
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
    borderRadius: 12, // Small rounded corners
    borderWidth: 2,
    borderColor: "transparent",
    marginHorizontal: 4,
  },
  thumbnailButtonActive: {
    borderColor: "#15803d", // Primary green color
    borderWidth: 2,
  },
  thumbnailImageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 10, // Slightly smaller radius than button
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailActiveOverlay: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    backgroundColor: "rgba(21, 128, 61, 0.1)", // Slight green tint
    borderRadius: 10,
  },
});