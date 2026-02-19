import { View, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { SectorForm } from "@/components/administration/sector/form/sector-form";
import { useSector } from "@/hooks/useSector";
import { useTheme } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { Skeleton } from "@/components/ui/skeleton";
import { spacing, borderRadius } from "@/constants/design-system";

export default function EditSectorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: sector, isLoading, error } = useSector(id);

  useScreenReady(!isLoading);

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          <View style={{ backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="40%" height={18} style={{ marginBottom: spacing.md }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={{ marginBottom: spacing.md }}>
                <Skeleton width="30%" height={14} style={{ marginBottom: spacing.xs }} />
                <Skeleton width="100%" height={44} borderRadius={8} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  if (error || !sector) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          Erro ao carregar setor
        </Text>
      </View>
    );
  }

  return <SectorForm mode="update" sector={sector?.data} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
