
import { View, ScrollView } from "react-native";
import { SkeletonCard, SkeletonText } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

export function UserDetailSkeleton() {
  const { colors } = useTheme();

  const styles = {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
      gap: spacing.lg,
    },
    card: {
      padding: spacing.md,
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: "row" as const,
      gap: spacing.lg,
      marginBottom: spacing.lg,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    headerInfo: {
      flex: 1,
      gap: spacing.xs,
    },
    infoGrid: {
      gap: spacing.md,
    },
    infoRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.md,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: 8,
    },
    badge: {
      height: 24,
      width: 100,
      borderRadius: 12,
    },
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Main Card */}
          <View style={styles.card}>
            <View style={styles.header}>
              <SkeletonCard style={styles.avatar} />
              <View style={styles.headerInfo}>
                <SkeletonText width="80%" height={24} />
                <SkeletonText width="60%" height={16} />
                <View style={{ flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs }}>
                  <SkeletonCard style={styles.badge} />
                  <SkeletonCard style={{ ...styles.badge, width: 80 }} />
                </View>
              </View>
            </View>

            <View style={styles.infoGrid}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.infoRow}>
                  <SkeletonCard style={styles.icon} />
                  <View style={{ flex: 1 }}>
                    <SkeletonText width="40%" height={12} />
                    <SkeletonText width="70%" height={16} style={{ marginTop: 4 }} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Additional Cards */}
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.card}>
              <SkeletonText width="50%" height={18} style={{ marginBottom: spacing.md }} />
              <View style={{ gap: spacing.sm }}>
                <SkeletonText width="90%" height={14} />
                <SkeletonText width="85%" height={14} />
                <SkeletonText width="70%" height={14} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
