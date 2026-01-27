import React, { useState, useCallback } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { IconPhoto, IconX } from "@tabler/icons-react-native";
import type { Task } from "@/types";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { ArtworkFileUploadField, type ArtworkFileItem } from "../form/artwork-file-upload-field";
import { useTaskMutations } from "@/hooks";
import { uploadFile } from "@/api-client";

export interface AddArtworksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetTask: Task;
  onSuccess?: () => void;
}

export function AddArtworksModal({
  open,
  onOpenChange,
  targetTask,
  onSuccess,
}: AddArtworksModalProps) {
  const { colors } = useTheme();
  const [files, setFiles] = useState<ArtworkFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { update } = useTaskMutations();

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setFiles([]);
    }
  }, [open]);

  const handleFilesChange = useCallback((newFiles: ArtworkFileItem[]) => {
    setFiles(newFiles);
  }, []);

  const handleStatusChange = useCallback((_fileId: string, _status: "DRAFT" | "APPROVED" | "REPROVED") => {
    // Status changes are handled locally, will be saved on submit
  }, []);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async () => {
    if (files.length === 0) {
      Alert.alert("Aviso", "Selecione pelo menos uma arte para adicionar.");
      return;
    }

    setIsUploading(true);

    try {
      // Upload new files and get their IDs
      const uploadedFileIds: string[] = [];

      for (const file of files) {
        if (!file.uploaded) {
          // Upload the file
          const formData = new FormData();
          formData.append("file", {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || file.type || "application/octet-stream",
          } as any);

          const uploadResult = await uploadFile(formData);
          if (uploadResult?.id) {
            uploadedFileIds.push(uploadResult.id);
          }
        } else if (file.uploadedFileId) {
          uploadedFileIds.push(file.uploadedFileId);
        }
      }

      if (uploadedFileIds.length === 0) {
        throw new Error("Nenhum arquivo foi carregado com sucesso.");
      }

      // Get existing artwork IDs from the task
      const existingArtworkIds = targetTask.artworks?.map((a: any) => a.fileId || a.file?.id || a.id) || [];

      // Combine existing and new artwork IDs
      const allArtworkIds = [...existingArtworkIds, ...uploadedFileIds];

      // Update the task with new artworks
      await update({
        id: targetTask.id,
        data: {
          artworkIds: allArtworkIds,
        },
      });

      // API client already shows success alert
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error uploading artworks:", error);
      // API client already shows error alert
    } finally {
      setIsUploading(false);
    }
  }, [files, targetTask, update, onOpenChange, onSuccess]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <Pressable style={styles.overlay} onPress={handleCancel}>
        <Pressable
          style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconPhoto size={20} color={colors.foreground} />
              <ThemedText style={[styles.headerTitle, { color: colors.foreground }]}>
                Adicionar Artes
              </ThemedText>
            </View>
            <TouchableOpacity onPress={handleCancel}>
              <IconX size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Task Info */}
          <View style={[styles.taskInfo, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <ThemedText style={[styles.taskInfoLabel, { color: colors.mutedForeground }]}>
              Tarefa:
            </ThemedText>
            <ThemedText style={[styles.taskInfoValue, { color: colors.foreground }]} numberOfLines={1}>
              {targetTask.name || "Sem nome"}
            </ThemedText>
            <ThemedText style={[styles.taskInfoSub, { color: colors.mutedForeground }]}>
              {targetTask.serialNumber || (targetTask as any)?.truck?.plate || "-"}
            </ThemedText>
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <ArtworkFileUploadField
              onFilesChange={handleFilesChange}
              onStatusChange={handleStatusChange}
              maxFiles={10}
              existingFiles={files}
              disabled={isUploading}
              showPreview={true}
              placeholder="Selecionar artes"
              label="Artes"
            />
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button variant="outline" size="sm" onPress={handleCancel} style={styles.footerButton}>
              <ThemedText style={{ color: colors.foreground }}>Cancelar</ThemedText>
            </Button>

            <Button
              variant="default"
              size="sm"
              onPress={handleSubmit}
              disabled={files.length === 0 || isUploading}
              style={styles.footerButton}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <IconPhoto size={16} color="#fff" style={{ marginRight: 4 }} />
                  <ThemedText style={{ color: "#fff" }}>
                    Adicionar {files.length > 0 ? `(${files.length})` : ""}
                  </ThemedText>
                </>
              )}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  modalContent: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "85%",
    minHeight: 400,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  taskInfo: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  taskInfoLabel: {
    fontSize: fontSize.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  taskInfoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  taskInfoSub: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
  },
  footerButton: {
    minWidth: 100,
  },
});

export default AddArtworksModal;
