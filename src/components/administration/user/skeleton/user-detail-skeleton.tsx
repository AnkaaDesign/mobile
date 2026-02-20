import type { ReactNode } from "react";
import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";

function CardSkeleton({ children }: { children: ReactNode }) {
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
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: "transparent",
      }}
    >
      <Skeleton width={20} height={20} borderRadius={4} />
      <Skeleton width={width as any} height={18} />
    </View>
  );
}

function DetailRow() {
  return (
    <View style={{ flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.xs }}>
      <Skeleton width={20} height={20} borderRadius={4} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: spacing.xs / 2 }}>
        <Skeleton width="30%" height={12} />
        <Skeleton width="55%" height={14} />
      </View>
    </View>
  );
}

function TableCard({ titleWidth = "40%", rowCount = 2 }: { titleWidth?: string; rowCount?: number }) {
  return (
    <CardSkeleton>
      <CardHeader width={titleWidth} />
      {/* Search bar */}
      <Skeleton width="100%" height={36} borderRadius={borderRadius.md} style={{ marginBottom: spacing.sm }} />
      {/* Table rows */}
      {Array.from({ length: rowCount }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: spacing.sm,
            gap: spacing.sm,
          }}
        >
          <Skeleton width="50%" height={14} />
          <Skeleton width={60} height={22} borderRadius={11} />
        </View>
      ))}
    </CardSkeleton>
  );
}

export function UserDetailSkeleton() {
  return (
    <View style={{ gap: spacing.md }}>
      {/* Header card — user name + edit button */}
      <CardSkeleton>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: spacing.xs,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
            <Skeleton width={24} height={24} borderRadius={4} />
            <Skeleton width="60%" height={22} />
          </View>
          <Skeleton width={36} height={36} borderRadius={borderRadius.md} />
        </View>
      </CardSkeleton>

      {/* UserCard — avatar, name, email, badges, info grid */}
      <CardSkeleton>
        <View style={{ gap: spacing.md }}>
          {/* Header: avatar + info */}
          <View style={{ flexDirection: "row", gap: spacing.lg, alignItems: "flex-start" }}>
            <Skeleton width={80} height={80} borderRadius={40} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Skeleton width="80%" height={22} />
              <Skeleton width="60%" height={14} />
              <View style={{ flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs }}>
                <Skeleton width={80} height={22} borderRadius={11} />
                <Skeleton width={90} height={22} borderRadius={11} />
              </View>
            </View>
          </View>
          {/* Info grid: position, sector, managed sector */}
          <View style={{ gap: spacing.md }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <Skeleton width={36} height={36} borderRadius={borderRadius.md} />
                <View style={{ flex: 1 }}>
                  <Skeleton width="25%" height={12} />
                  <Skeleton width="50%" height={16} style={{ marginTop: 2 }} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </CardSkeleton>

      {/* UserAddressCard — personal info + address */}
      <CardSkeleton>
        <CardHeader width="55%" />
        {/* Personal info subsection */}
        <Skeleton width="30%" height={14} style={{ marginBottom: spacing.sm }} />
        <DetailRow />
        <DetailRow />
        {/* Divider space */}
        <View style={{ height: 1, marginVertical: spacing.sm }} />
        {/* Address subsection */}
        <Skeleton width="25%" height={14} style={{ marginBottom: spacing.sm }} />
        <DetailRow />
        <DetailRow />
        <DetailRow />
        <DetailRow />
      </CardSkeleton>

      {/* UserLoginInfoCard — verification, password, last login, system info */}
      <CardSkeleton>
        <CardHeader width="55%" />
        <Skeleton width="30%" height={14} style={{ marginBottom: spacing.sm }} />
        {/* Verification status, password change, last login */}
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={{ flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.xs }}>
            <Skeleton width={20} height={20} borderRadius={4} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, gap: spacing.xs / 2 }}>
              <Skeleton width="35%" height={12} />
              <Skeleton width={80} height={22} borderRadius={4} />
            </View>
          </View>
        ))}
        {/* Divider space */}
        <View style={{ height: 1, marginVertical: spacing.sm }} />
        {/* System info */}
        <Skeleton width="40%" height={14} style={{ marginBottom: spacing.sm }} />
        <DetailRow />
        <DetailRow />
      </CardSkeleton>

      {/* UserPpeSizesCard — grid of PPE sizes */}
      <CardSkeleton>
        <CardHeader width="40%" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={{ flex: 1, minWidth: "45%", maxWidth: "48%", gap: spacing.xs }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Skeleton width={18} height={18} borderRadius={4} />
                <Skeleton width="50%" height={12} />
              </View>
              <Skeleton width="35%" height={16} style={{ marginLeft: 18 + spacing.xs }} />
            </View>
          ))}
        </View>
      </CardSkeleton>

      {/* UserTasksTable */}
      <TableCard titleWidth="50%" rowCount={2} />

      {/* UserCreatedTasksTable */}
      <TableCard titleWidth="45%" rowCount={2} />

      {/* UserActivitiesTable */}
      <TableCard titleWidth="40%" rowCount={2} />

      {/* ChangelogTimeline */}
      <CardSkeleton>
        <CardHeader width="55%" />
        <View style={{ gap: spacing.md }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" }}>
              <Skeleton width={8} height={8} borderRadius={4} style={{ marginTop: 4 }} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Skeleton width="40%" height={13} />
                <Skeleton width="70%" height={12} />
              </View>
            </View>
          ))}
        </View>
      </CardSkeleton>

      {/* Bottom spacing */}
      <View style={{ height: spacing.md }} />
    </View>
  );
}
