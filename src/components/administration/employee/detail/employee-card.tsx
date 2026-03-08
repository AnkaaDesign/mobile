
import { View, StyleSheet } from "react-native";
import type { User } from '../../../../types';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailField } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { getBadgeVariant } from "@/constants/badge-colors";
import { getUserStatusBadgeText } from "@/utils/user";

interface EmployeeCardProps {
  employee: User;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  const { colors } = useTheme();

  const statusVariant = getBadgeVariant(employee.status, "USER");

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Avatar
            size="lg"
            style={{ backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}
          >
            <ThemedText style={{ color: colors.primaryForeground, fontSize: 24, fontWeight: '600' }}>
              {employee.name.charAt(0).toUpperCase()}
            </ThemedText>
          </Avatar>
          <View style={styles.headerInfo}>
            <ThemedText style={[styles.employeeName, { color: colors.foreground }]}>
              {employee.name}
            </ThemedText>
            {employee.email && (
              <ThemedText style={[styles.employeeEmail, { color: colors.mutedForeground }]}>
                {employee.email}
              </ThemedText>
            )}
            <Badge variant={statusVariant} style={styles.statusBadge}>
              {getUserStatusBadgeText(employee)}
            </Badge>
          </View>
        </View>

        {/* Quick Info using DetailField */}
        {employee.position && (
          <DetailField label="Cargo" icon="briefcase" value={employee.position.name} />
        )}

        {employee.sector && (
          <DetailField label="Setor" icon="building" value={employee.sector.name} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  content: {
    gap: spacing.md,
  },
  headerSection: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "flex-start",
  },
  headerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  employeeName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  employeeEmail: {
    fontSize: fontSize.sm,
  },
  statusBadge: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },
});
