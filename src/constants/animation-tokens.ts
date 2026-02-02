// packages/constants/src/animation-tokens.ts
// Centralized animation and transition tokens for consistent motion design

import { Easing } from 'react-native-reanimated';

// =====================
// Timing Constants
// =====================

export const duration = {
  instant: 0,
  fast: 100,    // Reduced from 150 for snappier feedback
  normal: 180,  // Reduced from 250 for faster transitions
  slow: 280,    // Reduced from 350
  slower: 400,  // Reduced from 500
  slowest: 600, // Reduced from 800
} as const;

export const delay = {
  none: 0,
  short: 100,
  medium: 200,
  long: 400,
} as const;

// =====================
// Easing Functions
// =====================

export const easings = {
  // Standard easings
  linear: Easing.linear,
  ease: Easing.ease,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),

  // Quad easings
  quadIn: Easing.in(Easing.quad),
  quadOut: Easing.out(Easing.quad),
  quadInOut: Easing.inOut(Easing.quad),

  // Cubic easings (recommended for most UI animations)
  cubicIn: Easing.in(Easing.cubic),
  cubicOut: Easing.out(Easing.cubic),
  cubicInOut: Easing.inOut(Easing.cubic),

  // Bezier curves (matching web CSS)
  easeInCubic: Easing.bezier(0.32, 0, 0.67, 0),
  easeOutCubic: Easing.bezier(0.33, 1, 0.68, 1),
  easeInOutCubic: Easing.bezier(0.65, 0, 0.35, 1),

  // Bounce
  bounceIn: Easing.in(Easing.bounce),
  bounceOut: Easing.out(Easing.bounce),
  bounceInOut: Easing.inOut(Easing.bounce),

  // Back
  backIn: Easing.in(Easing.back(1.5)),
  backOut: Easing.out(Easing.back(1.5)),
  backInOut: Easing.inOut(Easing.back(1.5)),

  // Elastic
  elasticIn: Easing.in(Easing.elastic(1)),
  elasticOut: Easing.out(Easing.elastic(1)),
  elasticInOut: Easing.inOut(Easing.elastic(1)),
} as const;

// =====================
// Spring Configurations
// =====================

export const springConfigs = {
  // Gentle spring - for subtle animations
  gentle: {
    damping: 20,
    mass: 1,
    stiffness: 120,
  },

  // Default spring - balanced for most use cases
  default: {
    damping: 15,
    mass: 1,
    stiffness: 150,
  },

  // Bouncy spring - for playful interactions
  bouncy: {
    damping: 10,
    mass: 1,
    stiffness: 180,
  },

  // Stiff spring - for quick, responsive animations
  stiff: {
    damping: 12,
    mass: 1,
    stiffness: 200,
  },

  // Slow spring - for heavy, weighted elements
  slow: {
    damping: 20,
    mass: 2,
    stiffness: 100,
  },

  // Wobbly spring - for attention-grabbing animations
  wobbly: {
    damping: 8,
    mass: 1,
    stiffness: 150,
  },
} as const;

// =====================
// Common Animation Presets
// =====================

export const animations = {
  // Fade animations
  fadeIn: {
    duration: duration.normal,
    easing: easings.easeOut,
    property: 'opacity',
    from: 0,
    to: 1,
  },

  fadeOut: {
    duration: duration.normal,
    easing: easings.easeIn,
    property: 'opacity',
    from: 1,
    to: 0,
  },

  // Slide animations
  slideInLeft: {
    duration: duration.normal,
    easing: easings.easeOut,
    property: 'translateX',
    from: -100,
    to: 0,
  },

  slideInRight: {
    duration: duration.normal,
    easing: easings.easeOut,
    property: 'translateX',
    from: 100,
    to: 0,
  },

  slideInUp: {
    duration: duration.normal,
    easing: easings.easeOut,
    property: 'translateY',
    from: 100,
    to: 0,
  },

  slideInDown: {
    duration: duration.normal,
    easing: easings.easeOut,
    property: 'translateY',
    from: -100,
    to: 0,
  },

  // Scale animations
  scaleIn: {
    duration: duration.normal,
    easing: easings.easeOut,
    property: 'scale',
    from: 0.8,
    to: 1,
  },

  scaleOut: {
    duration: duration.normal,
    easing: easings.easeIn,
    property: 'scale',
    from: 1,
    to: 0.8,
  },

  // Press animations (for buttons)
  pressIn: {
    duration: duration.fast,
    easing: easings.easeIn,
    property: 'scale',
    from: 1,
    to: 0.95,
  },

  pressOut: {
    duration: duration.fast,
    easing: easings.easeOut,
    property: 'scale',
    from: 0.95,
    to: 1,
  },

  // Shake animation (for errors)
  shake: {
    duration: duration.slow,
    easing: easings.linear,
    property: 'translateX',
    keyframes: [0, -10, 10, -10, 10, -5, 5, 0],
  },

  // Pulse animation (for notifications)
  pulse: {
    duration: duration.slower,
    easing: easings.easeInOut,
    property: 'scale',
    keyframes: [1, 1.05, 1],
  },
} as const;

