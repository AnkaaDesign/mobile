import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconCalendar } from "@tabler/icons-react-native";
import { useHoliday } from "@/hooks/useHoliday";

export default function HolidayEditScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params?.id || "";
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", date: "" });

  const { data: response, isLoading } = useHoliday(id, {
    enabled: !!id && id !== "",
  });

  const holiday = response?.data;

  useEffect(() => {
    if (holiday) {
      setFormData({
        name: holiday.name || "",
        date: holiday.date || "",
      });
    }
  }, [holiday]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Implementation will be added
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ScrollView
        style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Card style={styles.card}>
            <ThemedText>Carregando...</ThemedText>
          </Card>
        </View>
      </ScrollView>
    );
  }

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
              <ThemedText style={styles.title}>Editar Feriado</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <Input
              placeholder="Nome do Feriado"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <Input
              placeholder="Data do Feriado"
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
            />
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
              Salvar Alterações
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
