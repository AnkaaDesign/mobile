import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { IconDatabase, IconDownload, IconClock, IconRefresh, IconTrash, IconAlertTriangle, IconCheck, IconX } from "@tabler/icons-react-native";
import { useToast } from "@/hooks/use-toast";
import { useBackups, useBackupMutations } from "@/hooks/useBackup";
import { formatDate } from "@/utils/date";

export default function BackupScreen() {
  const router = useRouter();
  const { show } = useToast();
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const { data: backups, isLoading, refetch } = useBackups();
  const { create: createBackup, delete: deleteBackup } = useBackupMutations();

  const handleCreateBackup = async () => {
    Alert.alert(
      "Criar Backup",
      "Deseja criar um novo backup completo do sistema?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Criar",
          onPress: async () => {
            try {
              setIsCreatingBackup(true);
              await createBackup.mutateAsync({
                name: `Backup ${new Date().toLocaleDateString()}`,
                type: "full",
                description: "Backup manual via mobile",
                priority: "high",
                compressionLevel: 6,
                encrypted: true,
              });
              show({
                title: "Sucesso",
                description: "Backup iniciado com sucesso!",
                type: "success",
              });
              refetch();
            } catch (error: any) {
              show({
                title: "Erro",
                description: error?.response?.data?.message || "Erro ao criar backup",
                type: "error",
              });
            } finally {
              setIsCreatingBackup(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteBackup = async (id: string, name: string) => {
    Alert.alert(
      "Excluir Backup",
      `Tem certeza que deseja excluir o backup "${name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBackup.mutateAsync(id);
              show({
                title: "Sucesso",
                description: "Backup excluído com sucesso!",
                type: "success",
              });
              refetch();
            } catch (error: any) {
              show({
                title: "Erro",
                description: error?.response?.data?.message || "Erro ao excluir backup",
                type: "error",
              });
            }
          },
        },
      ]
    );
  };

  const handleDownloadBackup = async (id: string, filename: string) => {
    try {
      show({
        title: "Download",
        description: "Funcionalidade de download não implementada no mobile",
        type: "info",
      });
    } catch (error: any) {
      show({
        title: "Erro",
        description: error?.response?.data?.message || "Erro ao baixar backup",
        type: "error",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Concluído", variant: "success" as const, icon: IconCheck },
      failed: { label: "Falhou", variant: "destructive" as const, icon: IconX },
      running: { label: "Em Andamento", variant: "default" as const, icon: IconClock },
      pending: { label: "Pendente", variant: "secondary" as const, icon: IconClock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge variant={config.variant}>
        <config.icon size={12} />
        <Text>{config.label}</Text>
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeLabels = {
      database: "Banco de Dados",
      files: "Arquivos",
      system: "Sistema",
      full: "Completo",
    };

    return (
      <Badge variant="outline">
        <Text>{typeLabels[type as keyof typeof typeLabels] || type}</Text>
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Backups"
        showBack
        actions={[
          {
            icon: IconRefresh,
            onPress: () => refetch(),
          },
          {
            icon: IconDatabase,
            onPress: handleCreateBackup,
            disabled: isCreatingBackup,
          },
        ]}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* System Health Summary */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Status do Sistema</Text>
          <View style={styles.healthRow}>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Total de Backups</Text>
              <Text style={styles.healthValue}>{backups?.length || 0}</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Concluídos</Text>
              <Text style={[styles.healthValue, styles.successText]}>
                {backups?.filter((b: any) => b.status === "completed").length || 0}
              </Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Falhas</Text>
              <Text style={[styles.healthValue, styles.errorText]}>
                {backups?.filter((b: any) => b.status === "failed").length || 0}
              </Text>
            </View>
          </View>
        </Card>

        {/* Create Backup Button */}
        <Button
          onPress={handleCreateBackup}
          disabled={isCreatingBackup}
          style={styles.createButton}
        >
          <IconDatabase size={20} />
          <Text>Criar Novo Backup</Text>
        </Button>

        {/* Backups List */}
        <Text style={styles.sectionTitle}>Backups Recentes</Text>
        {backups && backups.length > 0 ? (
          backups.map((backup: any) => (
            <Card key={backup.id} style={styles.backupCard}>
              <View style={styles.backupHeader}>
                <View style={styles.backupTitleRow}>
                  <Text style={styles.backupName}>{backup.name}</Text>
                  {getStatusBadge(backup.status)}
                </View>
                {getTypeBadge(backup.type)}
              </View>

              {backup.description && (
                <Text style={styles.backupDescription}>{backup.description}</Text>
              )}

              <View style={styles.backupMeta}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Data</Text>
                  <Text style={styles.metaValue}>
                    {formatDate(backup.createdAt, "dd/MM/yyyy HH:mm")}
                  </Text>
                </View>
                {backup.size && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Tamanho</Text>
                    <Text style={styles.metaValue}>{formatFileSize(backup.size)}</Text>
                  </View>
                )}
                {backup.duration && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Duração</Text>
                    <Text style={styles.metaValue}>{backup.duration}s</Text>
                  </View>
                )}
              </View>

              {backup.status === "completed" && (
                <View style={styles.backupActions}>
                  <Button
                    onPress={() => handleDownloadBackup(backup.id, backup.filename)}
                    variant="outline"
                    size="sm"
                    style={styles.actionButton}
                  >
                    <IconDownload size={16} />
                    <Text>Download</Text>
                  </Button>
                  <Button
                    onPress={() => handleDeleteBackup(backup.id, backup.name)}
                    variant="destructive"
                    size="sm"
                    style={styles.actionButton}
                  >
                    <IconTrash size={16} />
                    <Text>Excluir</Text>
                  </Button>
                </View>
              )}

              {backup.error && (
                <View style={styles.errorContainer}>
                  <IconAlertTriangle size={16} color="#dc2626" />
                  <Text style={styles.errorText}>{backup.error}</Text>
                </View>
              )}
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <IconDatabase size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>Nenhum backup encontrado</Text>
            <Text style={styles.emptySubtext}>
              Crie seu primeiro backup clicando no botão acima
            </Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  healthRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  healthItem: {
    alignItems: "center",
  },
  healthLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  healthValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  successText: {
    color: "#16a34a",
  },
  errorText: {
    color: "#dc2626",
  },
  createButton: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  backupCard: {
    marginBottom: 12,
    padding: 16,
  },
  backupHeader: {
    marginBottom: 8,
  },
  backupTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  backupName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  backupDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  backupMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  backupActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    marginTop: 8,
  },
  emptyCard: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
