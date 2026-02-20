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
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
  withDecay,
  clamp
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  IconX,
  IconExternalLink,
  IconVectorBezier,
  IconFile,
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolumeOff,
  IconMaximize,
} from "@tabler/icons-react-native";
import { SvgUri } from "react-native-svg";
import { useTheme } from "@/lib/theme";

// Conditionally import react-native-pdf (not supported in Expo Go)
let Pdf: any = null;
try {
  Pdf = require('react-native-pdf').default;
} catch (error) {
  console.warn('react-native-pdf not available in Expo Go');
}

// Conditionally import expo-av for video playback
let VideoComponent: any = null;
let ResizeModeEnum: any = null;
try {
  const expoAv = require('expo-av');
  VideoComponent = expoAv.Video;
  ResizeModeEnum = expoAv.ResizeMode;
} catch (error) {
  console.warn('expo-av not available');
}

import { Badge } from "@/components/ui/badge";
import type { File as AnkaaFile } from '../../types';
import { isImageFile, formatFileSize, getFileExtension } from '../../utils';
import { getApiBaseUrl } from '../../utils/file-viewer-utils';
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useFileViewerOrientation } from '@/hooks/use-file-viewer-orientation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const SWIPE_THRESHOLD = 50;

// EPS file detection
const isEpsFile = (file: AnkaaFile): boolean => {
  const epsMimeTypes = ["application/postscript", "application/x-eps", "application/eps", "image/eps", "image/x-eps"];
  return epsMimeTypes.includes(file.mimetype.toLowerCase());
};

// SVG file detection
const isSvgFile = (file: AnkaaFile): boolean => {
  const svgMimeTypes = ["image/svg+xml", "image/svg"];
  if (svgMimeTypes.includes(file.mimetype?.toLowerCase())) return true;
  const ext = getFileExtension(file.filename).toLowerCase();
  return ext === "svg";
};

// PDF file detection
const isPdfFile = (file: AnkaaFile): boolean => {
  const pdfMimeTypes = ["application/pdf"];
  if (pdfMimeTypes.includes(file.mimetype?.toLowerCase())) return true;
  const ext = getFileExtension(file.filename).toLowerCase();
  return ext === "pdf";
};

// Video file detection
const isVideoFile = (file: AnkaaFile): boolean => {
  const videoMimeTypes = ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", "video/webm", "video/x-matroska"];
  if (videoMimeTypes.some(type => file.mimetype?.toLowerCase().startsWith(type.split('/')[0]))) {
    return file.mimetype?.toLowerCase().startsWith("video/");
  }
  const ext = getFileExtension(file.filename).toLowerCase();
  return ["mp4", "avi", "mov", "wmv", "webm", "mkv", "m4v"].includes(ext);
};

// Check if file can be previewed (images, PDFs, videos, EPS with thumbnails)
const isPreviewableFile = (file: AnkaaFile): boolean => {
  // SVG files can always be previewed with SvgUri
  if (isSvgFile(file)) {
    return true;
  }
  // PDFs and videos are previewable
  if (isPdfFile(file) || isVideoFile(file)) {
    return true;
  }
  return isImageFile(file) || (isEpsFile(file) && !!file.thumbnailUrl);
};

// =====================
// Inline Video Player Sub-component
// =====================

interface InlineVideoPlayerProps {
  file: AnkaaFile;
  fileUrl: string;
  colors: any;
  onShare: () => void;
  onToggleControls: () => void;
}

