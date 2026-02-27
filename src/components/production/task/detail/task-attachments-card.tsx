import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { useFileViewer } from "@/components/file";
import { spacing, fontSize } from "@/constants/design-system";
import { formatDateTime } from "@/utils";

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

interface FileSection {
  label: string;
  files: File[];
}

interface TaskAttachmentsCardProps {
  /** @deprecated Use named file props instead */
  files?: File[];
  baseFiles?: File[];
  artworks?: File[];
  projectFiles?: File[];
  checkinFiles?: File[];
  checkoutFiles?: File[];
}

export const TaskAttachmentsCard: React.FC<TaskAttachmentsCardProps> = ({
  files,
  baseFiles,
  artworks,
  projectFiles,
  checkinFiles,
  checkoutFiles,
}) => {
  const { colors } = useTheme();
  const { openFile } = useFileViewer();

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

  const handleOpenFile = (file: File) => {
    openFile(file);
  };

  // Build sections from named props, filtering out empty ones
  const sections: FileSection[] = [];

  if (baseFiles && baseFiles.length > 0) {
    sections.push({ label: "Arquivos Base", files: baseFiles });
  }
  if (artworks && artworks.length > 0) {
    sections.push({ label: "Layouts", files: artworks });
  }
  if (projectFiles && projectFiles.length > 0) {
    sections.push({ label: "Projetos", files: projectFiles });
  }
  if (checkinFiles && checkinFiles.length > 0) {
    sections.push({ label: "Check-in", files: checkinFiles });
  }
  if (checkoutFiles && checkoutFiles.length > 0) {
    sections.push({ label: "Check-out", files: checkoutFiles });
  }

  // Fallback: if only the legacy `files` prop is provided with no named sections
  if (sections.length === 0 && files && files.length > 0) {
    sections.push({ label: "Anexos", files });
  }

  // Total file count across all sections
  const totalFiles = sections.reduce((sum, section) => sum + section.files.length, 0);

  if (totalFiles === 0) return null;

  const renderFileList = (sectionFiles: File[]) => (
    <View style={styles.fileList}>
      {sectionFiles.map((file, index) => (
        <TouchableOpacity
          key={file.id}
          style={[
            styles.fileItem,
            index < sectionFiles.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
          ]}
          onPress={() => handleOpenFile(file)}
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
  );

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconPaperclip size={20} color={colors.primary} />
        <ThemedText style={styles.title}>Anexos</ThemedText>
        <Badge variant="secondary" style={styles.countBadge}>
          {totalFiles}
        </Badge>
      </View>

      <View style={styles.content}>
        {sections.map((section, sectionIndex) => (
          <View key={section.label} style={sectionIndex > 0 ? styles.sectionSpacing : undefined}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionLabel}>{section.label}</ThemedText>
              <Badge variant="secondary" style={styles.sectionCountBadge}>
                {section.files.length}
              </Badge>
            </View>
            {renderFileList(section.files)}
          </View>
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
    borderBottomWidth: 1,
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
  sectionSpacing: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: fontSize.md,
    fontWeight: "600",
    opacity: 0.8,
  },
  sectionCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  fileList: {
    gap: spacing.xs,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  fileItemBorder: {
    borderBottomWidth: 1,
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
