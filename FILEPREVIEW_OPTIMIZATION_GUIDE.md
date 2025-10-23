# File Preview Modal - Comprehensive Optimization Guide

This document provides detailed optimization strategies for `/src/components/file/file-preview-modal.tsx` to achieve a butter-smooth, native-like experience.

## Table of Contents
1. [Performance Optimizations](#performance-optimizations)
2. [User Experience Improvements](#user-experience-improvements)
3. [Memory Management](#memory-management)
4. [Native-like Features](#native-like-features)
5. [Edge Cases & Error Handling](#edge-cases--error-handling)
6. [Implementation Code](#implementation-code)

---

## Performance Optimizations

### 1. Image Loading & Caching

**Current Issues:**
- `cache: 'reload'` forces re-download every time
- No preloading of adjacent images
- No progressive image loading
- Thumbnails reload unnecessarily

**Optimizations:**

```typescript
// Add image cache tracking
const imageCache = useRef<Map<string, boolean>>(new Map());

// Optimize image loading with proper caching
<Image
  source={{
    uri: imageUrl,
    cache: imageCache.current.has(currentFile.id) ? 'force-cache' : 'default',
  }}
  progressiveRenderingEnabled={true}
  fadeDuration={200}
  onLoad={() => {
    imageCache.current.set(currentFile.id, true);
    handleImageLoad();
  }}
/>

// Preload adjacent images for smooth navigation
useEffect(() => {
  if (!isCurrentFilePreviewable || totalImages <= 1) return;

  const preloadImages = () => {
    const nextIndex = (currentImageIndex + 1) % totalImages;
    const prevIndex = (currentImageIndex - 1 + totalImages) % totalImages;

    const nextFile = previewableFiles[nextIndex]?.file;
    const prevFile = previewableFiles[prevIndex]?.file;

    if (nextFile && !imageCache.current.has(nextFile.id)) {
      Image.prefetch(getFileUrl(nextFile));
    }
    if (prevFile && !imageCache.current.has(prevFile.id)) {
      Image.prefetch(getFileUrl(prevFile));
    }
  };

  // Delay to prioritize current image
  const timer = setTimeout(preloadImages, 500);
  return () => clearTimeout(timer);
}, [currentImageIndex, totalImages]);
```

### 2. React Hooks Optimization

**Current Issues:**
- Multiple useEffect hooks that could be combined
- Non-memoized callbacks recreated on every render
- Expensive computations run on every render

**Optimizations:**

```typescript
// Import useMemo and memo
import React, { useMemo, memo } from 'react';

// Memoize expensive computations
const previewableFiles = useMemo(() =>
  files
    .map((file, index) => ({ file, originalIndex: index }))
    .filter(({ file }) => isPreviewableFile(file)),
  [files]
);

// Memoize URL generation functions
const getFileUrl = useCallback((file: AnkaaFile): string => {
  const apiUrl = baseUrl || (global as any).__ANKAA_API_URL__ || "http://localhost:3030";

  if (file.url && file.url.startsWith('http')) {
    const urlObj = new URL(file.url);
    return `${apiUrl}${urlObj.pathname}${urlObj.search}`;
  }

  return `${apiUrl}/files/serve/${file.id}`;
}, [baseUrl]);

const getFileThumbnailUrl = useCallback((file: AnkaaFile, size: "small" | "medium" | "large" = "medium"): string => {
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
}, [baseUrl]);

// Memoize thumbnail components
const ThumbnailImage = memo(({ file, isActive, onPress, getFileThumbnailUrl }) => (
  <TouchableOpacity
    style={[styles.thumbnailButton, isActive && styles.thumbnailButtonActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Image
      source={{
        uri: getFileThumbnailUrl(file, "small"),
        cache: 'force-cache',
      }}
      style={styles.thumbnailImage}
      resizeMode="cover"
    />
    {isActive && <View style={styles.thumbnailActiveOverlay} />}
  </TouchableOpacity>
));
```

### 3. Animated Values & Worklets Optimization

**Current Issues:**
- No animation cancellation on unmount
- Suboptimal spring configurations
- Missing worklet directives in some places

**Optimizations:**

```typescript
// Add optimized spring configurations at top of file
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

const FAST_SPRING_CONFIG = {
  damping: 25,
  stiffness: 300,
  mass: 0.3,
};

const DECAY_CONFIG = {
  deceleration: 0.998,
  velocityFactor: 1,
};

// Cleanup animations on unmount
useEffect(() => {
  return () => {
    cancelAnimation(scale);
    cancelAnimation(translateX);
    cancelAnimation(translateY);
    cancelAnimation(swipeTranslateX);
    cancelAnimation(opacity);
  };
}, []);

// Use optimized configs
scale.value = withSpring(1, SPRING_CONFIG);
translateX.value = withSpring(0, FAST_SPRING_CONFIG);
```

### 4. ScrollView Optimization for Thumbnails

**Current Issues:**
- All thumbnails render at once
- No virtualization for large lists
- Missing performance props

**Optimizations:**

```typescript
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.thumbnailScrollContent}
  removeClippedSubviews={true}
  maxToRenderPerBatch={5}
  windowSize={5}
  initialNumToRender={5}
>
  {previewableFiles.map(({ file, originalIndex }) => (
    <ThumbnailImage
      key={file.id}
      file={file}
      isActive={originalIndex === currentIndex}
      onPress={() => {
        setCurrentIndex(originalIndex);
        showControls();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      getFileThumbnailUrl={getFileThumbnailUrl}
    />
  ))}
</ScrollView>
```

---

## User Experience Improvements

### 1. Haptic Feedback Timing

**Add haptics at strategic moments:**

```typescript
// On navigation
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// On zoom in/out
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// On double-tap zoom
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// On successful download
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// On swipe threshold reached
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```

### 2. Smooth Transitions Between Images

**Current Issues:**
- Abrupt image changes
- No crossfade animation
- Loading state appears jarring

**Optimizations:**

```typescript
// Add transition opacity
const imageOpacity = useSharedValue(1);

// Fade out before changing, fade in after
const changeImage = useCallback((newIndex: number) => {
  imageOpacity.value = withTiming(0, { duration: 150 }, () => {
    runOnJS(setCurrentIndex)(newIndex);
    imageOpacity.value = withTiming(1, { duration: 150 });
  });
}, []);

// Apply to animated style
const animatedImageStyle = useAnimatedStyle(() => ({
  transform: [
    { translateX: translateX.value + swipeTranslateX.value },
    { translateY: translateY.value },
    { scale: scale.value },
  ],
  opacity: opacity.value * imageOpacity.value,
}));
```

### 3. Loading States & Progressive Loading

**Optimizations:**

```typescript
// Progressive loading with blur-up effect
const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
const [fullImageLoaded, setFullImageLoaded] = useState(false);

// Show thumbnail first, then full image
{!fullImageLoaded && (
  <Image
    source={{ uri: getFileThumbnailUrl(currentFile, "small") }}
    style={[styles.image, { position: 'absolute' }]}
    blurRadius={2}
    onLoad={() => setThumbnailLoaded(true)}
  />
)}

<Image
  source={{ uri: getFileUrl(currentFile) }}
  style={styles.image}
  onLoad={() => setFullImageLoaded(true)}
  progressiveRenderingEnabled={true}
/>

// Smooth loading indicator fade
<Animated.View
  style={[
    styles.imageOverlay,
    { opacity: imageLoading ? 1 : 0 }
  ]}
>
  <ActivityIndicator size="large" color={colors.primary} />
</Animated.View>
```

---

## Memory Management

### 1. Resource Cleanup

**Add comprehensive cleanup:**

```typescript
useEffect(() => {
  return () => {
    // Cancel animations
    cancelAnimation(scale);
    cancelAnimation(translateX);
    cancelAnimation(translateY);
    cancelAnimation(swipeTranslateX);
    cancelAnimation(opacity);

    // Clear timeouts
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    // Clear cache
    imageCache.current.clear();

    // Abort any pending downloads
    if (downloadAbortController.current) {
      downloadAbortController.current.abort();
    }
  };
}, []);
```

### 2. Efficient Large Image Handling

**Optimizations:**

```typescript
// Check image size and adjust loading strategy
const isLargeImage = (file: AnkaaFile) => {
  return file.size > 5 * 1024 * 1024; // 5MB
};

// For large images, use lower quality initially
const getOptimalImageUrl = (file: AnkaaFile) => {
  if (isLargeImage(file)) {
    return getFileThumbnailUrl(file, "medium");
  }
  return getFileUrl(file);
};

// Add download progress for large files
const [downloadProgress, setDownloadProgress] = useState(0);

const downloadCallback = (downloadProgress: FileSystem.DownloadProgressData) => {
  const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
  setDownloadProgress(progress);
};
```

### 3. Thumbnail Strip Memory Management

**Optimizations:**

```typescript
// Only keep thumbnails for visible images + buffer
const THUMBNAIL_BUFFER = 3;

const visibleThumbnails = useMemo(() => {
  const start = Math.max(0, currentImageIndex - THUMBNAIL_BUFFER);
  const end = Math.min(totalImages, currentImageIndex + THUMBNAIL_BUFFER + 1);
  return previewableFiles.slice(start, end);
}, [currentImageIndex, totalImages, previewableFiles]);
```

---

## Native-like Features

### 1. Double-Tap to Zoom at Specific Point

**Add TapGestureHandler:**

```typescript
import { TapGestureHandler } from 'react-native-gesture-handler';

const DOUBLE_TAP_DELAY = 300;
const lastTapTimestamp = useSharedValue(0);

const handleDoubleTap = useCallback((x: number, y: number) => {
  'worklet';
  const currentScale = scale.value;

  if (currentScale > 1.5) {
    // Zoom out
    scale.value = withSpring(1, SPRING_CONFIG);
    translateX.value = withSpring(0, SPRING_CONFIG);
    translateY.value = withSpring(0, SPRING_CONFIG);
  } else {
    // Zoom in to 2.5x at tap point
    const targetScale = 2.5;
    const focal = {
      x: x - SCREEN_WIDTH / 2,
      y: y - SCREEN_HEIGHT / 2,
    };

    scale.value = withSpring(targetScale, SPRING_CONFIG);
    translateX.value = withSpring(-focal.x * (targetScale - 1), SPRING_CONFIG);
    translateY.value = withSpring(-focal.y * (targetScale - 1), SPRING_CONFIG);
  }

  runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
  runOnJS(showControls)();
}, [showControls]);

const tapGestureHandler = useCallback((event: any) => {
  'worklet';
  if (event.nativeEvent.state === State.END) {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimestamp.value;

    if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
      // Double tap
      const x = event.nativeEvent.x;
      const y = event.nativeEvent.y;
      handleDoubleTap(x, y);
      lastTapTimestamp.value = 0;
    } else {
      // Single tap
      lastTapTimestamp.value = now;
      runOnJS(showControls)();
    }
  }
}, [handleDoubleTap]);

// Wrap in TapGestureHandler
<TapGestureHandler onHandlerStateChange={tapGestureHandler}>
  <Animated.View style={styles.imageWrapper}>
    {/* Image content */}
  </Animated.View>
</TapGestureHandler>
```

### 2. Gesture Momentum & Spring Physics

**Add velocity-based momentum:**

```typescript
const panGestureHandler = useCallback((event: any) => {
  'worklet';
  // ... existing code ...

  if (event.nativeEvent.state === State.END) {
    if (scale.value > 1) {
      const velocityX = event.nativeEvent.velocityX;
      const velocityY = event.nativeEvent.velocityY;

      const maxTranslateX = (SCREEN_WIDTH * scale.value - SCREEN_WIDTH) / 2;
      const maxTranslateY = (SCREEN_HEIGHT * scale.value - SCREEN_HEIGHT) / 2;

      // Apply momentum with decay
      if (Math.abs(velocityX) > 500 || Math.abs(velocityY) > 500) {
        translateX.value = withDecay({
          velocity: velocityX,
          deceleration: 0.998,
          clamp: [-maxTranslateX, maxTranslateX],
        });

        translateY.value = withDecay({
          velocity: velocityY,
          deceleration: 0.998,
          clamp: [-maxTranslateY, maxTranslateY],
        });
      }
    }
  }
}, []);
```

### 3. Smooth Opacity Animations During Swipes

**Add resistance and smooth fade:**

```typescript
const panGestureHandler = useCallback((event: any) => {
  'worklet';
  // ... existing code ...

  if (event.nativeEvent.state === State.ACTIVE) {
    if (scale.value <= 1 && enableSwipeNavigation) {
      const translation = event.nativeEvent.translationX;

      // Add resistance for overscroll effect
      const resistance = Math.abs(translation) > SCREEN_WIDTH / 2 ? 0.5 : 1;
      swipeTranslateX.value = translation * resistance;

      // Smooth opacity fade based on translation
      const fadeProgress = Math.abs(translation) / (SCREEN_WIDTH / 2);
      opacity.value = interpolate(
        fadeProgress,
        [0, 1],
        [1, 0.6],
        Extrapolate.CLAMP
      );
    }
  }
}, []);
```

---

## Edge Cases & Error Handling

### 1. Very Large Images

**Add size checks and fallbacks:**

```typescript
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const handleImageError = useCallback((error: any) => {
  console.error('Image load error:', error);

  if (currentFile && currentFile.size > MAX_IMAGE_SIZE) {
    Alert.alert(
      "Imagem muito grande",
      "Esta imagem é muito grande para visualização. Deseja fazer o download?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Download", onPress: handleDownload }
      ]
    );
  } else {
    setImageError(true);
  }

  setImageLoading(false);
}, [currentFile, handleDownload]);
```

### 2. Network Issues Handling

**Add retry logic and offline detection:**

```typescript
import NetInfo from '@react-native-community/netinfo';

const [retryCount, setRetryCount] = useState(0);
const MAX_RETRIES = 3;

const handleImageError = useCallback(async () => {
  const networkState = await NetInfo.fetch();

  if (!networkState.isConnected) {
    Alert.alert(
      "Sem conexão",
      "Verifique sua conexão com a internet e tente novamente."
    );
    setImageError(true);
    return;
  }

  if (retryCount < MAX_RETRIES) {
    setRetryCount(prev => prev + 1);
    setImageLoading(true);

    // Force reload after delay
    setTimeout(() => {
      setImageKey(prev => prev + 1);
    }, 1000);
  } else {
    setImageError(true);
  }
}, [retryCount]);

// Add retry button in error overlay
{imageError && (
  <View style={styles.imageOverlay}>
    <Text style={styles.errorIcon}>⚠️</Text>
    <Text style={styles.errorTitle}>Erro ao carregar</Text>
    <Text style={styles.errorText}>
      {retryCount >= MAX_RETRIES
        ? "Não foi possível carregar a imagem"
        : "Tentando novamente..."}
    </Text>
    {retryCount >= MAX_RETRIES && (
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => {
          setRetryCount(0);
          setImageError(false);
          setImageLoading(true);
        }}
      >
        <Text style={styles.retryButtonText}>Tentar Novamente</Text>
      </TouchableOpacity>
    )}
  </View>
)}
```

### 3. Proper Error Recovery

**Add graceful degradation:**

```typescript
const [fallbackMode, setFallbackMode] = useState(false);

const handleImageError = useCallback(() => {
  if (!fallbackMode && currentFile.thumbnailUrl) {
    // Try thumbnail as fallback
    setFallbackMode(true);
    setImageLoading(true);
  } else {
    // Show error state
    setImageError(true);
    setImageLoading(false);
  }
}, [fallbackMode, currentFile]);

// Use fallback URL
const imageUrl = fallbackMode && currentFile.thumbnailUrl
  ? getFileThumbnailUrl(currentFile, "large")
  : getFileUrl(currentFile);
```

---

## Complete Implementation Example

Here's a complete implementation of the optimized gesture handlers:

```typescript
// Optimized Pinch Gesture Handler
const pinchGestureHandler = useCallback((event: any) => {
  'worklet';
  if (event.nativeEvent.state === State.BEGAN) {
    focalX.value = event.nativeEvent.focalX;
    focalY.value = event.nativeEvent.focalY;
    baseTranslateX.value = translateX.value;
    baseTranslateY.value = translateY.value;
  } else if (event.nativeEvent.state === State.ACTIVE) {
    if (!enablePinchZoom) return;

    const eventScale = event.nativeEvent.scale;
    const newScale = Math.max(MIN_ZOOM, Math.min(eventScale * scale.value, MAX_ZOOM));
    scale.value = newScale;

    // Proper focal point translation
    if (newScale > 1) {
      const focalPointX = focalX.value - SCREEN_WIDTH / 2;
      const focalPointY = focalY.value - SCREEN_HEIGHT / 2;

      translateX.value = baseTranslateX.value + focalPointX * (1 - eventScale);
      translateY.value = baseTranslateY.value + focalPointY * (1 - eventScale);
    }
  } else if (event.nativeEvent.state === State.END) {
    // Snap to boundaries
    if (scale.value < 1) {
      scale.value = withSpring(1, SPRING_CONFIG);
      translateX.value = withSpring(0, SPRING_CONFIG);
      translateY.value = withSpring(0, SPRING_CONFIG);
    } else if (scale.value > MAX_ZOOM) {
      scale.value = withSpring(MAX_ZOOM, SPRING_CONFIG);
    }

    // Clamp translations
    const maxTranslateX = (SCREEN_WIDTH * scale.value - SCREEN_WIDTH) / 2;
    const maxTranslateY = (SCREEN_HEIGHT * scale.value - SCREEN_HEIGHT) / 2;

    const clampedX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX.value));
    const clampedY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY.value));

    if (clampedX !== translateX.value || clampedY !== translateY.value) {
      translateX.value = withSpring(clampedX, SPRING_CONFIG);
      translateY.value = withSpring(clampedY, SPRING_CONFIG);
    }

    baseTranslateX.value = translateX.value;
    baseTranslateY.value = translateY.value;
    runOnJS(showControls)();
  }
}, [enablePinchZoom, showControls]);

// Optimized Pan Gesture Handler
const panGestureHandler = useCallback((event: any) => {
  'worklet';
  if (event.nativeEvent.state === State.BEGAN) {
    cancelAnimation(translateX);
    cancelAnimation(translateY);
    cancelAnimation(swipeTranslateX);

    baseTranslateX.value = translateX.value;
    baseTranslateY.value = translateY.value;
    runOnJS(showControls)();
  } else if (event.nativeEvent.state === State.ACTIVE) {
    if (scale.value > 1) {
      translateX.value = baseTranslateX.value + event.nativeEvent.translationX;
      translateY.value = baseTranslateY.value + event.nativeEvent.translationY;
    } else if (enableSwipeNavigation) {
      const translation = event.nativeEvent.translationX;
      const resistance = Math.abs(translation) > SCREEN_WIDTH / 2 ? 0.5 : 1;
      swipeTranslateX.value = translation * resistance;

      const fadeProgress = Math.abs(translation) / (SCREEN_WIDTH / 2);
      opacity.value = interpolate(fadeProgress, [0, 1], [1, 0.6], Extrapolate.CLAMP);
    }
  } else if (event.nativeEvent.state === State.END) {
    if (scale.value > 1) {
      const velocityX = event.nativeEvent.velocityX;
      const velocityY = event.nativeEvent.velocityY;

      const maxTranslateX = (SCREEN_WIDTH * scale.value - SCREEN_WIDTH) / 2;
      const maxTranslateY = (SCREEN_HEIGHT * scale.value - SCREEN_HEIGHT) / 2;

      if (Math.abs(velocityX) > 500 || Math.abs(velocityY) > 500) {
        translateX.value = withDecay({
          velocity: velocityX,
          deceleration: 0.998,
          clamp: [-maxTranslateX, maxTranslateX],
        });

        translateY.value = withDecay({
          velocity: velocityY,
          deceleration: 0.998,
          clamp: [-maxTranslateY, maxTranslateY],
        });
      } else {
        const clampedX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX.value));
        const clampedY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY.value));

        translateX.value = withSpring(clampedX, SPRING_CONFIG);
        translateY.value = withSpring(clampedY, SPRING_CONFIG);
      }

      baseTranslateX.value = translateX.value;
      baseTranslateY.value = translateY.value;
    } else if (enableSwipeNavigation) {
      const translation = event.nativeEvent.translationX;
      const velocity = event.nativeEvent.velocityX;
      const shouldNavigate = Math.abs(translation) > SWIPE_THRESHOLD || Math.abs(velocity) > 1000;

      if (shouldNavigate) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);

        if (translation > 0) {
          runOnJS(handlePrevious)();
        } else {
          runOnJS(handleNext)();
        }
      }

      swipeTranslateX.value = withSpring(0, FAST_SPRING_CONFIG);
      opacity.value = withSpring(1, FAST_SPRING_CONFIG);
    }
  }
}, [enableSwipeNavigation, handlePrevious, handleNext, showControls]);
```

---

## Performance Checklist

- [ ] Image caching implemented with `force-cache`
- [ ] Adjacent images preloaded
- [ ] Progressive image loading enabled
- [ ] Thumbnail components memoized
- [ ] URL generation functions memoized with `useCallback`
- [ ] Expensive computations wrapped in `useMemo`
- [ ] Animation cleanup on unmount
- [ ] Optimized spring configurations used
- [ ] ScrollView optimization props added
- [ ] Haptic feedback at appropriate moments
- [ ] Double-tap to zoom implemented
- [ ] Velocity-based momentum added
- [ ] Smooth opacity animations during swipes
- [ ] Proper error handling and retries
- [ ] Network state detection
- [ ] Large image handling
- [ ] Memory cleanup implemented

---

## Testing Recommendations

1. **Performance Testing:**
   - Test with 50+ images to ensure smooth scrolling
   - Test with very large images (10MB+)
   - Test rapid gesture interactions
   - Monitor memory usage during extended use

2. **Network Testing:**
   - Test with slow 3G network
   - Test with intermittent connectivity
   - Test offline behavior
   - Test image loading failures

3. **Gesture Testing:**
   - Test pinch-zoom at various speeds
   - Test double-tap at different locations
   - Test swipe navigation with momentum
   - Test multi-touch interactions

4. **Device Testing:**
   - Test on low-end devices
   - Test on different screen sizes
   - Test with different safe area insets
   - Test landscape orientation

---

## Additional Resources

- [React Native Performance](https://reactnative.dev/docs/performance)
- [Reanimated 2 Best Practices](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/best-practices/)
- [Image Optimization Guide](https://reactnative.dev/docs/image#cache-control-ios-only)
- [Gesture Handler Documentation](https://docs.swmansion.com/react-native-gesture-handler/)

---

## Summary

This optimization guide covers:

1. **Performance**: Image caching, preloading, memoization, and animation optimization
2. **UX**: Haptic feedback, smooth transitions, progressive loading, and loading states
3. **Memory**: Resource cleanup, large image handling, and efficient thumbnail management
4. **Features**: Double-tap zoom, gesture momentum, smooth animations
5. **Reliability**: Error handling, retries, network detection, and fallbacks

Implementing these optimizations will result in a butter-smooth, native-like file preview experience with excellent performance even on lower-end devices.
