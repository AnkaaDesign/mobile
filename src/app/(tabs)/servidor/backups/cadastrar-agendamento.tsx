import { useState, useCallback } from "react";
import { View, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { ThemedView } from "@/components/ui/themed-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Icon } from "@/components/ui/icon";
import { Combobox } from "@/components/ui/combobox";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useBackupMutations, useBackupUtils } from "@/hooks/useBackup";
import { useTheme } from "@/lib/theme";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { spacing } from "@/constants/design-system";

type RetentionPeriod = '1_day' | '3_days' | '1_week' | '2_weeks' | '1_month' | '3_months' | '6_months' | '1_year';

const PRIORITY_OPTIONS = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "critical", label: "Crítica" },
];

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Diariamente" },
  { value: "weekly", label: "Semanalmente" },
  { value: "monthly", label: "Mensalmente" },
];

const TYPE_OPTIONS = [
  { value: "database", label: "Banco de Dados" },
  { value: "files", label: "Arquivos" },
  { value: "system", label: "Sistema" },
  { value: "full", label: "Completo" },
];

const RETENTION_OPTIONS = [
  { value: "1_day", label: "1 dia" },
  { value: "3_days", label: "3 dias" },
  { value: "1_week", label: "1 semana" },
  { value: "2_weeks", label: "2 semanas" },
  { value: "1_month", label: "1 mês" },
  { value: "3_months", label: "3 meses" },
  { value: "6_months", label: "6 meses" },
  { value: "1_year", label: "1 ano" },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, h) => ({
  value: `${h.toString().padStart(2, "0")}:00`,
  label: `${h.toString().padStart(2, "0")}:00`,
}));

interface ScheduleForm {
  name: string;
  type: "database" | "files" | "system" | "full";
  frequency: "daily" | "weekly" | "monthly";
  time: string;
  priority: "low" | "medium" | "high" | "critical";
  encrypted: boolean;
  compressionLevel: number;
  autoDelete: {
    enabled: boolean;
    retention: RetentionPeriod;
  };
}

const INITIAL_FORM: ScheduleForm = {
  name: "",
  type: "database",
  frequency: "daily",
  time: "23:00",
  priority: "medium",
  encrypted: false,
  compressionLevel: 6,
  autoDelete: {
    enabled: false,
    retention: "1_week",
  },
};

export default function CreateBackupScheduleScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [form, setForm] = useState<ScheduleForm>({ ...INITIAL_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { schedule: scheduleMutation } = useBackupMutations();
  const { generateCronExpression } = useBackupUtils();

  useScreenReady(true);

  const handleCreate = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert("Erro", "Nome do agendamento é obrigatório");
      return;
    }

    try {
      setIsSubmitting(true);
      const cron = generateCronExpression(form.frequency, form.time);

      await scheduleMutation.mutateAsync({
        name: form.name,
        type: form.type,
        enabled: true,
        cron,
        priority: form.priority,
        compressionLevel: form.compressionLevel,
        encrypted: form.encrypted,
        autoDelete: form.autoDelete.enabled ? form.autoDelete : undefined,
      });

      Alert.alert("Sucesso", "Agendamento criado com sucesso");
      router.back();
    } catch {
      Alert.alert("Erro", "Falha ao criar agendamento");
    } finally {
      setIsSubmitting(false);
    }
  }, [form, generateCronExpression, scheduleMutation, router]);

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.ADMIN}>
      <ThemedView className="flex-1">
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 16 }}>
            Novo Agendamento
          </Text>

          {/* Name */}
          <Card style={{ padding: spacing.md, marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground, marginBottom: 8 }}>Nome *</Text>
            <Input
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: String(text ?? "") })}
              placeholder="Nome do agendamento"
            />
          </Card>

          {/* Type & Frequency */}
          <Card style={{ padding: spacing.md, marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>Configuração</Text>

            <View style={{ gap: 12 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground, marginBottom: 6 }}>Tipo de Backup</Text>
                <Combobox
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: (typeof v === "string" ? v : "database") as any })}
                  options={TYPE_OPTIONS}
                  searchable={false}
                  clearable={false}
                />
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground, marginBottom: 6 }}>Frequência</Text>
                <Combobox
                  value={form.frequency}
                  onValueChange={(v) => setForm({ ...form, frequency: (typeof v === "string" ? v : "daily") as any })}
                  options={FREQUENCY_OPTIONS}
                  searchable={false}
                  clearable={false}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground, marginBottom: 6 }}>Horário</Text>
                  <Combobox
                    value={form.time}
                    onValueChange={(v) => setForm({ ...form, time: typeof v === "string" ? v : "23:00" })}
                    options={TIME_OPTIONS}
                    searchable={false}
                    clearable={false}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground, marginBottom: 6 }}>Prioridade</Text>
                  <Combobox
                    value={form.priority}
                    onValueChange={(v) => setForm({ ...form, priority: (typeof v === "string" ? v : "medium") as any })}
                    options={PRIORITY_OPTIONS}
                    searchable={false}
                    clearable={false}
                  />
                </View>
              </View>
            </View>
          </Card>

          {/* Options */}
          <Card style={{ padding: spacing.md, marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>Opções</Text>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground }}>Criptografar</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Proteger backup com senha</Text>
              </View>
              <Switch
                checked={form.encrypted}
                onCheckedChange={(checked) => setForm({ ...form, encrypted: checked })}
              />
            </View>
          </Card>

          {/* Auto-delete */}
          <Card style={{ padding: spacing.md, marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>Retenção</Text>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: form.autoDelete.enabled ? 12 : 0 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground }}>Excluir automaticamente</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Remover após período de retenção</Text>
              </View>
              <Switch
                checked={form.autoDelete.enabled}
                onCheckedChange={(checked) => setForm({ ...form, autoDelete: { ...form.autoDelete, enabled: checked } })}
              />
            </View>

            {form.autoDelete.enabled && (
              <View>
                <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground, marginBottom: 6 }}>Período de Retenção</Text>
                <Combobox
                  value={form.autoDelete.retention}
                  onValueChange={(v) => setForm({
                    ...form,
                    autoDelete: { ...form.autoDelete, retention: (typeof v === "string" ? v : "1_week") as RetentionPeriod },
                  })}
                  options={RETENTION_OPTIONS}
                  searchable={false}
                  clearable={false}
                />
                <View style={{
                  marginTop: 8,
                  padding: 10,
                  backgroundColor: "#f59e0b15",
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: "#f59e0b30",
                }}>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <Icon name="alert-triangle" size={14} color="#f59e0b" style={{ marginTop: 1 }} />
                    <Text style={{ fontSize: 12, color: "#f59e0b", flex: 1 }}>
                      Cada backup será excluído automaticamente em{" "}
                      {RETENTION_OPTIONS.find((o) => o.value === form.autoDelete.retention)?.label || "?"}{" "}
                      após a criação.
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </Card>

          {/* Actions */}
          <View style={{ gap: 8, paddingBottom: 32 }}>
            <Button onPress={handleCreate} disabled={isSubmitting}>
              <Icon name="clock" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600" }}>{isSubmitting ? "Criando..." : "Criar Agendamento"}</Text>
            </Button>
            <Button variant="outline" onPress={() => router.back()} disabled={isSubmitting}>
              <Text style={{ color: colors.foreground }}>Cancelar</Text>
            </Button>
          </View>
        </ScrollView>
      </ThemedView>
    </PrivilegeGuard>
  );
}
