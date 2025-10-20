/**
 * Video Player Wrapper - 100% Safe for Expo Go
 * Only attempts to load native video player if NOT in Expo Go
 */

import React, { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import type { File as AnkaaFile } from '../../types';
import { VideoPlayerProps } from './video-player';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Lazy load component reference
let VideoPlayerComponent: React.ComponentType<VideoPlayerProps> | null = null;
let loadAttempted = false;

export const VideoPlayerWrapper: React.FC<VideoPlayerProps> = (props) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Skip loading entirely in Expo Go
    if (isExpoGo) {
      console.log('[Video Wrapper] Running in Expo Go - video player disabled');
      setIsReady(true);
      return;
    }

    // Only attempt to load once
    if (loadAttempted) {
      setIsReady(true);
      return;
    }

    loadAttempted = true;

    // Try to load the native video module (only in dev builds)
    const loadVideoPlayer = async () => {
      try {
        const module = await import('./video-player');
        VideoPlayerComponent = module.default;
        console.log('[Video Wrapper] Native video player loaded successfully');
      } catch (error) {
        console.log('[Video Wrapper] Native video player not available:', error);
        VideoPlayerComponent = null;
      } finally {
        setIsReady(true);
      }
    };

    loadVideoPlayer();
  }, []);

  // Don't render until we've checked availability
  if (!isReady) {
    return null;
  }

  // If modal is opening
  if (props.open) {
    // In Expo Go or no native player available - use fallback
    if (isExpoGo || !VideoPlayerComponent) {
      // Close the modal immediately
      props.onOpenChange(false);

      // Show alert and share
      setTimeout(() => {
        Alert.alert(
          'Reprodução de Vídeo',
          isExpoGo
            ? 'O player de vídeo não está disponível no Expo Go. Use um development build para reproduzir vídeos dentro do app.\n\nAbrindo com aplicativo externo...'
            : 'O player de vídeo não está disponível. Abrindo com aplicativo externo...',
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

    // Native player available - use it!
    return <VideoPlayerComponent {...props} />;
  }

  return null;
};

export default VideoPlayerWrapper;
