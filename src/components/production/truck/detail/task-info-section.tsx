import React from "react";
import { View } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";

interface TaskInfoSectionProps {
  data?: any;
}

export function TaskInfoSection({ data }: TaskInfoSectionProps) {
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