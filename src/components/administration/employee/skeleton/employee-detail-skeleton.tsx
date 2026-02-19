
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
  return (
    <View style={{ marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}>
      <Skeleton width={width} height={18} />
    </View>
  );
}

function InfoRow() {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
      <Skeleton width="30%" height={14} />
      <Skeleton width="50%" height={14} />
    </View>
  );
}

function TableCard({ rowCount = 3 }: { rowCount?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      {/* Table header */}
      <View style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Skeleton width="40%" height={18} />
      </View>
      {/* Table rows */}
      {Array.from({ length: rowCount }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderBottomWidth: i < rowCount - 1 ? 1 : 0,
            borderBottomColor: colors.border,
          }}
        >
          <Skeleton width="25%" height={13} />
          <Skeleton width="30%" height={13} />
          <Skeleton width="20%" height={20} borderRadius={10} />
        </View>
      ))}
    </View>
  );
}

export function EmployeeDetailSkeleton() {
  return (
    <View style={{ gap: spacing.md }}>
      {/* BasicInfoCard - Informações Básicas: name, email, phone, status */}
      <SkeletonCard>
        <CardHeader width="50%" />
        <View style={{ gap: spacing.sm }}>
          <Skeleton width="35%" height={13} style={{ marginBottom: spacing.xs }} />
          <InfoRow />
          <InfoRow />
          <InfoRow />
          <InfoRow />
        </View>
      </SkeletonCard>

      {/* AddressCard - Informações Pessoais: birth, payrollNumber, address rows */}
      <SkeletonCard>
        <CardHeader width="55%" />
        <View style={{ gap: spacing.sm }}>
          <Skeleton width="35%" height={13} style={{ marginBottom: spacing.xs }} />
          <InfoRow />
          <InfoRow />
          <View style={{ height: 1, backgroundColor: '#e5e5e5', marginVertical: spacing.xs }} />
          <Skeleton width="30%" height={13} style={{ marginBottom: spacing.xs }} />
          <InfoRow />
          <InfoRow />
          <InfoRow />
          <InfoRow />
        </View>
      </SkeletonCard>

      {/* ProfessionalInfoCard - Dados Profissionais: position, sector, dates */}
      <SkeletonCard>
        <CardHeader width="50%" />
        <View style={{ gap: spacing.sm }}>
          <Skeleton width="35%" height={13} style={{ marginBottom: spacing.xs }} />
          <InfoRow />
          <InfoRow />
          <InfoRow />
          <InfoRow />
          <InfoRow />
        </View>
      </SkeletonCard>

      {/* LoginInfoCard - Informações de Login: verified, password change, last login */}
      <SkeletonCard>
        <CardHeader width="55%" />
        <View style={{ gap: spacing.md }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={{ flexDirection: "row", gap: spacing.sm }}>
              <Skeleton width={20} height={20} borderRadius={4} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Skeleton width="35%" height={12} />
                <Skeleton width="50%" height={22} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      </SkeletonCard>

      {/* PpeSizesCard - Tamanhos de EPI: grid of 2-column items */}
      <SkeletonCard>
        <CardHeader width="40%" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                minWidth: "45%",
                maxWidth: "48%",
                padding: spacing.md,
                gap: spacing.xs,
              }}
            >
              <Skeleton width="60%" height={12} />
              <Skeleton width="40%" height={20} />
            </View>
          ))}
        </View>
      </SkeletonCard>

      {/* VacationsTable */}
      <TableCard rowCount={2} />

      {/* WarningsTable */}
      <TableCard rowCount={2} />

      {/* PpeDeliveriesTable */}
      <TableCard rowCount={2} />

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