function InlineVideoPlayer({ file, fileUrl, colors, onShare, onToggleControls }: InlineVideoPlayerProps) {
  const videoRef = React.useRef<any>(null);
  const [videoStatus, setVideoStatus] = React.useState<any>(null);
  const [videoLoading, setVideoLoading] = React.useState(true);
  const [videoError, setVideoError] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [showVideoControls, setShowVideoControls] = React.useState(true);
  const hideControlsRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPlaying = videoStatus?.isLoaded && videoStatus?.isPlaying;
  const isLoaded = videoStatus?.isLoaded;
  const durationMillis = videoStatus?.durationMillis || 0;
  const positionMillis = videoStatus?.positionMillis || 0;

  const resetHideTimer = React.useCallback(() => {
    if (hideControlsRef.current) clearTimeout(hideControlsRef.current);
    setShowVideoControls(true);
    hideControlsRef.current = setTimeout(() => {
      if (isPlaying) setShowVideoControls(false);
    }, 3000);
  }, [isPlaying]);

  React.useEffect(() => {
    return () => {
      if (hideControlsRef.current) clearTimeout(hideControlsRef.current);
    };
  }, []);

  // Stop video when component unmounts (file changes)
  React.useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.stopAsync().catch(() => {});
      }
    };
  }, []);

  const togglePlayPause = React.useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      resetHideTimer();
    } catch (err) {
      console.error('[InlineVideoPlayer] Toggle play/pause error:', err);
    }
  }, [isPlaying, resetHideTimer]);

  const toggleMute = React.useCallback(async () => {
    if (!videoRef.current) return;
    try {
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
      resetHideTimer();
    } catch (err) {
      console.error('[InlineVideoPlayer] Toggle mute error:', err);
    }
  }, [isMuted, resetHideTimer]);

  const toggleFullscreen = React.useCallback(async () => {
    if (!videoRef.current) return;
    try {
      await videoRef.current.presentFullscreenPlayer();
      resetHideTimer();
    } catch (err) {
      console.error('[InlineVideoPlayer] Fullscreen error:', err);
    }
  }, [resetHideTimer]);

  const handleScreenPress = React.useCallback(() => {
    setShowVideoControls(prev => !prev);
    resetHideTimer();
    onToggleControls();
  }, [resetHideTimer, onToggleControls]);

  const handlePlaybackStatusUpdate = React.useCallback((newStatus: any) => {
    setVideoStatus(newStatus);
    if (newStatus.isLoaded) {
      setVideoLoading(false);
      setVideoError(false);
      if (newStatus.didJustFinish) {
        setShowVideoControls(true);
        if (hideControlsRef.current) clearTimeout(hideControlsRef.current);
      }
    } else if (newStatus.error) {
      setVideoLoading(false);
      setVideoError(true);
    }
  }, []);

  const formatDuration = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!VideoComponent) {
    // expo-av not available - fallback to share
    return (
      <View style={styles.videoContainer}>
        <TouchableOpacity style={styles.videoPreviewWrapper} onPress={onShare} activeOpacity={0.7}>
          <IconPlayerPlay size={64} color={colors.primary} />
          <Text style={styles.filePreviewTitle}>{file.filename}</Text>
          <Text style={styles.filePreviewSubtitle}>Vídeo • {formatFileSize(file.size)}</Text>
          <Text style={styles.filePreviewNote}>Player não disponível. Toque para abrir externamente.</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (videoError) {
    return (
      <View style={styles.videoContainer}>
        <View style={styles.videoErrorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Erro ao carregar vídeo</Text>
          <Text style={styles.filePreviewSubtitle}>{file.filename}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={onShare} activeOpacity={0.7}>
            <IconExternalLink size={16} color="#ffffff" />
            <Text style={styles.errorButtonText}>Abrir com...</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Pressable style={styles.videoContainer} onPress={handleScreenPress}>
      <VideoComponent
        ref={videoRef}
        source={{ uri: fileUrl }}
        rate={1.0}
        volume={1.0}
        isMuted={isMuted}
        resizeMode={ResizeModeEnum?.CONTAIN || 'contain'}
        shouldPlay={false}
        isLooping={false}
        useNativeControls={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        style={styles.inlineVideo}
      />

      {/* Loading overlay */}
      {videoLoading && (
        <View style={styles.videoLoadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando vídeo...</Text>
        </View>
      )}

      {/* Center play/pause button */}
      {showVideoControls && isLoaded && (
        <TouchableOpacity
          style={styles.videoCenterControl}
          onPress={togglePlayPause}
          activeOpacity={0.7}
        >
          {isPlaying ? (
            <IconPlayerPause size={56} color="#ffffff" />
          ) : (
            <IconPlayerPlay size={56} color="#ffffff" />
          )}
        </TouchableOpacity>
      )}

      {/* Bottom controls */}
      {showVideoControls && isLoaded && (
        <View style={styles.videoBottomControls}>
          {/* Progress bar */}
          {durationMillis > 0 && (
            <View style={styles.videoProgressContainer}>
              <View style={styles.videoProgressBar}>
                <View
                  style={[
                    styles.videoProgressFill,
                    { width: `${(positionMillis / durationMillis) * 100}%` },
                  ]}
                />
              </View>
              <View style={styles.videoTimeContainer}>
                <Text style={styles.videoTimeText}>{formatDuration(positionMillis)}</Text>
                <Text style={styles.videoTimeText}>{formatDuration(durationMillis)}</Text>
              </View>
            </View>
          )}

          {/* Control buttons */}
          <View style={styles.videoControlButtons}>
            <TouchableOpacity onPress={toggleMute} style={styles.videoControlBtn} activeOpacity={0.7}>
              {isMuted ? (
                <IconVolumeOff size={22} color="#ffffff" />
              ) : (
                <IconVolume size={22} color="#ffffff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={togglePlayPause} style={styles.videoControlBtn} activeOpacity={0.7}>
              {isPlaying ? (
                <IconPlayerPause size={28} color="#ffffff" />
              ) : (
                <IconPlayerPlay size={28} color="#ffffff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleFullscreen} style={styles.videoControlBtn} activeOpacity={0.7}>
              <IconMaximize size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Pressable>
  );
}

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
  enableRotation: _enableRotation = true,
  showThumbnailStrip = true,
  showImageCounter = true,
}: FilePreviewModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // State management
  const [currentIndex, setCurrentIndex] = useState(initialFileIndex);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [_rotation, _setRotation] = useState(0);
  const [isControlsVisible, setIsControlsVisible] = useState(true);

  // Animated values for gestures
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const swipeTranslateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const isPinching = useSharedValue(false);

  // Refs
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Enable orientation change when file viewer is open
  useFileViewerOrientation({ isOpen: visible });

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
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    focalX.value = 0;
    focalY.value = 0;
    swipeTranslateX.value = 0;
    isPinching.value = false;
    _setRotation(0);
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

  // Toggle controls visibility (for single tap)
  const toggleControls = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    setIsControlsVisible(prev => {
      if (!prev) {
        // If showing controls, start the auto-hide timer
        controlsTimeoutRef.current = setTimeout(() => {
          setIsControlsVisible(false);
        }, 3000);
      }
      return !prev;
    });
  }, []);

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

  // Zoom functions (kept for future features)
  const _handleZoomIn = useCallback(() => {
    const newScale = Math.min(scale.value * 1.5, MAX_ZOOM);
    scale.value = withSpring(newScale);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showControls();
  }, [showControls]);

  const _handleZoomOut = useCallback(() => {
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

  const _handleResetZoom = useCallback(() => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    focalX.value = 0;
    focalY.value = 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showControls();
  }, [showControls]);

  // Rotation functions (kept for future features)
  const _handleRotateRight = useCallback(() => {
    _setRotation((prev) => (prev + 90) % 360);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showControls();
  }, [showControls]);

  const _handleRotateLeft = useCallback(() => {
    _setRotation((prev) => (prev - 90 + 360) % 360);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showControls();
  }, [showControls]);

  // Share/Open function - opens native share sheet for download, save, share, etc.
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

      const fileUrl = getFileUrl(currentFile);
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


  // Pinch gesture - Native-like zoom with focal point
  const pinchGesture = Gesture.Pinch()
    .enabled(enablePinchZoom)
    .onStart((event) => {
      'worklet';
      isPinching.value = true;
      focalX.value = event.focalX - SCREEN_WIDTH / 2;
      focalY.value = event.focalY - SCREEN_HEIGHT / 2;
      runOnJS(showControls)();
    })
    .onUpdate((event) => {
      'worklet';
      // Calculate new scale
      const newScale = savedScale.value * event.scale;
      const clampedScale = clamp(newScale, MIN_ZOOM, MAX_ZOOM);
      scale.value = clampedScale;

      // Calculate translation to maintain focal point
      const deltaScale = clampedScale - savedScale.value;
      translateX.value = savedTranslateX.value + (focalX.value * deltaScale) / savedScale.value;
      translateY.value = savedTranslateY.value + (focalY.value * deltaScale) / savedScale.value;
    })
    .onEnd(() => {
      'worklet';
      isPinching.value = false;
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;

      // Reset to 1x if zoomed out too much
      if (scale.value < 1) {
        scale.value = withSpring(1, { damping: 20, stiffness: 150 });
        translateX.value = withSpring(0, { damping: 20, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 150 });
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Clamp to boundaries
        const maxTranslateX = ((SCREEN_WIDTH * scale.value) - SCREEN_WIDTH) / 2;
        const maxTranslateY = ((SCREEN_HEIGHT * scale.value) - SCREEN_HEIGHT) / 2;

        const clampedX = clamp(translateX.value, -maxTranslateX, maxTranslateX);
        const clampedY = clamp(translateY.value, -maxTranslateY, maxTranslateY);

        if (clampedX !== translateX.value || clampedY !== translateY.value) {
          translateX.value = withSpring(clampedX, { damping: 20, stiffness: 150 });
          translateY.value = withSpring(clampedY, { damping: 20, stiffness: 150 });
          savedTranslateX.value = clampedX;
          savedTranslateY.value = clampedY;
        }
      }
    });

  // Pan gesture - Smooth panning when zoomed, swipe navigation when not
  // minDistance(10) prevents pan from stealing tap events on Android
  // (without it, sub-pixel finger movement activates pan before tap can recognize)
  const panGesture = Gesture.Pan()
    .minDistance(10)
    .onStart(() => {
      'worklet';
      // Save current position at start of gesture to prevent teleporting
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      runOnJS(showControls)();
    })
    .onUpdate((event) => {
      'worklet';
      if (scale.value > 1 || isPinching.value) {
        // Pan when zoomed
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
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
    .onEnd((event) => {
      'worklet';
      if (scale.value > 1) {
        // Clamp to boundaries with decay for momentum
        const maxTranslateX = ((SCREEN_WIDTH * scale.value) - SCREEN_WIDTH) / 2;
        const maxTranslateY = ((SCREEN_HEIGHT * scale.value) - SCREEN_HEIGHT) / 2;

        // Apply decay with boundaries
        translateX.value = withDecay({
          velocity: event.velocityX,
          clamp: [-maxTranslateX, maxTranslateX],
          deceleration: 0.997,
        }, () => {
          // Update saved value when animation completes
          savedTranslateX.value = translateX.value;
        });
        translateY.value = withDecay({
          velocity: event.velocityY,
          clamp: [-maxTranslateY, maxTranslateY],
          deceleration: 0.997,
        }, () => {
          // Update saved value when animation completes
          savedTranslateY.value = translateY.value;
        });
      } else if (enableSwipeNavigation) {
        // Handle swipe navigation
        const shouldNavigate = Math.abs(event.translationX) > SWIPE_THRESHOLD;

        if (shouldNavigate) {
          if (event.translationX > 0) {
            runOnJS(handlePrevious)();
          } else {
            runOnJS(handleNext)();
          }
        }

        // Reset swipe state
        swipeTranslateX.value = withSpring(0, { damping: 20, stiffness: 150 });
        opacity.value = withSpring(1, { damping: 20, stiffness: 150 });
      }
    });

  // Single tap to toggle controls
  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      'worklet';
      runOnJS(toggleControls)();
    });

  // Double tap to zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      'worklet';
      runOnJS(showControls)();

      if (scale.value > 1) {
        // Zoom out to 1x
        scale.value = withSpring(1, { damping: 20, stiffness: 150 });
        translateX.value = withSpring(0, { damping: 20, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 150 });
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom in to 2.5x at tap location
        const targetScale = 2.5;
        const tapX = event.x - SCREEN_WIDTH / 2;
        const tapY = event.y - SCREEN_HEIGHT / 2;

        scale.value = withSpring(targetScale, { damping: 20, stiffness: 150 });
        translateX.value = withSpring(-tapX * (targetScale - 1), { damping: 20, stiffness: 150 });
        translateY.value = withSpring(-tapY * (targetScale - 1), { damping: 20, stiffness: 150 });
        savedScale.value = targetScale;
        savedTranslateX.value = -tapX * (targetScale - 1);
        savedTranslateY.value = -tapY * (targetScale - 1);

        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      }
    });

  // Tap gestures: double-tap has priority, then single-tap
  const tapGestures = Gesture.Exclusive(doubleTapGesture, singleTapGesture);

  // Compose all gestures
  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Race(tapGestures, panGesture)
  );

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

  const isPDF = isPdfFile(currentFile);
  const isVideo = isVideoFile(currentFile);
  const isEPS = isEpsFile(currentFile);
  const isSVG = isSvgFile(currentFile);
  const isImage = isImageFile(currentFile) && !isSVG;

  // For EPS files, we need to use thumbnails (server renders them as PNG)
  // SVG files will be rendered directly with SvgUri
  const needsThumbnail = isEPS;

  // Helper function to get proper file URL
  const getFileUrl = (file: AnkaaFile): string => {
    // Use getApiBaseUrl() which properly checks Constants.expoConfig.extra.apiUrl
    const apiUrl = baseUrl || getApiBaseUrl();

    // Check if file has a URL property that might contain localhost
    if (file.url && typeof file.url === 'string' && file.url.startsWith('http')) {
      // Extract path and query string manually for React Native compatibility
      const urlWithoutProtocol = file.url.replace(/^https?:\/\/[^\/]+/, '');
      const correctedUrl = `${apiUrl}${urlWithoutProtocol}`;
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
      apiUrl,
      finalUrl: url
    });
    return url;
  };

  // Helper function to get thumbnail URL
  const getFileThumbnailUrl = (file: AnkaaFile, size: "small" | "medium" | "large" = "medium"): string => {
    // Use getApiBaseUrl() which properly checks Constants.expoConfig.extra.apiUrl
    const apiUrl = baseUrl || getApiBaseUrl();

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
        // Extract the path from the URL manually for React Native compatibility
        const urlWithoutProtocol = file.thumbnailUrl.replace(/^https?:\/\/[^\/]+/, '');
        // Remove any existing query string and add size parameter
        const pathOnly = urlWithoutProtocol.split('?')[0];
        const correctedUrl = `${apiUrl}${pathOnly}?size=${size}`;
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
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? '#1a1a1a' : '#e5e5e5'} translucent />

      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#e5e5e5' }]}>
        {/* Background - respects dark mode */}
        <View style={StyleSheet.flatten([StyleSheet.absoluteFillObject, { backgroundColor: isDark ? '#1a1a1a' : '#e5e5e5' }])} />

        {/* Main Content */}
        <View style={styles.content}>
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              animatedControlsStyle,
              { paddingTop: insets.top + 12 }
            ]}
            pointerEvents={isControlsVisible ? 'auto' : 'none'}
          >
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
              <TouchableOpacity style={styles.headerButton} onPress={handleShare} activeOpacity={0.7}>
                <IconExternalLink size={22} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerButton, { marginLeft: 8 }]} onPress={onClose} activeOpacity={0.7}>
                <IconX size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Content Container - handles different file types */}
          <View style={styles.imageContainer}>
            {isCurrentFilePreviewable ? (
              <>
                {/* PDF Viewer - Full screen inline */}
                {isPDF && (
                  <View style={styles.pdfContainer}>
                    {!Pdf ? (
                      <View style={styles.pdfLoadingOverlay}>
                        <Text style={styles.errorIcon}>📄</Text>
                        <Text style={styles.errorTitle}>PDF não disponível no Expo Go</Text>
                        <Text style={styles.errorText}>Use um development build para visualizar PDFs</Text>
                        <TouchableOpacity style={styles.errorButton} onPress={handleShare} activeOpacity={0.7}>
                          <IconExternalLink size={16} color="#ffffff" />
                          <Text style={styles.errorButtonText}>Abrir com...</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <Pdf
                          key={`pdf-${currentFile.id}-${currentIndex}`}
                          source={{
                            uri: getFileUrl(currentFile),
                            cache: true,
                          }}
                          trustAllCerts={false}
                          onLoadComplete={(numberOfPages: number) => {
                            console.log('[PDF Viewer] Loaded:', numberOfPages, 'pages');
                            setImageLoading(false);
                            setImageError(false);
                          }}
                          onError={(error: Error | any) => {
                            console.error('[PDF Viewer] Error:', error);
                            setImageLoading(false);
                            setImageError(true);
                          }}
                          onLoadProgress={(percent: number) => {
                            console.log('[PDF Viewer] Progress:', Math.round(percent * 100) + '%');
                          }}
                          onPageSingleTap={() => {
                            toggleControls();
                          }}
                          style={styles.pdfViewer}
                          enablePaging={true}
                          horizontal={false}
                          spacing={10}
                          // Zoom configuration - allow much greater zoom for detailed viewing
                          // minScale=1.0 prevents Android from rendering low-res bitmaps (fixes blur)
                          minScale={1.0}
                          maxScale={15}
                          scale={1.0}
                          // Android rendering quality improvements - fixes blur issue
                          enableAntialiasing={true}
                          // Fit width for better initial display and to fix Android blur
                          fitPolicy={0}
                          // Enable double-tap zoom gesture
                          enableDoubleTapZoom={true}
                        />
                        {imageLoading && (
                          <View style={styles.pdfLoadingOverlay}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={styles.loadingText}>Carregando PDF...</Text>
                          </View>
                        )}
                        {imageError && (
                          <View style={styles.pdfLoadingOverlay}>
                            <Text style={styles.errorIcon}>⚠️</Text>
                            <Text style={styles.errorTitle}>Erro ao carregar PDF</Text>
                            <TouchableOpacity style={styles.errorButton} onPress={handleShare} activeOpacity={0.7}>
                              <IconExternalLink size={16} color="#ffffff" />
                              <Text style={styles.errorButtonText}>Abrir com...</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                )}

                {/* Video Player - Inline playback with controls */}
                {isVideo && (
                  <InlineVideoPlayer
                    file={currentFile}
                    fileUrl={getFileUrl(currentFile)}
                    colors={colors}
                    onShare={handleShare}
                    onToggleControls={toggleControls}
                  />
                )}

                {/* Image/SVG Viewer with gestures */}
                {(isImage || isSVG || (isEPS && currentFile.thumbnailUrl)) && (
                  <GestureDetector gesture={composedGesture}>
                    <Animated.View style={styles.imageWrapper}>
                      <Animated.View style={animatedImageStyle}>
                        {isSVG ? (
                          // Render SVG files with SvgUri for crisp vector rendering
                          <View style={[styles.svgContainer, { backgroundColor: isDark ? '#1a1a1a' : '#e5e5e5' }]}>
                            <SvgUri
                              key={`svg-image-${currentFile.id}-${currentIndex}`}
                              uri={getFileUrl(currentFile)}
                              width={SCREEN_WIDTH}
                              height={SCREEN_HEIGHT - 200}
                              onLoad={() => {
                                console.log('✅ [SvgUri] Loaded successfully:', currentFile.filename);
                                handleImageLoad();
                              }}
                              onError={(error: Error) => {
                                console.error('❌ [SvgUri] Failed to load:', {
                                  filename: currentFile.filename,
                                  url: getFileUrl(currentFile),
                                  error: error.message
                                });
                                handleImageError();
                              }}
                            />
                          </View>
                        ) : (
                          // Render regular images (and EPS with thumbnail)
                          <Image
                            key={`main-image-${currentFile.id}-${currentIndex}`}
                            source={{
                              uri: (() => {
                                // For EPS files, use thumbnail (server renders them as PNG)
                                const url = needsThumbnail && currentFile.thumbnailUrl
                                  ? getFileThumbnailUrl(currentFile, "large")
                                  : getFileUrl(currentFile);
                                console.log('🖼️ [MainImage] About to load:', {
                                  filename: currentFile.filename,
                                  isEPS,
                                  isSVG,
                                  needsThumbnail,
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
                                url: needsThumbnail && currentFile.thumbnailUrl
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
                        )}
                      </Animated.View>

                      {/* Loading Overlay */}
                      {imageLoading && (
                        <View style={[styles.imageOverlay, { backgroundColor: isDark ? 'rgba(26, 26, 26, 0.9)' : 'rgba(255, 255, 255, 0.9)' }]}>
                          <ActivityIndicator size="large" color={colors.primary} />
                          <Text style={styles.loadingText}>Carregando...</Text>
                        </View>
                      )}

                      {/* Error Overlay */}
                      {imageError && (
                        <View style={[styles.imageOverlay, { backgroundColor: isDark ? 'rgba(26, 26, 26, 0.9)' : 'rgba(255, 255, 255, 0.9)' }]}>
                          <Text style={styles.errorIcon}>⚠️</Text>
                          <Text style={styles.errorTitle}>Erro ao carregar</Text>
                          <Text style={styles.errorText}>Não foi possível carregar a imagem</Text>
                          <TouchableOpacity style={styles.errorButton} onPress={handleShare} activeOpacity={0.7}>
                            <IconExternalLink size={16} color="#ffffff" />
                            <Text style={styles.errorButtonText}>Abrir com...</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </Animated.View>
                  </GestureDetector>
                )}
              </>
            ) : (
              // Non-previewable files (EPS without thumbnail, etc.)
              <View style={styles.filePreviewContainer}>
                <TouchableOpacity style={styles.filePreviewWrapper} onPress={handleShare} activeOpacity={0.7}>
                  {(isEPS || isSVG) && !currentFile.thumbnailUrl ? (
                    <>
                      <IconVectorBezier size={64} color={colors.primary} />
                      <Text style={styles.filePreviewTitle}>{currentFile.filename}</Text>
                      <Text style={styles.filePreviewSubtitle}>
                        Arquivo {isSVG ? 'SVG' : 'EPS'} • {formatFileSize(currentFile.size)}
                      </Text>
                      <Text style={styles.filePreviewNote}>Toque para abrir com outro app</Text>
                    </>
                  ) : (
                    <>
                      <IconFile size={64} color={colors.mutedForeground} />
                      <Text style={styles.filePreviewTitle}>{currentFile.filename}</Text>
                      <Text style={styles.filePreviewSubtitle}>{formatFileSize(currentFile.size)}</Text>
                      <Text style={styles.filePreviewNote}>Toque para abrir com outro app</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Thumbnail Strip */}
          {isCurrentFilePreviewable && totalImages > 1 && showThumbnailStrip && (
            <Animated.View
              style={[
                styles.thumbnailStrip,
                animatedControlsStyle,
                { paddingBottom: insets.bottom + 12 }
              ]}
              pointerEvents={isControlsVisible ? 'auto' : 'none'}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailScrollContent}>
                {previewableFiles.map(({ file, originalIndex }, _index) => {
                  const isActive = originalIndex === currentIndex;
                  const filePdf = isPdfFile(file);
                  const fileVideo = isVideoFile(file);

                  return (
                    <TouchableOpacity
                      key={file.id}
                      style={StyleSheet.flatten([styles.thumbnailButton, isActive && styles.thumbnailButtonActive])}
                      onPress={() => {
                        setCurrentIndex(originalIndex);
                        showControls();
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                      {/* File type badge for PDFs and videos */}
                      {(filePdf || fileVideo) && (
                        <View style={styles.thumbnailTypeBadge}>
                          <Text style={styles.thumbnailTypeBadgeText}>
                            {filePdf ? 'PDF' : 'VID'}
                          </Text>
                        </View>
                      )}
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
    paddingBottom: 12,
    backgroundColor: "#1a1a1a", // neutral-900 - darker for better dark mode
    borderBottomWidth: 1,
    borderBottomColor: "#333333", // neutral-750
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
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  fileSize: {
    color: "#9ca3af",
    fontSize: 12,
  },
  imageCounter: {
    backgroundColor: "#333333", // neutral-750 - darker for better dark mode
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageCounterText: {
    color: "#d4d4d4", // neutral-250
    fontSize: 10,
    fontWeight: "600",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333333", // neutral-750 - darker for better dark mode
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#444444", // neutral-650
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
  svgContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e5e5", // neutral-200 - matches thumbnail and modal background
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  pdfViewer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  pdfLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    gap: 16,
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  videoPreviewWrapper: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 32,
    backgroundColor: "#262626",
    borderRadius: 16,
    padding: 32,
    maxWidth: SCREEN_WIDTH - 64,
    borderWidth: 1,
    borderColor: "#404040",
  },
  videoErrorContainer: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 32,
    backgroundColor: "#262626",
    borderRadius: 16,
    padding: 32,
    maxWidth: SCREEN_WIDTH - 64,
    borderWidth: 1,
    borderColor: "#404040",
  },
  inlineVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 200,
  },
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    gap: 16,
  },
  videoCenterControl: {
    position: "absolute",
    padding: 16,
    borderRadius: 50,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  videoBottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  videoProgressContainer: {
    marginBottom: 12,
  },
  videoProgressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
  },
  videoProgressFill: {
    height: "100%",
    backgroundColor: "#15803d",
    borderRadius: 2,
  },
  videoTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  videoTimeText: {
    color: "#ffffff",
    fontSize: 12,
  },
  videoControlButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  videoControlBtn: {
    padding: 8,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    color: "#374151",
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
    color: "#1f2937",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  errorText: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  errorButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#15803d", // green-700 (primary)
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: "#ffffff",
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 32,
    maxWidth: SCREEN_WIDTH - 64,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filePreviewIcon: {
    fontSize: 72,
  },
  filePreviewTitle: {
    color: "#1f2937",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  filePreviewSubtitle: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "center",
  },
  filePreviewNote: {
    color: "#9ca3af",
    fontSize: 12,
    textAlign: "center",
  },
  fileActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#15803d", // green-700 (primary)
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  fileActionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  bottomControls: {
    backgroundColor: "#1a1a1a", // neutral-900 - darker for better dark mode
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#333333", // neutral-750
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  zoomControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
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
    gap: 12,
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#333333", // neutral-750 - darker for better dark mode
    borderWidth: 1,
    borderColor: "#444444", // neutral-650
  },
  controlButtonPrimary: {
    backgroundColor: "#15803d", // green-700 (primary)
    borderColor: "#15803d",
  },
  controlButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#d4d4d4", // neutral-250
  },
  controlButtonTextPrimary: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  controlButtonDisabled: {
    backgroundColor: "#f9fafb",
    opacity: 0.5,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  zoomText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "center",
  },
  thumbnailStrip: {
    backgroundColor: "#1a1a1a", // neutral-900 - darker for better dark mode
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#333333", // neutral-750
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
    borderColor: "#444444", // neutral-650 - darker for better dark mode
    backgroundColor: "#fafafa", // neutral-50 - same as light mode for consistent thumbnail bg
  },
  thumbnailButtonActive: {
    borderColor: "#15803d", // green-700 (primary)
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
    backgroundColor: "rgba(21, 128, 61, 0.1)", // green-700 with opacity
  },
  thumbnailTypeBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  thumbnailTypeBadgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "700",
  },
});
