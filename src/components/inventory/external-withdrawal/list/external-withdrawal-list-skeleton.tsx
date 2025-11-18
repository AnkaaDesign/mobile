import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}) => {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.muted,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

const ExternalWithdrawalRowSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.rowContainer,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Header: Name and Status */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Skeleton width={16} height={16} borderRadius={8} />
          <Skeleton width="60%" height={16} />
        </View>
        <Skeleton width={80} height={24} borderRadius={12} />
      </View>

      {/* Type and Item Count */}
      <View style={styles.row}>
        <Skeleton width={90} height={24} borderRadius={12} />
        <View style={styles.itemCount}>
          <Skeleton width={14} height={14} borderRadius={7} />
          <Skeleton width={50} height={14} />
        </View>
      </View>

      {/* Value */}
      <View style={styles.row}>
        <View style={styles.value}>
          <Skeleton width={14} height={14} borderRadius={7} />
          <Skeleton width={80} height={16} />
        </View>
      </View>

      {/* Notes */}
      <View style={styles.notes}>
        <Skeleton width="90%" height={14} />
        <Skeleton width="70%" height={14} />
      </View>

      {/* Footer: Date */}
      <View style={styles.footer}>
        <View style={styles.date}>
          <Skeleton width={12} height={12} borderRadius={6} />
          <Skeleton width={100} height={12} />
        </View>
      </View>
    </View>
  );
};

export const ExternalWithdrawalListSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {[...Array(6)].map((_, index) => (
        <ExternalWithdrawalRowSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  rowContainer: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  value: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notes: {
    paddingTop: 4,
    gap: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  date: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
