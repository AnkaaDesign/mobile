
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

function CardHeader({ width = "40%" }: { width?: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Skeleton width={width} height={18} />
    </View>
  );
}

export function NotificationDetailSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={{ gap: spacing.md }}>
      {/* NotificationCard - title, body, tipo/importância badges, dates */}
      <SkeletonCard>
        <CardHeader width="35%" />
        <View style={{ gap: spacing.md }}>
          {/* Title section */}
          <View style={{ gap: spacing.sm }}>
            <Skeleton width="20%" height={13} />
            <Skeleton width="75%" height={22} />
          </View>
          {/* Body section */}
          <View style={{ gap: spacing.sm }}>
            <Skeleton width="25%" height={13} />
            <Skeleton width="100%" height={14} />
            <Skeleton width="90%" height={14} />
            <Skeleton width="70%" height={14} />
          </View>
          {/* Metadata grid - tipo & importância */}
          <View
            style={{
              flexDirection: "row",
              gap: spacing.md,
              paddingTop: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: colors.muted + "30",
                borderRadius: borderRadius.md,
                padding: spacing.md,
                gap: spacing.sm,
                alignItems: "center",
              }}
            >
              <Skeleton width="50%" height={12} />
              <Skeleton width="70%" height={22} borderRadius={11} />
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.muted + "30",
                borderRadius: borderRadius.md,
                padding: spacing.md,
                gap: spacing.sm,
                alignItems: "center",
              }}
            >
              <Skeleton width="55%" height={12} />
              <Skeleton width="65%" height={22} borderRadius={11} />
            </View>
          </View>
          {/* Dates section */}
          <View
            style={{
              gap: spacing.md,
              paddingTop: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ gap: spacing.xs }}>
              <Skeleton width="35%" height={13} />
              <Skeleton width="55%" height={16} />
            </View>
          </View>
        </View>
      </SkeletonCard>

      {/* DeliveryStatusCard - progress bar + 3 stat cards */}
      <SkeletonCard>
        <CardHeader width="55%" />
        <View style={{ gap: spacing.md }}>
          {/* Progress bar */}
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Skeleton width="30%" height={14} />
              <Skeleton width="15%" height={20} />
            </View>
            <Skeleton width="100%" height={8} borderRadius={4} />
          </View>
          {/* Stats grid - 3 cards */}
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  backgroundColor: colors.muted + "30",
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <Skeleton width={40} height={40} borderRadius={8} />
                <View style={{ gap: spacing.xs }}>
                  <Skeleton width={30} height={20} />
                  <Skeleton width={50} height={12} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </SkeletonCard>

      {/* RecipientsCard - list of recipients */}
      <SkeletonCard>
        <CardHeader width="40%" />
        <View style={{ gap: spacing.sm }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: spacing.xs,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Skeleton width={32} height={32} borderRadius={16} />
                <View style={{ gap: spacing.xs }}>
                  <Skeleton width={120} height={14} />
                  <Skeleton width={80} height={12} />
                </View>
              </View>
              <Skeleton width={60} height={22} borderRadius={11} />
            </View>
          ))}
        </View>
      </SkeletonCard>

      {/* ChangelogTimeline */}
      <SkeletonCard>
        <CardHeader width="55%" />
        <View style={{ gap: spacing.md }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" }}>
              <Skeleton width={4} height={60} borderRadius={2} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <View style={{ flexDirection: "row", gap: spacing.xs }}>
                  <Skeleton width={80} height={20} borderRadius={4} />
                  <Skeleton width={100} height={20} borderRadius={4} />
                </View>
                <Skeleton width="60%" height={13} />
                <Skeleton width="40%" height={13} />
              </View>
            </View>
          ))}
        </View>
      </SkeletonCard>

      {/* Bottom spacing */}
      <View style={{ height: spacing.xxl * 2 }} />
    </View>
  );
}
