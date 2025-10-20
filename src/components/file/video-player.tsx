/**
 * Video Player Component for Mobile
 * Native video playback with controls
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import {
  IconX,
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolumeOff,
  IconDownload,
  IconShare,
  IconMaximize,
} from '@tabler/icons-react-native';
import type { File as AnkaaFile } from '../../types';
import { getFileUrl } from '../../utils/file-viewer-utils';
import { showToast } from '../ui/toast';

export interface VideoPlayerProps {
  file: AnkaaFile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: (file: AnkaaFile) => Promise<void>;
  onShare?: (file: AnkaaFile) => Promise<void>;
  baseUrl?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  file,
  open,
  onOpenChange,
  onDownload,
  onShare,
  baseUrl,
}) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  const videoUrl = getFileUrl(file, baseUrl);

  // Auto-hide controls after 3 seconds
  const resetHideControlsTimer = useCallback(() => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }

    setControlsVisible(true);

    hideControlsTimeout.current = setTimeout(() => {
      if (status && 'isPlaying' in status && status.isPlaying) {
        setControlsVisible(false);
      }
    }, 3000);
  }, [status]);

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current || !status) return;

    try {
      if ('isPlaying' in status && status.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } catch (err) {
      console.error('[Video Player] Toggle play/pause error:', err);
    }
  }, [status]);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    } catch (err) {
      console.error('[Video Player] Toggle mute error:', err);
    }
  }, [isMuted]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      if (isFullscreen) {
        await videoRef.current.dismissFullscreenPlayer();
      } else {
        await videoRef.current.presentFullscreenPlayer();
      }
      setIsFullscreen(!isFullscreen);
    } catch (err) {
      console.error('[Video Player] Toggle fullscreen error:', err);
    }
  }, [isFullscreen]);

  // Handle download
  const handleDownload = useCallback(async () => {
    if (onDownload) {
      try {
        await onDownload(file);
      } catch (err) {
        console.error('[Video Player] Download error:', err);
      }
    }
  }, [file, onDownload]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (onShare) {
      try {
        await onShare(file);
      } catch (err) {
        console.error('[Video Player] Share error:', err);
      }
    }
  }, [file, onShare]);

  // Handle status update
  const handlePlaybackStatusUpdate = useCallback((newStatus: AVPlaybackStatus) => {
    setStatus(newStatus);

    if (newStatus.isLoaded) {
      setLoading(false);
      setError(null);

      if (newStatus.didJustFinish) {
        setControlsVisible(true);
        if (hideControlsTimeout.current) {
          clearTimeout(hideControlsTimeout.current);
        }
      }
    } else if ('error' in newStatus && newStatus.error) {
      setLoading(false);
      setError('Erro ao carregar vídeo. Tente novamente ou baixe o arquivo.');
      showToast({
        message: 'Erro ao carregar vídeo',
        type: 'error',
      });
    }
  }, []);

  // Handle screen press - toggle controls
  const handleScreenPress = useCallback(() => {
    if (error) return;

    setControlsVisible(prev => !prev);
    resetHideControlsTimer();
  }, [error, resetHideControlsTimer]);

  // Close modal
  const handleClose = useCallback(async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.stopAsync();
        await videoRef.current.unloadAsync();
      } catch (err) {
        console.error('[Video Player] Error stopping video:', err);
      }
    }

    setLoading(true);
    setError(null);
    setControlsVisible(true);
    setIsMuted(false);
    setIsFullscreen(false);

    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }

    onOpenChange(false);
  }, [onOpenChange]);

  // Format duration
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, []);

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
            <Pressable onPress={handleClose} style={styles.iconButton}>
              <IconX size={24} color="#fff" />
            </Pressable>

            <Text style={styles.filename} numberOfLines={1}>
              {file.filename}
            </Text>

            <View style={styles.headerActions}>
              {onDownload && (
                <Pressable onPress={handleDownload} style={styles.iconButton}>
                  <IconDownload size={24} color="#fff" />
                </Pressable>
              )}
              {onShare && (
                <Pressable onPress={handleShare} style={styles.iconButton}>
                  <IconShare size={24} color="#fff" />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Video View */}
        <Pressable style={styles.videoContainer} onPress={handleScreenPress}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Erro ao Carregar Vídeo</Text>
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
            <Video
              ref={videoRef}
              source={{ uri: videoUrl }}
              rate={1.0}
              volume={1.0}
              isMuted={isMuted}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping={false}
              useNativeControls={false} // We use custom controls
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              style={styles.video}
            />
          )}
        </Pressable>

        {/* Loading Indicator */}
        {loading && !error && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={styles.loadingText}>Carregando vídeo...</Text>
          </View>
        )}

        {/* Controls Overlay */}
        {controlsVisible && status && 'isLoaded' in status && status.isLoaded && !error && (
          <View style={styles.controlsOverlay}>
            {/* Center Play/Pause Button */}
            <Pressable
              onPress={togglePlayPause}
              style={styles.centerControl}
            >
              {'isPlaying' in status && status.isPlaying ? (
                <IconPlayerPause size={64} color="#fff" />
              ) : (
                <IconPlayerPlay size={64} color="#fff" />
              )}
            </Pressable>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              {/* Progress Bar */}
              {status.durationMillis && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${(status.positionMillis / status.durationMillis) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>
                      {formatDuration(status.positionMillis || 0)}
                    </Text>
                    <Text style={styles.timeText}>
                      {formatDuration(status.durationMillis)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Control Buttons */}
              <View style={styles.controlButtons}>
                <Pressable onPress={toggleMute} style={styles.controlButton}>
                  {isMuted ? (
                    <IconVolumeOff size={24} color="#fff" />
                  ) : (
                    <IconVolume size={24} color="#fff" />
                  )}
                </Pressable>

                <Pressable onPress={togglePlayPause} style={styles.controlButton}>
                  {'isPlaying' in status && status.isPlaying ? (
                    <IconPlayerPause size={32} color="#fff" />
                  ) : (
                    <IconPlayerPlay size={32} color="#fff" />
                  )}
                </Pressable>

                <Pressable onPress={toggleFullscreen} style={styles.controlButton}>
                  <IconMaximize size={24} color="#fff" />
                </Pressable>
              </View>
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
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  filename: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerControl: {
    padding: 16,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066cc',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
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

export default VideoPlayer;
