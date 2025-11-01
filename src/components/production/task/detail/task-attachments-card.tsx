import React from "react";
import { View, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatDateTime } from '../../../../utils';

// Local utility function
const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i as keyof typeof sizes];
};
import type { File } from '../../../../types';
import { IconPaperclip, IconDownload } from "@tabler/icons-react-native";

interface TaskAttachmentsCardProps {
  files: File[];
}

export const TaskAttachmentsCard: React.FC<TaskAttachmentsCardProps> = ({ files }) => {
  const { colors } = useTheme();

  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "pdf":
        return "file-text";
      case "doc":
      case "docx":
        return "file-text";
      case "xls":
      case "xlsx":
        return "file-spreadsheet";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "image";
      case "mp4":
      case "avi":
      case "mov":
        return "video";
      case "zip":
      case "rar":
      case "7z":
        return "archive";
      default:
        return "file";
    }
  };

  const handleDownload = (file: File) => {
    if (file.filename) {
      Linking.openURL(file.filename);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <IconPaperclip size={20} color={colors.primary} />
        <ThemedText style={styles.title}>Anexos</ThemedText>
        <Badge variant="secondary" style={styles.countBadge}>
          {files.length}
        </Badge>
      </View>

      <View style={styles.content}>
        {files.map((file, index) => (
          <TouchableOpacity
            key={file.id}
            style={[
              styles.fileItem,
              index < files.length - 1 && styles.fileItemBorder,
            ]}
            onPress={() => handleDownload(file)}
            activeOpacity={0.7}
          >
            <Icon
              name={getFileIcon(file.filename)}
              size={20}
              color={colors.primary}
             
            />
            <View style={styles.fileInfo}>
              <ThemedText style={styles.fileName} numberOfLines={1}>
                {file.filename}
              </ThemedText>
              <View style={styles.fileMeta}>
                <ThemedText style={styles.fileSize}>
                  {formatBytes(file.size)}
                </ThemedText>
                {file.createdAt && (
                  <>
                    <ThemedText style={styles.separator}>•</ThemedText>
                    <ThemedText style={styles.fileDate}>
                      {formatDateTime(file.createdAt)}
                    </ThemedText>
                  </>
                )}
              </View>
            </View>
            <IconDownload size={16} color={colors.primary} />
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  content: {
    gap: spacing.xs,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  fileItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fileIcon: {
    marginRight: spacing.sm,
  },
  fileInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  fileName: {
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  fileMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  fileSize: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  separator: {
    fontSize: fontSize.xs,
    opacity: 0.4,
    marginHorizontal: spacing.xs,
  },
  fileDate: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  downloadIcon: {
    opacity: 0.6,
  },
});