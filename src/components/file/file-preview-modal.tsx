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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PanGestureHandler, PinchGestureHandler, State } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS, interpolate, Extrapolate } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
// import { BlurView } from "expo-blur";
import {
  IconArrowLeft,
  IconArrowRight,
  IconX,
  IconZoomIn,
  IconZoomOut,
  IconDownload,
  IconExternalLink,
  IconVectorBezier,
  IconRotateClockwise,
  IconRotate2,
  IconMaximize,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { File as AnkaaFile } from '../../types';
import { isImageFile, getFileUrl, getFileThumbnailUrl, formatFileSize, getFileExtension } from '../../utils';
import * as FileSystem from "expo-file-system/legacy";
// import * as MediaLibrary from "expo-media-library";
// import * as Sharing from "expo-sharing";

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

  // Download/Share functions
  const handleDownload = useCallback(async () => {
    if (!currentFile) return;

    try {
      showControls();

      // TODO: Implement media library permissions when expo-media-library is available
      // const { status } = await MediaLibrary.requestPermissionsAsync();
      // if (status !== "granted") {
      //   Alert.alert("Permissão necessária", "É necessária permissão para salvar arquivos na galeria.");
      //   return;
      // }

      const fileUrl = getFileUrl(currentFile, baseUrl);
      const fileUri = FileSystem.documentDirectory + currentFile.filename;

      // Download file
      const { uri } = await FileSystem.downloadAsync(fileUrl, fileUri);

      // TODO: Save to media library when expo-media-library is available
      // await MediaLibrary.saveToLibraryAsync(uri);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Alert.alert("Sucesso", "Arquivo salvo na galeria!");
    } catch (error) {
      console.error("Error downloading file:", error);
      Alert.alert("Erro", "Não foi possível baixar o arquivo.");
    }
  }, [currentFile, baseUrl, showControls]);

  const handleShare = useCallback(async () => {
    if (!currentFile) return;

    try {
      showControls();

      const fileUrl = getFileUrl(currentFile, baseUrl);
      const fileUri = FileSystem.cacheDirectory + currentFile.filename;

      // Download to cache
      const { uri } = await FileSystem.downloadAsync(fileUrl, fileUri);

      // TODO: Share file when expo-sharing is available
      // await Sharing.shareAsync(uri, {
      //   mimeType: currentFile.mimetype,
      //   dialogTitle: "Compartilhar arquivo",
      // });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("Error sharing file:", error);
      Alert.alert("Erro", "Não foi possível compartilhar o arquivo.");
    }
  }, [currentFile, baseUrl, showControls]);

  // Pinch gesture handler
  const pinchGestureHandler = (event: any) => {
    'worklet';
    if (event.nativeEvent.state === State.BEGAN) {
      focalX.value = event.nativeEvent.focalX;
      focalY.value = event.nativeEvent.focalY;
    } else if (event.nativeEvent.state === State.ACTIVE) {
      if (!enablePinchZoom) return;

      const newScale = Math.max(MIN_ZOOM, Math.min(event.nativeEvent.scale, MAX_ZOOM));
      scale.value = newScale;

      // Handle focal point
      if (event.nativeEvent.scale > 1) {
        const focal = {
          x: event.nativeEvent.focalX - SCREEN_WIDTH / 2,
          y: event.nativeEvent.focalY - SCREEN_HEIGHT / 2,
        };

        translateX.value = focal.x * (1 - 1 / event.nativeEvent.scale);
        translateY.value = focal.y * (1 - 1 / event.nativeEvent.scale);
      }
    } else if (event.nativeEvent.state === State.END) {
      // Snap to boundaries
      if (scale.value < 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }

      runOnJS(showControls)();
    }
  };

  // Pan gesture handler for zoomed images
  const panGestureHandler = (event: any) => {
    'worklet';
    if (event.nativeEvent.state === State.BEGAN) {
      runOnJS(showControls)();
    } else if (event.nativeEvent.state === State.ACTIVE) {
      if (scale.value > 1) {
        // Pan when zoomed
        translateX.value = event.nativeEvent.translationX;
        translateY.value = event.nativeEvent.translationY;
      } else if (enableSwipeNavigation) {
        // Swipe for navigation
        swipeTranslateX.value = event.nativeEvent.translationX;
        opacity.value = interpolate(Math.abs(event.nativeEvent.translationX), [0, SCREEN_WIDTH / 3], [1, 0.7], Extrapolate.CLAMP);
      }
    } else if (event.nativeEvent.state === State.END) {
      if (scale.value > 1) {
        // Boundary check for panning
        const maxTranslateX = (SCREEN_WIDTH * scale.value - SCREEN_WIDTH) / 2;
        const maxTranslateY = (SCREEN_HEIGHT * scale.value - SCREEN_HEIGHT) / 2;

        translateX.value = withSpring(Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX.value)));
        translateY.value = withSpring(Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY.value)));
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

        // Reset swipe state
        swipeTranslateX.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    }
  };

  // Animated styles
  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value + swipeTranslateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation}deg` as any }
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

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.container}>
        {/* Background Blur */}
        <View style={StyleSheet.flatten([StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.8)' }])} />

        {/* Main Content */}
        <SafeAreaView style={styles.content}>
          {/* Header */}
          <Animated.View style={StyleSheet.flatten([styles.header, animatedControlsStyle])}>
            <View style={styles.headerLeft}>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {currentFile.filename}
                </Text>
                <Text style={styles.fileSize}>{formatFileSize(currentFile.size)}</Text>
                {isCurrentFilePreviewable && totalImages > 1 && showImageCounter && (
                  <Badge style={styles.imageCounter} textStyle={styles.imageCounterText}>
                    {currentImageIndex + 1} de {totalImages}
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
                          {imageLoading && (
                            <View style={styles.loadingContainer}>
                              <ActivityIndicator size="large" color={colors.primary} />
                              <Text style={styles.loadingText}>Carregando...</Text>
                            </View>
                          )}

                          {imageError ? (
                            <View style={styles.errorContainer}>
                              <Text style={styles.errorIcon}>⚠️</Text>
                              <Text style={styles.errorTitle}>Erro ao carregar</Text>
                              <Text style={styles.errorText}>Não foi possível carregar a imagem</Text>
                              <TouchableOpacity style={styles.errorButton} onPress={handleShare} activeOpacity={0.7}>
                                <IconDownload size={16} color={colors.background} />
                                <Text style={styles.errorButtonText}>Baixar</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <Animated.Image
                              source={{
                                uri:
                                  isEPS && currentFile.thumbnailUrl
                                    ? currentFile.thumbnailUrl.startsWith("http")
                                      ? currentFile.thumbnailUrl
                                      : `/api/files/thumbnail/${currentFile.id}?size=large`
                                    : getFileUrl(currentFile, baseUrl),
                              }}
                              style={StyleSheet.flatten([styles.image, animatedImageStyle])}
                              resizeMode="contain"
                              onLoad={handleImageLoad}
                              onError={handleImageError}
                            />
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    </PanGestureHandler>
                  </Animated.View>
                </PinchGestureHandler>

                {/* Navigation Arrows */}
                {totalImages > 1 && (
                  <Animated.View style={StyleSheet.flatten([styles.navigationContainer, animatedControlsStyle])}>
                    <TouchableOpacity style={StyleSheet.flatten([styles.navButton, styles.navButtonLeft])} onPress={handlePrevious} activeOpacity={0.7}>
                      <IconArrowLeft size={28} color={colors.foreground} />
                    </TouchableOpacity>

                    <TouchableOpacity style={StyleSheet.flatten([styles.navButton, styles.navButtonRight])} onPress={handleNext} activeOpacity={0.7}>
                      <IconArrowRight size={28} color={colors.foreground} />
                    </TouchableOpacity>
                  </Animated.View>
                )}
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
                        <TouchableOpacity style={styles.fileActionButton} onPress={handleShare} activeOpacity={0.7}>
                          <IconExternalLink size={18} color={colors.background} />
                          <Text style={styles.fileActionButtonText}>Compartilhar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.fileActionButton} onPress={handleDownload} activeOpacity={0.7}>
                          <IconDownload size={18} color={colors.background} />
                          <Text style={styles.fileActionButtonText}>Baixar</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : isEPS && !currentFile.thumbnailUrl ? (
                    <>
                      <IconVectorBezier size={64} color={colors.primary} />
                      <Text style={styles.filePreviewTitle}>{currentFile.filename}</Text>
                      <Text style={styles.filePreviewSubtitle}>Arquivo EPS • {formatFileSize(currentFile.size)}</Text>
                      <Text style={styles.filePreviewNote}>Visualização não disponível</Text>
                      <TouchableOpacity style={styles.fileActionButton} onPress={handleDownload} activeOpacity={0.7}>
                        <IconDownload size={18} color={colors.background} />
                        <Text style={styles.fileActionButtonText}>Baixar</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.filePreviewIcon}>📎</Text>
                      <Text style={styles.filePreviewTitle}>{currentFile.filename}</Text>
                      <Text style={styles.filePreviewSubtitle}>{formatFileSize(currentFile.size)}</Text>
                      <TouchableOpacity style={styles.fileActionButton} onPress={handleDownload} activeOpacity={0.7}>
                        <IconDownload size={18} color={colors.background} />
                        <Text style={styles.fileActionButtonText}>Baixar</Text>
                      </TouchableOpacity>
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
                {/* Zoom Controls */}
                <View style={styles.zoomControls}>
                  <TouchableOpacity
                    style={StyleSheet.flatten([styles.controlButton, scale.value <= MIN_ZOOM && styles.controlButtonDisabled])}
                    onPress={handleZoomOut}
                    disabled={scale.value <= MIN_ZOOM}
                    activeOpacity={0.7}
                  >
                    <IconZoomOut size={20} color={scale.value <= MIN_ZOOM ? colors.muted : colors.foreground} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.resetButton} onPress={handleResetZoom} activeOpacity={0.7}>
                    <Text style={styles.zoomText}>{Math.round(scale.value * 100)}%</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={StyleSheet.flatten([styles.controlButton, scale.value >= MAX_ZOOM && styles.controlButtonDisabled])}
                    onPress={handleZoomIn}
                    disabled={scale.value >= MAX_ZOOM}
                    activeOpacity={0.7}
                  >
                    <IconZoomIn size={20} color={scale.value >= MAX_ZOOM ? colors.muted : colors.foreground} />
                  </TouchableOpacity>
                </View>

                {/* Rotation Controls */}
                {enableRotation && (
                  <View style={styles.rotationControls}>
                    <TouchableOpacity style={styles.controlButton} onPress={handleRotateLeft} activeOpacity={0.7}>
                      <IconRotate2 size={20} color={colors.foreground} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.controlButton} onPress={handleRotateRight} activeOpacity={0.7}>
                      <IconRotateClockwise size={20} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Action Controls */}
                <View style={styles.actionControls}>
                  <TouchableOpacity style={styles.controlButton} onPress={handleShare} activeOpacity={0.7}>
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
            <Animated.View style={StyleSheet.flatten([styles.thumbnailStrip, animatedControlsStyle])}>
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
                          uri: getFileThumbnailUrl(file, "small", baseUrl) || getFileUrl(file, baseUrl),
                        }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                      {isActive && <View style={styles.thumbnailActiveOverlay} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
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
