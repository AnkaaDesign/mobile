import React from "react";
import { View, ActivityIndicator, Animated, Text, ViewStyle, TextStyle, AccessibilityInfo, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, shadow, spacing, fontSize, fontWeight, transitions } from "@/constants/design-system";

// Loading Spinner Component
interface LoadingSpinnerProps {
  size?: "sm" | "default" | "lg";
  variant?: "primary" | "secondary" | "destructive";
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "default", variant = "primary", style}) => {
  const { colors } = useTheme();

  const colorMap = {
    primary: colors.primary,
    secondary: colors.mutedForeground,
    destructive: colors.destructive,
  };

  const sizeMap = {
    sm: "small" as const,
    default: "large" as const,
    lg: "large" as const,
  };

  const containerSizeMap = {
    sm: { width: 16, height: 16 },
    default: { width: 24, height: 24 },
    lg: { width: 32, height: 32 },
  };

  const containerStyles: ViewStyle = {
    alignItems: "center",
    justifyContent: "center",
    ...containerSizeMap[size],
    ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
  };

  return (
    <View style={containerStyles} accessible accessibilityRole="progressbar" accessibilityLabel="Loading">
      <ActivityIndicator size={sizeMap[size as keyof typeof sizeMap]} color={colorMap[variant as keyof typeof colorMap]} />
    </View>
  );
};

// Loading Overlay Component
interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  style?: ViewStyle | ViewStyle[];
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, message = "Carregando...", style }) => {
  const { colors, isDark } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: transitions.fast,
      useNativeDriver: true,
    }).start();
  }, [isVisible, fadeAnim]);

  if (!isVisible) return null;

  const overlayStyles: ViewStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)",
    ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
  };

  const cardStyles: ViewStyle = {
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...(shadow.lg as ViewStyle),
  };

  const textStyles: TextStyle = {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.mutedForeground,
    textAlign: "center",
  };

  return (
    <Animated.View style={StyleSheet.flatten([overlayStyles, { opacity: fadeAnim }])} accessible accessibilityRole="progressbar" accessibilityLabel={message}>
      <View style={cardStyles}>
        <LoadingSpinner size="lg" />
        <Text style={StyleSheet.flatten([textStyles, { marginTop: spacing.md }])}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// Skeleton Component
interface SkeletonProps {
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
}

export const Skeleton: React.FC<SkeletonProps> = ({ style, children }) => {
  const { colors } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0.3)).current;
  const [reduceMotionEnabled, setReduceMotionEnabled] = React.useState(false);

  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotionEnabled);

    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotionEnabled);

    return () => subscription?.remove();
  }, []);

  React.useEffect(() => {
    if (!reduceMotionEnabled) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
      return () => animation.stop();
    } else {
      animatedValue.setValue(0.7); // Static opacity when motion is reduced
    }
  }, [animatedValue, reduceMotionEnabled]);

  const skeletonStyles: ViewStyle = {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.DEFAULT,
    ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
  };

  return (
    <Animated.View
      style={StyleSheet.flatten([skeletonStyles, { opacity: animatedValue }])}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando conteúdo"
      accessibilityState={{ busy: true }}
    >
      {children}
    </Animated.View>
  );
};

// Common skeleton patterns
interface SkeletonTextProps {
  lines?: number;
  width?: string | number;
  height?: number;
  style?: ViewStyle | ViewStyle[];
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 1, width, height = 16, style }) => {
  // If width and height are provided, render a single skeleton (for custom usage)
  if (width !== undefined) {
    return (
      <Skeleton
        style={{
          width,
          height,
          ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
        }}
      />
    );
  }

  // Otherwise, render multiple lines (for text-like skeletons)
  const containerStyles: ViewStyle = {
    ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
  };

  return (
    <View style={containerStyles}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          style={{
            height,
            width: i === lines - 1 && lines > 1 ? "75%" : "100%",
            marginBottom: i < lines - 1 ? 8 : 0,
          }}
        />
      ))}
    </View>
  );
};

interface SkeletonCardProps {
  style?: ViewStyle | ViewStyle[];
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ style }) => {
  const { colors } = useTheme();

  const cardStyles: ViewStyle = {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
  };

  const headerStyles: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  };

  const contentStyles: ViewStyle = {
    flex: 1,
    marginLeft: spacing.md,
  };

  return (
    <View style={cardStyles}>
      <View style={headerStyles}>
        <Skeleton style={{ height: 48, width: 48, borderRadius: 24 }} />
        <View style={contentStyles}>
          <Skeleton style={{ height: 16, width: "75%" }} />
          <Skeleton style={{ height: 16, width: "50%", marginTop: spacing.sm }} />
        </View>
      </View>
      <SkeletonText lines={3} style={{ marginTop: spacing.md }} />
    </View>
  );
};

interface SkeletonAvatarProps {
  size?: "sm" | "md" | "lg";
  style?: ViewStyle | ViewStyle[];
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({ size = "md", style }) => {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
  };

  const avatarSize = sizeMap[size as keyof typeof sizeMap];

  return (
    <Skeleton
      style={{
        height: avatarSize,
        width: avatarSize,
        borderRadius: avatarSize / 2,
        ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
      }}
    />
  );
};

// Progress Component
interface ProgressProps {
  value: number;
  max?: number;
  showValue?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export const Progress: React.FC<ProgressProps> = ({ value, max = 100, showValue = false, style }) => {
  const { colors } = useTheme();
  const percentage = Math.min((value / max) * 100, 100);
  const widthAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percentage,
      duration: transitions.normal,
      useNativeDriver: false,
    }).start();
  }, [percentage, widthAnim]);

  const containerStyles: ViewStyle = {
    width: "100%",
    ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
  };

  const labelContainerStyles: ViewStyle = {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  };

  const labelTextStyles: TextStyle = {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  };

  const trackStyles: ViewStyle = {
    width: "100%",
    height: 8,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  };

  const fillStyles: ViewStyle = {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  };

  return (
    <View style={containerStyles}>
      {showValue && (
        <View style={labelContainerStyles}>
          <Text style={labelTextStyles}>{Math.round(percentage)}%</Text>
        </View>
      )}
      <View style={trackStyles}>
        <Animated.View
          style={StyleSheet.flatten([
            fillStyles,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ])}
        />
      </View>
    </View>
  );
};

// Pulse Animation for loading states
interface PulseViewProps {
  children: React.ReactNode;
  isLoading?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export const PulseView: React.FC<PulseViewProps> = ({ children, isLoading = false, style }) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isLoading) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isLoading, pulseAnim]);

  return <Animated.View style={StyleSheet.flatten([style, { opacity: isLoading ? pulseAnim : 1 }])}>{children}</Animated.View>;
};

// Alias for backward compatibility
export const Loading = LoadingSpinner;
