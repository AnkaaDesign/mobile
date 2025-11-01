
import { View } from "react-native";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { spacing } from "@/constants/design-system";

export function ItemEditSkeleton() {

  const styles = {
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
      paddingBottom: 80,
    },
    card: {
      marginBottom: spacing.md,
    },
    cardContent: {
      padding: spacing.md,
    },
    cardTitle: {
      marginBottom: spacing.md,
    },
    fieldsContainer: {
      gap: spacing.md,
    },
    fieldGroup: {
      gap: spacing.sm,
    },
    fieldRow: {
      flexDirection: "row" as const,
      gap: spacing.sm,
    },
    fieldColumn: {
      flex: 1,
      gap: spacing.sm,
    },
    barcodesRow: {
      flexDirection: "row" as const,
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    toggleRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
    },
    actionButtons: {
      flexDirection: "row" as const,
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedScrollView>
        <View style={styles.scrollContent}>
          {/* Basic Information Card */}
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <Skeleton height={24} width="40%" style={styles.cardTitle} />
              <View style={styles.fieldsContainer}>
                {/* Name field */}
                <View style={styles.fieldGroup}>
                  <Skeleton height={16} width="30%" />
                  <Skeleton height={40} width="100%" />
                </View>
                {/* Unicode field */}
                <View style={styles.fieldGroup}>
                  <Skeleton height={16} width="25%" />
                  <Skeleton height={40} width="100%" />
                </View>
                {/* CA field */}
                <View style={styles.fieldGroup}>
                  <Skeleton height={16} width="35%" />
                  <Skeleton height={40} width="100%" />
                </View>
              </View>
            </View>
          </Card>

          {/* Classification Card */}
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <Skeleton height={24} width="35%" style={styles.cardTitle} />
              <View style={styles.fieldsContainer}>
                {/* Brand selector */}
                <View style={styles.fieldGroup}>
                  <Skeleton height={16} width="20%" />
                  <Skeleton height={40} width="100%" />
                </View>
                {/* Category selector */}
                <View style={styles.fieldGroup}>
                  <Skeleton height={16} width="25%" />
                  <Skeleton height={40} width="100%" />
                </View>
                {/* Supplier selector */}
                <View style={styles.fieldGroup}>
                  <Skeleton height={16} width="30%" />
                  <Skeleton height={40} width="100%" />
                </View>
              </View>
            </View>
          </Card>

          {/* Inventory Control Card */}
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <Skeleton height={24} width="45%" style={styles.cardTitle} />
              <View style={styles.fieldsContainer}>
                <View style={styles.fieldRow}>
                  {/* Current quantity */}
                  <View style={styles.fieldColumn}>
                    <Skeleton height={16} width="60%" />
                    <Skeleton height={40} width="100%" />
                  </View>
                  {/* Min quantity */}
                  <View style={styles.fieldColumn}>
                    <Skeleton height={16} width="60%" />
                    <Skeleton height={40} width="100%" />
                  </View>
                </View>
                <View style={styles.fieldRow}>
                  {/* Max quantity */}
                  <View style={styles.fieldColumn}>
                    <Skeleton height={16} width="60%" />
                    <Skeleton height={40} width="100%" />
                  </View>
                  {/* Box quantity */}
                  <View style={styles.fieldColumn}>
                    <Skeleton height={16} width="60%" />
                    <Skeleton height={40} width="100%" />
                  </View>
                </View>
                {/* Lead time */}
                <View style={styles.fieldGroup}>
                  <Skeleton height={16} width="40%" />
                  <Skeleton height={40} width="100%" />
                </View>
              </View>
            </View>
          </Card>

          {/* Pricing Card */}
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <Skeleton height={24} width="50%" style={styles.cardTitle} />
              <View style={styles.fieldsContainer}>
                <View style={styles.fieldRow}>
                  {/* Price field */}
                  <View style={styles.fieldColumn}>
                    <Skeleton height={16} width="40%" />
                    <Skeleton height={40} width="100%" />
                  </View>
                  {/* Tax field */}
                  <View style={styles.fieldColumn}>
                    <Skeleton height={16} width="30%" />
                    <Skeleton height={40} width="100%" />
                  </View>
                </View>
                <View style={styles.fieldRow}>
                  {/* Measure value */}
                  <View style={styles.fieldColumn}>
                    <Skeleton height={16} width="50%" />
                    <Skeleton height={40} width="100%" />
                  </View>
                  {/* Measure unit */}
                  <View style={styles.fieldColumn}>
                    <Skeleton height={16} width="45%" />
                    <Skeleton height={40} width="100%" />
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* Tracking Card */}
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <Skeleton height={24} width="40%" style={styles.cardTitle} />
              <View style={styles.fieldsContainer}>
                {/* Barcodes section */}
                <View style={styles.fieldGroup}>
                  <Skeleton height={16} width="35%" />
                  <Skeleton height={40} width="100%" />
                  <View style={styles.barcodesRow}>
                    <Skeleton height={32} width={120} />
                    <Skeleton height={32} width={120} />
                  </View>
                </View>
                {/* Assign to user toggle */}
                <View style={styles.toggleRow}>
                  <Skeleton height={16} width="45%" />
                  <Skeleton height={32} width={52} />
                </View>
                {/* Active status toggle */}
                <View style={styles.toggleRow}>
                  <Skeleton height={16} width="20%" />
                  <Skeleton height={32} width={52} />
                </View>
              </View>
            </View>
          </Card>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <Skeleton height={40} width="48%" />
            <Skeleton height={40} width="48%" />
          </View>
        </View>
      </ThemedScrollView>
    </ThemedView>
  );
}
