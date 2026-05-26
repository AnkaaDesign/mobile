import { View, Alert, StyleSheet } from "react-native";
import { useState } from "react";
import { useLocalSearchParams } from "expo-router";

import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBackup, useBackupMutations } from "@/hooks/useBackup";
import { formatDate } from "@/utils/date";
import { formatFileSize } from "@/utils/file-utils";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { useNav } from "@/contexts/nav";
import { spacing, fontSize } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { IconArchive } from "@tabler/icons-react-native";

export default function BackupDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const nav = useNav();
  const [isRestoring, setIsRestoring] = useState(false);
  const query = useBackup(id as string);
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
              await nav.withLoading(async () => restore.mutateAsync({ id: id as string }));
              // API client interceptor already shows the success toast
              nav.goBack();
            } catch {
              // API client interceptor already shows the error toast
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
              await nav.withLoading(async () => deleteBackup.mutateAsync(id as string));
              // API client interceptor already shows the success toast
              nav.dismissTo(mobileRoute(routes.server.backups.list));
            } catch {
              // API client interceptor already shows the error toast
            }
          },
        },
      ]
    );
  };

  return (
    <DetailScreen<any>
      query={query as any}
      icon={IconArchive}
      title={(b) => b.name || `Backup ${formatDate(b.createdAt)}`}
      privilege={SECTOR_PRIVILEGES.ADMIN}
      notFoundFallback={mobileRoute(routes.server.backups.list)}
    >
      {(backup) => (
        <View style={styles.body}>
          {/* Status Card */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <Icon name="info" size={20} color={colors.mutedForeground} />
                <Text style={styles.title}>Status</Text>
              </View>
            </View>
            <View style={styles.content}>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
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

              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.mutedForeground }}>Tamanho</Text>
                  <Text style={{ fontWeight: "500" }}>{backup.size ? formatFileSize(backup.size) : "N/A"}</Text>
                </View>
                <Separator />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.mutedForeground }}>Duração</Text>
                  <Text style={{ fontWeight: "500" }}>
                    {(backup as any).duration ? `${Math.round((backup as any).duration / 1000)}s` : "N/A"}
                  </Text>
                </View>
                <Separator />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.mutedForeground }}>Criado em</Text>
                  <Text style={{ fontWeight: "500" }}>{formatDate(backup.createdAt)}</Text>
                </View>
              </View>
            </View>
          </Card>

          {backup.description && (
            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <Icon name="file-text" size={20} color={colors.mutedForeground} />
                  <Text style={styles.title}>Descrição</Text>
                </View>
              </View>
              <View style={styles.content}>
                <Text style={{ color: colors.mutedForeground }}>{backup.description}</Text>
              </View>
            </Card>
          )}

          {(backup as any).contents && (backup as any).contents.length > 0 && (
            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <Icon name="package" size={20} color={colors.mutedForeground} />
                  <Text style={styles.title}>Conteúdo</Text>
                </View>
              </View>
              <View style={styles.content}>
                <View style={{ gap: 8 }}>
                  {(backup as any).contents.map((item: string, index: number) => (
                    <View key={index} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Icon name="check" size={20} color={colors.mutedForeground} />
                      <Text>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          )}

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

          <View style={{ gap: 8 }}>
            {backup.status === "completed" && (
              <Button onPress={handleRestore} disabled={isRestoring} variant="default">
                <Icon name="refresh-cw" size={16} color="#fff" />
                <Text style={{ color: colors.primaryForeground }}>
                  {isRestoring ? "Restaurando..." : "Restaurar Backup"}
                </Text>
              </Button>
            )}
            <Button onPress={handleDelete} variant="destructive" disabled={isRestoring}>
              <Icon name="trash" size={16} color="#fff" />
              <Text style={{ color: colors.destructiveForeground }}>Excluir Backup</Text>
            </Button>
          </View>
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
  },
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
