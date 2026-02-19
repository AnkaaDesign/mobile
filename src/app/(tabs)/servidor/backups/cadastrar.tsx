import { View, ScrollView, Alert, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useBackupMutations } from "@/hooks/useBackup";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useScreenReady } from '@/hooks/use-screen-ready';

const styles = StyleSheet.create({
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
});

export default function CreateBackupScreen() {
  useScreenReady();
  const router = useRouter();
  const { colors } = useTheme();
  const { create } = useBackupMutations();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "full" as "full" | "database" | "files",
    encrypted: false,
    compress: true,
    compressionLevel: 6,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Erro", "Nome do backup é obrigatório");
      return;
    }

    try {
      setIsSubmitting(true);
      const { compress, ...apiData } = formData;
      await create.mutateAsync(apiData);
      Alert.alert("Sucesso", "Backup criado com sucesso");
      router.back();
    } catch (_error) {
      Alert.alert("Erro", "Falha ao criar backup");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.ADMIN}>
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <Text className="text-2xl font-bold">Criar Novo Backup</Text>

          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <Icon name="info" size={20} color={colors.mutedForeground} />
                <Text style={styles.title}>Informações Básicas</Text>
              </View>
            </View>
            <View style={styles.content}>
              <View>
                <Text className="text-sm font-medium mb-2">Nome *</Text>
                <Input
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: String(text ?? '') })
                  }
                  placeholder="Nome do backup"
                />
              </View>

              <View>
                <Text className="text-sm font-medium mb-2">Descrição</Text>
                <Textarea
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData({ ...formData, description: text })
                  }
                  placeholder="Descrição opcional"
                  numberOfLines={3}
                />
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <Icon name="layers" size={20} color={colors.mutedForeground} />
                <Text style={styles.title}>Tipo de Backup</Text>
              </View>
            </View>
            <View style={styles.content}>
              {[
                { value: "FULL", label: "Completo", description: "Banco de dados e arquivos" },
                { value: "DATABASE", label: "Banco de Dados", description: "Apenas dados" },
                { value: "FILES", label: "Arquivos", description: "Apenas arquivos" },
              ].map((type) => (
                <Button
                  key={type.value}
                  variant={formData.type === type.value ? "default" : "outline"}
                  onPress={() =>
                    setFormData({ ...formData, type: type.value as any })
                  }
                  className="justify-start"
                >
                  <View className="flex-1">
                    <Text className={formData.type === type.value ? "text-primary-foreground font-semibold" : ""}>
                      {type.label}
                    </Text>
                    <Text className={`text-xs ${formData.type === type.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {type.description}
                    </Text>
                  </View>
                  {formData.type === type.value && (
                    <Icon name="check" size={20} color={colors.primary} />
                  )}
                </Button>
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <Icon name="sliders" size={20} color={colors.mutedForeground} />
                <Text style={styles.title}>Opções</Text>
              </View>
            </View>
            <View style={styles.content}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-medium">Criptografar</Text>
                  <Text className="text-sm text-muted-foreground">
                    Proteger backup com senha
                  </Text>
                </View>
                <Switch
                  checked={formData.encrypted}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, encrypted: checked })
                  }
                />
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-medium">Comprimir</Text>
                  <Text className="text-sm text-muted-foreground">
                    Reduzir tamanho do arquivo
                  </Text>
                </View>
                <Switch
                  checked={formData.compress}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, compress: checked })
                  }
                />
              </View>
            </View>
          </Card>

          <View className="gap-2 pb-4">
            <Button
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Icon name="database" className="w-4 h-4 mr-2" />
              <Text className="text-primary-foreground">
                {isSubmitting ? "Criando..." : "Criar Backup"}
              </Text>
            </Button>
            <Button
              variant="outline"
              onPress={() => router.back()}
              disabled={isSubmitting}
            >
              <Text>Cancelar</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </PrivilegeGuard>
  );
}
