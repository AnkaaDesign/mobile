import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from './themed-text';
import { Button } from './button';
import { Card } from './card';
import { IconFile, IconX, IconFileText, IconFileZip, IconPhoto } from '@tabler/icons-react-native';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius, fontSize } from '@/constants/design-system';

export interface FileWithPreview {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

interface FileUploadFieldProps {
  files: FileWithPreview[];
  onRemove: (index: number) => void;
  onAdd: () => void;
  maxFiles?: number;
  accept?: string;
  label?: string;
  disabled?: boolean;
}

export function FileUploadField({
  files,
  onRemove,
  onAdd,
  maxFiles = 10,
  label = 'Adicionar Arquivos',
  disabled = false,
}: FileUploadFieldProps) {
  const { colors } = useTheme();

  const isImage = (type: string) => type?.startsWith('image/');
  const isPDF = (type: string) => type === 'application/pdf';
  const isZip = (type: string) =>
    type === 'application/zip' ||
    type === 'application/x-zip-compressed';

  const getFileIcon = (type: string) => {
    if (isImage(type)) return IconPhoto;
    if (isPDF(type)) return IconFileText;
    if (isZip(type)) return IconFileZip;
    return IconFile;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={{ marginTop: spacing.md }}>
      <Button
        onPress={onAdd}
        disabled={disabled || files.length >= maxFiles}
        variant="outline"
      >
        <ThemedText>
          {label} ({files.length}/{maxFiles})
        </ThemedText>
      </Button>

      {files.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing.md }}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {files.map((file, index) => {
            const FileIcon = getFileIcon(file.type);

            return (
              <View key={index} style={styles.filePreviewContainer}>
                {isImage(file.type) ? (
                  <Image
                    source={{ uri: file.uri }}
                    style={styles.imagePreview}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[
                    styles.fileIconContainer,
                    { backgroundColor: colors.muted }
                  ]}>
                    <FileIcon size={32} color={colors.mutedForeground} />
                    <ThemedText
                      style={styles.fileName}
                      numberOfLines={2}
                    >
                      {file.name}
                    </ThemedText>
                    {file.size && (
                      <ThemedText style={styles.fileSize}>
                        {formatFileSize(file.size)}
                      </ThemedText>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => onRemove(index)}
                  style={[
                    styles.removeButton,
                    { backgroundColor: colors.destructive }
                  ]}
                  activeOpacity={0.7}
                >
                  <IconX size={16} color="white" />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filePreviewContainer: {
    width: 120,
    height: 120,
    position: 'relative',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  fileIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  fileName: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  fileSize: {
    fontSize: fontSize.xs,
    marginTop: spacing.xxs,
    opacity: 0.7,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
