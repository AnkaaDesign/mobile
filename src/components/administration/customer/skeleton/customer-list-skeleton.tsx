
import { View, ScrollView, Dimensions } from "react-native";
import { SkeletonCard, SkeletonText } from "@/components/ui/loading";
import { useTheme } from "@/lib/theme";
import { extendedColors } from "@/lib/theme/extended-colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32;

export function CustomerListSkeleton() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = {
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingBottom: insets.bottom,
    },
    searchContainer: {
      flexDirection: "row" as const,
      paddingHorizontal: 8,
      paddingVertical: 8,
      gap: 8,
      alignItems: "center" as const,
    },
    searchBar: {
      flex: 1,
      height: 40,
      borderRadius: 8,
    },
    buttonContainer: {
      flexDirection: "row" as const,
      gap: 8,
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 8,
    },
    tableContainer: {
      flex: 1,
    },
    headerWrapper: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerContainer: {
      backgroundColor: isDark ? extendedColors.neutral[800] : extendedColors.neutral[100],
      paddingHorizontal: 16,
      height: 48,
    },
    headerRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      height: 48,
    },
    headerCell: {
      paddingVertical: 12,
      paddingHorizontal: 8,
    },
    row: {
      paddingHorizontal: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    rowContent: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingVertical: 12,
    },
    cell: {
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    nameContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    itemCountContainer: {
      flexDirection: "row" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: isDark ? extendedColors.neutral[900] : extendedColors.neutral[50],
    },
    fabSkeleton: {
      position: "absolute" as const,
      bottom: insets.bottom + 16,
      right: 16,
      width: 56,
      height: 56,
      borderRadius: 28,
    },
  };

  return (
    <View style={styles.container}>
      {/* Search and filter buttons */}
      <View style={styles.searchContainer}>
        <SkeletonCard style={styles.searchBar} />
        <View style={styles.buttonContainer}>
          <SkeletonCard style={styles.actionButton} />
          <SkeletonCard style={styles.actionButton} />
        </View>
      </View>

      {/* Table header */}
      <View style={styles.headerWrapper}>
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, { width: availableWidth * 0.4 }]}>
              <SkeletonText width="70%" height={14} />
            </View>
            <View style={[styles.headerCell, { width: availableWidth * 0.35 }]}>
              <SkeletonText width="60%" height={14} />
            </View>
            <View style={[styles.headerCell, { width: availableWidth * 0.25 }]}>
              <SkeletonText width="50%" height={14} />
            </View>
          </View>
        </View>
      </View>

      {/* Table rows */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.tableContainer}>
        {Array.from({ length: 10 }).map((_, index) => {
          const isEven = index % 2 === 0;
          return (
            <View
              key={index}
              style={[
                styles.row,
                {
                  backgroundColor: isEven
                    ? colors.background
                    : isDark
                    ? extendedColors.neutral[900]
                    : extendedColors.neutral[50],
                },
              ]}
            >
              <View style={styles.rowContent}>
                {/* Name column with avatar */}
                <View style={[styles.cell, { width: availableWidth * 0.4 }]}>
                  <View style={styles.nameContainer}>
                    <SkeletonCard style={styles.avatar} />
                    <SkeletonText width="70%" height={16} />
                  </View>
                </View>

                {/* Document column */}
                <View style={[styles.cell, { width: availableWidth * 0.35 }]}>
                  <SkeletonText width="80%" height={14} />
                </View>

                {/* Additional column */}
                <View style={[styles.cell, { width: availableWidth * 0.25 }]}>
                  <SkeletonText width="60%" height={14} />
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Items count skeleton */}
      <View style={styles.itemCountContainer}>
        <SkeletonText width="40%" height={14} />
      </View>

      {/* FAB skeleton */}
      <SkeletonCard style={styles.fabSkeleton} />
    </View>
  );
}