// =====================
// Transition Presets
// =====================

export const transitions = {
  // Default transition for most properties
  default: {
    duration: duration.normal,
    easing: easings.easeInOut,
  },

  // Fast transition for immediate feedback
  fast: {
    duration: duration.fast,
    easing: easings.easeOut,
  },

  // Slow transition for deliberate actions
  slow: {
    duration: duration.slow,
    easing: easings.easeInOut,
  },

  // Smooth transition for continuous animations
  smooth: {
    duration: duration.normal,
    easing: easings.cubicInOut,
  },

  // Snappy transition for UI interactions
  snappy: {
    duration: duration.fast,
    easing: easings.cubicOut,
  },
} as const;

// =====================
// Gesture Response Configs
// =====================

export const gestureConfigs = {
  // Swipe gestures
  swipe: {
    minVelocity: 350,  // Reduced from 500 for easier swipes
    minDistance: 40,   // Reduced from 50 for more responsive swipes
    maxDuration: 400,
  },

  // Pan gestures
  pan: {
    minDistance: 10,
    activateAfterLongPress: 0,
  },

  // Long press gestures
  longPress: {
    minDuration: 400,  // Reduced from 500 for faster activation
    maxDistance: 10,
  },

  // Tap gestures
  tap: {
    maxDuration: 200,  // Reduced from 250 for snappier taps
    maxDistance: 10,
  },
} as const;

// =====================
// Layout Animation Configs
// =====================

export const layoutAnimations = {
  // Fade layout change
  fade: {
    duration: duration.normal,
    type: 'timing' as const,
    easing: easings.easeInOut,
  },

  // Spring layout change
  spring: {
    type: 'spring' as const,
    ...springConfigs.default,
  },

  // Linear layout change
  linear: {
    duration: duration.fast,
    type: 'timing' as const,
    easing: easings.linear,
  },
} as const;

// =====================
// Modal/Sheet Animations
// =====================

export const modalAnimations = {
  // Slide from bottom (standard modal)
  slideFromBottom: {
    enter: {
      duration: duration.normal,
      easing: easings.easeOut,
      from: { translateY: '100%', opacity: 0 },
      to: { translateY: 0, opacity: 1 },
    },
    exit: {
      duration: duration.fast,
      easing: easings.easeIn,
      from: { translateY: 0, opacity: 1 },
      to: { translateY: '100%', opacity: 0 },
    },
  },

  // Fade with scale (alert style)
  scaleAndFade: {
    enter: {
      duration: duration.normal,
      easing: easings.easeOut,
      from: { scale: 0.9, opacity: 0 },
      to: { scale: 1, opacity: 1 },
    },
    exit: {
      duration: duration.fast,
      easing: easings.easeIn,
      from: { scale: 1, opacity: 1 },
      to: { scale: 0.9, opacity: 0 },
    },
  },

  // Slide from side (drawer style)
  slideFromLeft: {
    enter: {
      duration: duration.normal,
      easing: easings.easeOut,
      from: { translateX: '-100%' },
      to: { translateX: 0 },
    },
    exit: {
      duration: duration.fast,
      easing: easings.easeIn,
      from: { translateX: 0 },
      to: { translateX: '-100%' },
    },
  },
} as const;

// =====================
// List Item Animations
// =====================

export const listAnimations = {
  // Stagger delay for sequential animations
  staggerDelay: 50,

  // Item enter animation
  itemEnter: {
    duration: duration.normal,
    easing: easings.easeOut,
    from: { opacity: 0, translateY: 20 },
    to: { opacity: 1, translateY: 0 },
  },

  // Item exit animation
  itemExit: {
    duration: duration.fast,
    easing: easings.easeIn,
    from: { opacity: 1, scale: 1 },
    to: { opacity: 0, scale: 0.8 },
  },

  // Swipe to delete
  swipeToDelete: {
    threshold: 0.5, // 50% of width
    velocityThreshold: 500,
    animationDuration: duration.fast,
  },
} as const;

// =====================
// Loading Animations
// =====================

export const loadingAnimations = {
  // Spinner rotation
  spinner: {
    duration: duration.slower,
    easing: easings.linear,
    repeat: -1, // Infinite
    from: { rotate: '0deg' },
    to: { rotate: '360deg' },
  },

  // Pulse
  pulse: {
    duration: duration.slower,
    easing: easings.easeInOut,
    repeat: -1,
    from: { opacity: 0.5, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
  },

  // Skeleton shimmer
  shimmer: {
    duration: duration.slowest,
    easing: easings.linear,
    repeat: -1,
    from: { translateX: '-100%' },
    to: { translateX: '100%' },
  },
} as const;

// =====================
// Export all tokens
// =====================

export const animationTokens = {
  duration,
  delay,
  easings,
  springConfigs,
  animations,
  transitions,
  gestureConfigs,
  layoutAnimations,
  modalAnimations,
  listAnimations,
  loadingAnimations,
} as const;

export default animationTokens;
