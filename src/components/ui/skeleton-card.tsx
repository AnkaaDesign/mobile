/**
 * Skeleton loading component for cards
 * Provides visual feedback during data loading
 */

import React, { useEffect, useRef, memo } from 'react';
import { View, Animated, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';

interface SkeletonCardProps {
  height?: number;
  width?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  animate?: boolean;
}

export const SkeletonCard = memo(function SkeletonCard({
  height = 100,
  width = '100%',
  borderRadius = 12,
  style,
  animate = true,
}: SkeletonCardProps) {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [animate, animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          height,
          width: typeof width === 'number' ? width : undefined,
          borderRadius,
          backgroundColor: colors.muted,
          opacity: animate ? opacity : 0.5,
        },
        typeof width === 'string' ? { width: width as any } : undefined,
        style,
      ]}
    />
  );
});

interface SkeletonTextProps {
  lines?: number;
  widths?: (number | string)[];
  lineHeight?: number;
  spacing?: number;
  style?: ViewStyle;
}

export const SkeletonText = memo(function SkeletonText({
  lines = 1,
  widths = ['100%'],
  lineHeight = 16,
  spacing = 8,
  style,
}: SkeletonTextProps) {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonCard
          key={index}
          height={lineHeight}
          width={widths[index] || widths[widths.length - 1] || '100%'}
          borderRadius={4}
          style={index > 0 ? { marginTop: spacing } : undefined}
        />
      ))}
    </View>
  );
});

interface SkeletonListItemProps {
  showAvatar?: boolean;
  showActions?: boolean;
  style?: ViewStyle;
}

export const SkeletonListItem = memo(function SkeletonListItem({
  showAvatar = false,
  showActions = false,
  style,
}: SkeletonListItemProps) {
  return (
    <View style={[styles.listItem, style]}>
      {showAvatar && (
        <SkeletonCard
          height={40}
          width={40}
          borderRadius={20}
          style={styles.avatar}
        />
      )}
      <View style={styles.listItemContent}>
        <SkeletonText lines={2} widths={['60%', '40%']} />
      </View>
      {showActions && (
        <SkeletonCard
          height={24}
          width={24}
          borderRadius={4}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
});

export default SkeletonCard;