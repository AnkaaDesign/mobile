import { View, ScrollView, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useBackupMutations } from "@/hooks/useBackup";
import { Icon } from "@/components/ui/icon";

export default function CreateBackupScreen() {
  const router = useRouter();
  const { create } = useBackupMutations();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "FULL" as "FULL" | "DATABASE" | "FILES",
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
      await create.mutateAsync(formData);
      Alert.alert("Sucesso", "Backup criado com sucesso");
      router.back();
    } catch (error) {
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

          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              <View>
                <Text className="text-sm font-medium mb-2">Nome *</Text>
                <Input
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipo de Backup</CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
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
                    <Icon name="check" className="w-5 h-5 text-primary-foreground" />
                  )}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opções</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
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
            </CardContent>
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
