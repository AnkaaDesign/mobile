

import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";

interface GarageInfoSectionProps {
  data?: any;
}

export function GarageInfoSection({ data }: GarageInfoSectionProps) {
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