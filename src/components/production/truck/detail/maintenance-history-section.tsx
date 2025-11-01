

import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";

interface MaintenanceHistorySectionProps {
  data?: any;
}

export function MaintenanceHistorySection({ data }: MaintenanceHistorySectionProps) {
  const { spacing } = useTheme();

  if (!data) {
    return null;
  }

  return (
    <Card style={{ padding: spacing.md }}>
      <ThemedText size="lg" weight="semibold">Detalhes</ThemedText>
      {/* Add detail content here */}
    </Card>
  );
}