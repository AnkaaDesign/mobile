import { View, ScrollView, RefreshControl, Alert, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useBackup, useBackupMutations } from "@/hooks/useBackup";
import { formatDate } from "@/utils/date";
import { formatFileSize } from "@/utils/file-utils";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
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

export default function BackupDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isRestoring, setIsRestoring] = useState(false);
  const { colors } = useTheme();

  const { data: backup, isLoading, refetch, isFetching } = useBackup(id!);
  const { restore, delete: deleteBackup } = useBackupMutations();

  const handleRestore = () => {
    Alert.alert(
      "Restaurar Backup",
      "Tem certeza que deseja restaurar este backup? Esta ação substituirá os dados atuais.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          style: "destructive",
          onPress: async () => {
            try {
              setIsRestoring(true);
              await restore.mutateAsync({ id: id! });
              Alert.alert("Sucesso", "Backup restaurado com sucesso");
              router.back();
            } catch (_error) {
              Alert.alert("Erro", "Falha ao restaurar backup");
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Excluir Backup",
      "Tem certeza que deseja excluir este backup? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBackup.mutateAsync(id!);
              Alert.alert("Sucesso", "Backup excluído com sucesso");
              router.back();
            } catch (_error) {
              Alert.alert("Erro", "Falha ao excluir backup");
            }
          },
        },
      ]
    );
  };

  if (isLoading || !backup) {
    return <LoadingScreen />;
  }

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.ADMIN}>
      <ScrollView
        className="flex-1 bg-background"
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      >
        <View className="p-4 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold flex-1">
              {backup.name || `Backup ${formatDate(backup.createdAt)}`}
            </Text>
          </View>

          {/* Status Card */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <Icon name="info" size={20} color={colors.mutedForeground} />
                <Text style={styles.title}>Status</Text>
              </View>
            </View>
            <View style={styles.content}>
              <View className="flex-row items-center gap-2 mb-4">
                <Badge variant={backup.status === "completed" ? "success" : backup.status === "failed" ? "destructive" : "default"}>
                  {backup.status}
                </Badge>
                <Badge variant={backup.type === "full" ? "default" : backup.type === "database" ? "info" : "warning"}>
                  {backup.type}
                </Badge>
                {backup.encrypted && (
                  <Badge variant="info">
                    <Icon name="lock" size={16} color={colors.mutedForeground} />
                    Criptografado
                  </Badge>
                )}
              </View>

              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground">Tamanho</Text>
                  <Text className="font-medium">
                    {backup.size ? formatFileSize(backup.size) : "N/A"}
                  </Text>
                </View>
                <Separator />
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground">Duração</Text>
                  <Text className="font-medium">
                    {(backup as any).duration
                      ? `${Math.round((backup as any).duration / 1000)}s`
                      : "N/A"}
                  </Text>
                </View>
                <Separator />
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground">Criado em</Text>
                  <Text className="font-medium">{formatDate(backup.createdAt)}</Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Details Card */}
          {backup.description && (
            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <Icon name="file-text" size={20} color={colors.mutedForeground} />
                  <Text style={styles.title}>Descrição</Text>
                </View>
              </View>
              <View style={styles.content}>
                <Text className="text-muted-foreground">{backup.description}</Text>
              </View>
            </Card>
          )}

          {/* Contents Card */}
          {(backup as any).contents && (backup as any).contents.length > 0 && (
            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <Icon name="package" size={20} color={colors.mutedForeground} />
                  <Text style={styles.title}>Conteúdo</Text>
                </View>
              </View>
              <View style={styles.content}>
                <View className="gap-2">
                  {(backup as any).contents.map((item: string, index: number) => (
                    <View key={index} className="flex-row items-center gap-2">
                      <Icon name="check" size={20} color={colors.mutedForeground} />
                      <Text>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          )}

          {/* Error Card */}
          {backup.status === "failed" && backup.error && (
            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.destructive }]}>
                <View style={styles.headerLeft}>
                  <Icon name="alert-circle" size={20} color={colors.destructive} />
                  <Text style={[styles.title, { color: colors.destructive }]}>Erro</Text>
                </View>
              </View>
              <View style={styles.content}>
                <Text style={{ color: colors.destructive }}>{backup.error}</Text>
              </View>
            </Card>
          )}

          {/* Actions */}
          <View className="gap-2">
            {backup.status === "completed" && (
              <Button
                onPress={handleRestore}
                disabled={isRestoring}
                variant="default"
              >
                <Icon name="refresh-cw" className="w-4 h-4 mr-2" />
                <Text className="text-primary-foreground">
                  {isRestoring ? "Restaurando..." : "Restaurar Backup"}
                </Text>
              </Button>
            )}
            <Button
              onPress={handleDelete}
              variant="destructive"
              disabled={isRestoring}
            >
              <Icon name="trash" className="w-4 h-4 mr-2" />
              <Text className="text-destructive-foreground">Excluir Backup</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </PrivilegeGuard>
  );
}
