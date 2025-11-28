import { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconCalendar } from "@tabler/icons-react-native";

export default function HolidaysCreateScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Implementation will be added
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Form Header */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconCalendar size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Informações Básicas</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <Input placeholder="Nome do Feriado" />
            <Input placeholder="Data do Feriado" />
          </View>
        </Card>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            variant="default"
            onPress={handleSubmit}
            disabled={loading}
          >
            <ThemedText style={{ color: colors.primaryForeground }}>
              Salvar Feriado
            </ThemedText>
          </Button>
        </View>

        <View style={{ height: spacing.xxl * 2 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  buttonContainer: {
    gap: spacing.sm,
  },
});
