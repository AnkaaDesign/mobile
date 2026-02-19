
import type { ReactNode } from "react";
import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";

function SkeletonCard({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {children}
    </View>
  );
}

function CardHeader({ width = "50%" }: { width?: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
      }}
    >
      <Skeleton width={20} height={20} borderRadius={4} />
      <Skeleton width={width} height={18} />
    </View>
  );
}

function InfoRow() {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.md,
      }}
    >
      <Skeleton width="30%" height={14} />
      <Skeleton width="45%" height={14} />
    </View>
  );
}

export function ChangeLogDetailSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.md }}>
      {/* ChangeLogCard - action, entityType, entityId, field, timestamp, reason */}
      <SkeletonCard>
        <CardHeader width="55%" />
        <View>
          <InfoRow />
          <InfoRow />
          <InfoRow />
          <InfoRow />
          <InfoRow />
        </View>
      </SkeletonCard>

      {/* ChangesDiffCard - old value / new value diff */}
      <SkeletonCard>
        <CardHeader width="35%" />
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          {/* Old value */}
          <View style={{ flex: 1, gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Skeleton width={24} height={24} borderRadius={4} />
              <Skeleton width="50%" height={13} />
            </View>
            <View
              style={{
                padding: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: colors.muted + "20",
                gap: spacing.xs,
              }}
            >
              <Skeleton width="100%" height={13} />
              <Skeleton width="80%" height={13} />
            </View>
          </View>
          {/* Arrow */}
          <View style={{ paddingTop: spacing.xl }}>
            <Skeleton width={20} height={20} borderRadius={4} />
          </View>
          {/* New value */}
          <View style={{ flex: 1, gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Skeleton width={24} height={24} borderRadius={4} />
              <Skeleton width="50%" height={13} />
            </View>
            <View
              style={{
                padding: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: colors.muted + "20",
                gap: spacing.xs,
              }}
            >
              <Skeleton width="100%" height={13} />
              <Skeleton width="70%" height={13} />
            </View>
          </View>
        </View>
      </SkeletonCard>

      {/* UserCard - user avatar, name, email */}
      <SkeletonCard>
        <CardHeader width="40%" />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: spacing.md,
            borderRadius: borderRadius.md,
            backgroundColor: colors.muted + "40",
            gap: spacing.md,
          }}
        >
          <Skeleton width={44} height={44} borderRadius={22} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Skeleton width="55%" height={16} />
            <Skeleton width="70%" height={13} />
            <Skeleton width="80%" height={12} />
          </View>
          <Skeleton width={20} height={20} borderRadius={4} />
        </View>
      </SkeletonCard>

      {/* EntityLinkCard - link to related entity */}
      <SkeletonCard>
        <CardHeader width="45%" />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: spacing.md,
            borderRadius: borderRadius.md,
            backgroundColor: colors.muted + "30",
          }}
        >
          <View style={{ gap: spacing.xs }}>
            <Skeleton width={100} height={13} />
            <Skeleton width={160} height={16} />
          </View>
          <Skeleton width={20} height={20} borderRadius={4} />
        </View>
      </SkeletonCard>

      {/* Bottom spacing */}
      <View style={{ height: spacing.xxl * 2 }} />
    </View>
  );
}
