/**
 * Hook for managing screen orientation in file viewer components
 *
 * Unlocks screen orientation when the file viewer is opened,
 * allowing users to rotate their device for better viewing.
 * Locks back to portrait when the file viewer is closed.
 *
 * Works on both iOS and Android with proper cleanup.
 */

import { useEffect, useCallback, useRef } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

interface UseFileViewerOrientationOptions {
  /** Whether the file viewer is currently visible/open */
  isOpen: boolean;
  /**
   * Whether to allow all orientations or just landscape additions
   * Default: 'all' - allows portrait and landscape
   */
  allowedOrientations?: 'all' | 'landscape-only';
}

/**
 * Manages screen orientation for file viewer components
 *
 * @example
 * ```tsx
 * function FileViewerModal({ visible, onClose }) {
 *   useFileViewerOrientation({ isOpen: visible });
 *
 *   return <Modal visible={visible}>...</Modal>;
 * }
 * ```
 */
export function useFileViewerOrientation({
  isOpen,
  allowedOrientations = 'all',
}: UseFileViewerOrientationOptions) {
  const hasUnlockedRef = useRef(false);

  // Unlock orientation when viewer opens
  const unlockOrientation = useCallback(async () => {
    try {
      const orientationLock = allowedOrientations === 'landscape-only'
        ? ScreenOrientation.OrientationLock.LANDSCAPE
        : ScreenOrientation.OrientationLock.ALL;

      await ScreenOrientation.lockAsync(orientationLock);
      hasUnlockedRef.current = true;

      if (__DEV__) {
        console.log('[useFileViewerOrientation] Unlocked orientation:', orientationLock);
      }
    } catch (error) {
      // Silently fail - orientation lock may not be supported in all environments
      if (__DEV__) {
        console.warn('[useFileViewerOrientation] Failed to unlock orientation:', error);
      }
    }
  }, [allowedOrientations]);

  // Lock back to portrait when viewer closes
  const lockToPortrait = useCallback(async () => {
    if (!hasUnlockedRef.current) return;

    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      hasUnlockedRef.current = false;

      if (__DEV__) {
        console.log('[useFileViewerOrientation] Locked back to portrait');
      }
    } catch (error) {
      // Silently fail
      if (__DEV__) {
        console.warn('[useFileViewerOrientation] Failed to lock orientation:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      unlockOrientation();
    } else {
      lockToPortrait();
    }

    // Cleanup: ensure we lock back to portrait when component unmounts
    return () => {
      if (hasUnlockedRef.current) {
        // Use void to handle the promise without awaiting in cleanup
        void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT)
          .then(() => {
            hasUnlockedRef.current = false;
          })
          .catch(() => {
            // Ignore errors during cleanup
          });
      }
    };
  }, [isOpen, unlockOrientation, lockToPortrait]);

  // Return utilities for manual control if needed
  return {
    /** Manually unlock orientation */
    unlock: unlockOrientation,
    /** Manually lock to portrait */
    lockPortrait: lockToPortrait,
    /** Whether orientation is currently unlocked */
    isUnlocked: hasUnlockedRef.current,
  };
}

/**
 * Locks the screen orientation to portrait
 * Useful for screens that should always be in portrait mode
 */
export async function lockToPortrait(): Promise<void> {
  try {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
  } catch (error) {
    if (__DEV__) {
      console.warn('[lockToPortrait] Failed:', error);
    }
  }
}

/**
 * Unlocks the screen orientation to allow all orientations
 */
export async function unlockOrientation(): Promise<void> {
  try {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.ALL);
  } catch (error) {
    if (__DEV__) {
      console.warn('[unlockOrientation] Failed:', error);
    }
  }
}

export default useFileViewerOrientation;
