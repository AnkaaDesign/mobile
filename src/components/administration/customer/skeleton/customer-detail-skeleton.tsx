import { ScrollView, View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";

function CardSkeleton({ children }: { children: React.ReactNode }) {
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

function FieldRow() {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        gap: spacing.md,
      }}
    >
      <Skeleton width="30%" height={14} />
      <Skeleton width="45%" height={14} />
    </View>
  );
}

function TableRowSkeleton() {
  return (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
        alignItems: "center",
      }}
    >
      <Skeleton width={60} height={14} />
      <Skeleton style={{ flex: 1 }} height={14} />
      <Skeleton width={50} height={14} />
    </View>
  );
}

export function CustomerDetailSkeleton() {
  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        gap: spacing.md,
        paddingBottom: spacing.md,
      }}
    >
      {/* Header Card: name + edit button */}
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

      {/* Basic Info Card: logo + identification fields */}
      <CardSkeleton>
        <CardHeader width="45%" />
        {/* Logo placeholder */}
        <View style={{ alignItems: "center", marginBottom: spacing.md }}>
          <Skeleton width={128} height={128} borderRadius={borderRadius.lg} />
        </View>
        {/* Identification subsection header */}
        <Skeleton width="30%" height={14} style={{ marginBottom: spacing.md }} />
        {/* Field rows */}
        <View style={{ gap: spacing.sm }}>
          <FieldRow />
          <FieldRow />
          <FieldRow />
          <FieldRow />
        </View>
      </CardSkeleton>

      {/* Contact Info Card: email + phones + site */}
      <CardSkeleton>
        <CardHeader width="55%" />
        <View style={{ gap: spacing.sm }}>
          {/* Email row */}
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" }}>
            <Skeleton width={20} height={20} borderRadius={4} />
            <View style={{ flex: 1, gap: 4 }}>
              <Skeleton width="20%" height={12} />
              <Skeleton width="70%" height={14} />
            </View>
          </View>
          {/* Phone row */}
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" }}>
            <Skeleton width={20} height={20} borderRadius={4} />
            <View style={{ flex: 1, gap: 4 }}>
              <Skeleton width="25%" height={12} />
              <Skeleton width="55%" height={14} />
            </View>
          </View>
          {/* Site row */}
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" }}>
            <Skeleton width={20} height={20} borderRadius={4} />
            <View style={{ flex: 1, gap: 4 }}>
              <Skeleton width="20%" height={12} />
              <Skeleton width="65%" height={14} />
            </View>
          </View>
        </View>
      </CardSkeleton>

      {/* Address Card: full-address box + individual fields */}
      <CardSkeleton>
        <CardHeader width="30%" />
        {/* Full address box */}
        <Skeleton width="100%" height={80} borderRadius={borderRadius.lg} style={{ marginBottom: spacing.md }} />
        {/* Individual field rows */}
        <View style={{ gap: spacing.sm }}>
          <FieldRow />
          <FieldRow />
          <FieldRow />
          <FieldRow />
        </View>
      </CardSkeleton>

      {/* Tasks Table Card */}
      <CardSkeleton>
        <CardHeader width="35%" />
        {/* Table header */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
            gap: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: "transparent",
          }}
        >
          <Skeleton width={60} height={12} />
          <Skeleton style={{ flex: 1 }} height={12} />
          <Skeleton width={50} height={12} />
        </View>
        {/* Table rows */}
        {[1, 2, 3].map((i) => (
          <TableRowSkeleton key={i} />
        ))}
      </CardSkeleton>

      {/* Service Orders Table Card */}
      <CardSkeleton>
        <CardHeader width="50%" />
        {/* Table header */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
            gap: spacing.sm,
          }}
        >
          <Skeleton width={60} height={12} />
          <Skeleton style={{ flex: 1 }} height={12} />
          <Skeleton width={50} height={12} />
        </View>
        {/* Table rows */}
        {[1, 2, 3].map((i) => (
          <TableRowSkeleton key={i} />
        ))}
      </CardSkeleton>

      {/* Changelog Card */}
      <CardSkeleton>
        <CardHeader width="55%" />
        <View style={{ gap: spacing.md }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ flexDirection: "row", gap: spacing.sm }}>
              <Skeleton width={8} height={8} borderRadius={4} style={{ marginTop: 4 }} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Skeleton width="40%" height={13} />
                <Skeleton width="70%" height={12} />
              </View>
            </View>
          ))}
        </View>
      </CardSkeleton>

      <View style={{ height: spacing.md }} />
    </ScrollView>
  );
}
