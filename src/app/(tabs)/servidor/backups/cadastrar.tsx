import { View, ScrollView, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { ThemedView } from "@/components/ui/themed-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useBackupMutations } from "@/hooks/useBackup";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useFormScreenKey } from "@/hooks/use-form-screen-key";

type RetentionPeriod = "1_day" | "3_days" | "1_week" | "2_weeks" | "1_month" | "3_months" | "6_months" | "1_year";

const TYPE_OPTIONS = [
  { value: "database", label: "Banco de Dados" },
  { value: "files", label: "Arquivos" },
  { value: "system", label: "Sistema" },
  { value: "full", label: "Completo" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "critical", label: "Crítica" },
];

const COMPRESSION_OPTIONS = [
  { value: "1", label: "1 - Mais rápido" },
  { value: "3", label: "3 - Rápido" },
  { value: "6", label: "6 - Padrão" },
  { value: "9", label: "9 - Melhor compressão" },
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

interface CreateBackupForm {
  name: string;
  description: string;
  type: "database" | "files" | "system" | "full";
  priority: "low" | "medium" | "high" | "critical";
  compressionLevel: number;
  encrypted: boolean;
  autoDelete: {
    enabled: boolean;
    retention: RetentionPeriod;
  };
}

const INITIAL_FORM: CreateBackupForm = {
  name: "",
  description: "",
  type: "database",
  priority: "medium",
  compressionLevel: 6,
  encrypted: false,
  autoDelete: {
    enabled: false,
    retention: "1_week",
  },
};

export default function CreateBackupScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  const router = useRouter();
  const { colors } = useTheme();
  const { create } = useBackupMutations();

  const [form, setForm] = useState<CreateBackupForm>({ ...INITIAL_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert("Erro", "Nome do backup é obrigatório");
      return;
    }

    try {
      setIsSubmitting(true);
      await create.mutateAsync({
        name: form.name,
        type: form.type,
        description: form.description,
        priority: form.priority,
        compressionLevel: form.compressionLevel,
        encrypted: form.encrypted,
        autoDelete: form.autoDelete.enabled ? form.autoDelete : undefined,
      });
      Alert.alert("Sucesso", "Backup criado com sucesso");
      router.back();
    } catch {
      Alert.alert("Erro", "Falha ao criar backup");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.ADMIN}>
      <ThemedView key={formKey} className="flex-1">
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>Criar Novo Backup</Text>
            <Button variant="ghost" size="sm" onPress={() => router.back()}>
              <Icon name="x" size={20} color={colors.mutedForeground} />
            </Button>
          </View>

          {/* Name */}
          <Card style={{ padding: spacing.md, marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground, marginBottom: 8 }}>Nome *</Text>
            <Input
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: String(text ?? "") })}
              placeholder="Ex: backup_sistema_2024"
            />
          </Card>

          {/* Description */}
          <Card style={{ padding: spacing.md, marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground, marginBottom: 8 }}>Descrição (Opcional)</Text>
            <Input
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: String(text ?? "") })}
              placeholder="Descrição do backup"
            />
          </Card>

          {/* Type & Priority & Compression */}
          <Card style={{ padding: spacing.md, marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>Configuração</Text>

            <View style={{ gap: 12 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground, marginBottom: 6 }}>Tipo de Backup</Text>
                <Combobox
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: (typeof v === "string" ? v : "database") as CreateBackupForm["type"] })}
                  options={TYPE_OPTIONS}
                  searchable={false}
                  clearable={false}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground, marginBottom: 6 }}>Prioridade</Text>
                  <Combobox
                    value={form.priority}
                    onValueChange={(v) => setForm({ ...form, priority: (typeof v === "string" ? v : "medium") as CreateBackupForm["priority"] })}
                    options={PRIORITY_OPTIONS}
                    searchable={false}
                    clearable={false}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground, marginBottom: 6 }}>Compressão</Text>
                  <Combobox
                    value={form.compressionLevel.toString()}
                    onValueChange={(v) => setForm({ ...form, compressionLevel: parseInt(typeof v === "string" ? v : "6") })}
                    options={COMPRESSION_OPTIONS}
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

          {/* Auto-delete / Retention */}
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
                    <View style={{ marginTop: 1 }}><Icon name="alert-triangle" size={14} color="#f59e0b" /></View>
                    <Text style={{ fontSize: 12, color: "#f59e0b", flex: 1 }}>
                      Este backup será excluído automaticamente em{" "}
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
            <Button onPress={handleSubmit} disabled={isSubmitting}>
              <Icon name="database" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600" }}>{isSubmitting ? "Criando..." : "Criar Backup"}</Text>
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
