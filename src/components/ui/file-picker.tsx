import { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  IconCamera,
  IconPhoto,
  IconFile,
  IconFileText,
  IconFileZip,
  IconUpload,
  IconX,
  IconMusic,
  IconVideo,
  IconTable,
  IconPresentation,
  IconVideoPlus,
} from "@tabler/icons-react-native";
import { ThemedText } from "./themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius, fontWeight } from "@/constants/design-system";

// File item interface used throughout the component
export interface FilePickerItem {
  uri: string;
  name: string;
  type: string;
  size?: number;
  mimeType?: string;
  // For existing files loaded from backend
  id?: string;
  uploaded?: boolean;
  thumbnailUrl?: string; // Backend-provided thumbnail URL for existing files
}

export interface FilePickerProps {
  /** Current files */
  value: FilePickerItem[];
  /** Callback when files change */
  onChange: (files: FilePickerItem[]) => void;
  /** Maximum number of files allowed */
  maxFiles?: number;
  /** Label text */
  label?: string;
  /** Placeholder text when no files */
  placeholder?: string;
  /** Helper text shown below placeholder */
  helperText?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Show camera option */
  showCamera?: boolean;
  /** Show video recording option */
  showVideoCamera?: boolean;
  /** Show gallery option */
  showGallery?: boolean;
  /** Show file picker option */
  showFilePicker?: boolean;
  /** Allow multiple selection from gallery/files */
  multiple?: boolean;
  /** Accepted file types for document picker */
  acceptedFileTypes?: string[];
  /** Image quality (0-1) */
  imageQuality?: number;
  /** Video max duration in seconds */
  videoMaxDuration?: number;
  /** Show file size in preview */
  showFileSize?: boolean;
  /** Confirm before removing file */
  confirmRemove?: boolean;
  /** Preview size (width and height) for multi-file mode */
  previewSize?: number;
  /** Required field indicator */
  required?: boolean;
}

export function FilePicker({
  value = [],
  onChange,
  maxFiles = 10,
  label,
  placeholder = "Adicionar arquivos",
  helperText,
  disabled = false,
  error,
  showCamera = true,
  showVideoCamera = true,
  showGallery = true,
  showFilePicker = true,
  multiple = true,
  acceptedFileTypes = ["*/*"],
  imageQuality = 0.8,
  videoMaxDuration = 60,
  showFileSize = true,
  confirmRemove = false,
  previewSize = 100,
  required = false,
}: FilePickerProps) {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const canAddMore = value.length < maxFiles;
  const hasFiles = value.length > 0;
  const isSingleFileMode = maxFiles === 1;

  // File type detection helpers
  const isImage = (type: string) => type?.startsWith("image/");
  const isPDF = (type: string) => type === "application/pdf" || type?.includes("pdf");
  const isZip = (type: string) =>
    type === "application/zip" ||
    type === "application/x-zip-compressed" ||
    type?.includes("zip") ||
    type?.includes("compressed");
  const isAudio = (type: string) => type?.startsWith("audio/");
  const isVideo = (type: string) => type?.startsWith("video/");
  const isSpreadsheet = (type: string) =>
    type?.includes("spreadsheet") ||
    type?.includes("excel") ||
    type?.includes("csv") ||
    type?.endsWith(".xlsx") ||
    type?.endsWith(".xls");
  const isPresentation = (type: string) =>
    type?.includes("presentation") ||
    type?.includes("powerpoint") ||
    type?.endsWith(".pptx") ||
    type?.endsWith(".ppt");

  // Get appropriate icon for file type
  const getFileIcon = (type: string) => {
    if (isImage(type)) return IconPhoto;
    if (isPDF(type)) return IconFileText;
    if (isZip(type)) return IconFileZip;
    if (isAudio(type)) return IconMusic;
    if (isVideo(type)) return IconVideo;
    if (isSpreadsheet(type)) return IconTable;
    if (isPresentation(type)) return IconPresentation;
    return IconFile;
  };

  // Format file size for display
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle camera capture
  const handleCamera = async () => {
    if (disabled || !canAddMore) return;

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissao Necessaria", "Precisamos de permissao para usar a camera.");
        return;
      }

      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: imageQuality,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const newFile: FilePickerItem = {
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
          size: asset.fileSize,
          mimeType: asset.mimeType || "image/jpeg",
        };
        onChange([...value, newFile]);
      }
    } catch (err) {
      console.error("Error taking photo:", err);
      Alert.alert("Erro", "Nao foi possivel tirar a foto.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle video recording
  const handleVideoCamera = async () => {
    if (disabled || !canAddMore) return;

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissao Necessaria", "Precisamos de permissao para usar a camera.");
        return;
      }

      // Also request microphone permission for video recording
      const { status: micStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (micStatus !== "granted") {
        Alert.alert("Permissao Necessaria", "Precisamos de permissao para gravar audio.");
        return;
      }

      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: videoMaxDuration,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const newFile: FilePickerItem = {
          uri: asset.uri,
          name: asset.fileName || `video_${Date.now()}.mp4`,
          type: asset.mimeType || "video/mp4",
          size: asset.fileSize,
          mimeType: asset.mimeType || "video/mp4",
        };
        onChange([...value, newFile]);
      }
    } catch (err) {
      console.error("Error recording video:", err);
      Alert.alert("Erro", "Nao foi possivel gravar o video.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle gallery selection
  const handleGallery = async () => {
    if (disabled || !canAddMore) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissao Necessaria", "Precisamos de permissao para acessar suas fotos.");
        return;
      }

      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
        allowsMultipleSelection: multiple && !isSingleFileMode,
        quality: imageQuality,
        allowsEditing: isSingleFileMode || !multiple,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const remainingSlots = maxFiles - value.length;
        const assetsToAdd = result.assets.slice(0, remainingSlots);

        const newFiles: FilePickerItem[] = assetsToAdd.map((asset) => {
          const isVideoAsset = asset.type === "video" || asset.mimeType?.startsWith("video/");
          const defaultName = isVideoAsset ? `video_${Date.now()}.mp4` : `image_${Date.now()}.jpg`;
          const defaultMimeType = isVideoAsset ? "video/mp4" : "image/jpeg";
          return {
            uri: asset.uri,
            name: asset.fileName || defaultName,
            type: asset.mimeType || defaultMimeType,
            size: asset.fileSize,
            mimeType: asset.mimeType || defaultMimeType,
          };
        });

        onChange([...value, ...newFiles]);

        if (result.assets.length > remainingSlots) {
          Alert.alert(
            "Limite de arquivos",
            `Apenas ${remainingSlots} arquivo(s) foram adicionados. Maximo de ${maxFiles} arquivos.`
          );
        }
      }
    } catch (err) {
      console.error("Error picking from gallery:", err);
      Alert.alert("Erro", "Nao foi possivel selecionar a imagem.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle document picker
  const handleFilePicker = async () => {
    if (disabled || !canAddMore) return;

    try {
      setIsLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: acceptedFileTypes,
        multiple: multiple && !isSingleFileMode,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const remainingSlots = maxFiles - value.length;
        const assetsToAdd = result.assets.slice(0, remainingSlots);

        const newFiles: FilePickerItem[] = assetsToAdd.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "application/octet-stream",
          size: asset.size,
          mimeType: asset.mimeType || "application/octet-stream",
        }));

        onChange([...value, ...newFiles]);

        if (result.assets.length > remainingSlots) {
          Alert.alert(
            "Limite de arquivos",
            `Apenas ${remainingSlots} arquivo(s) foram adicionados. Maximo de ${maxFiles} arquivos.`
          );
        }
      }
    } catch (err) {
      console.error("Error picking file:", err);
      Alert.alert("Erro", "Nao foi possivel selecionar o arquivo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file removal
  const handleRemove = (index: number) => {
    if (disabled) return;

    const removeFile = () => {
      const newFiles = value.filter((_, i) => i !== index);
      onChange(newFiles);
    };

    if (confirmRemove) {
      Alert.alert("Remover arquivo", "Deseja remover este arquivo?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover", style: "destructive", onPress: removeFile },
      ]);
    } else {
      removeFile();
    }
  };

  // Show options alert
  const showOptions = () => {
    if (disabled || !canAddMore) return;

    const options: { text: string; onPress: () => void; style?: "cancel" | "default" | "destructive" }[] = [];

    if (showCamera) {
      options.push({ text: "Tirar Foto", onPress: handleCamera });
    }
    if (showVideoCamera) {
      options.push({ text: "Gravar Video", onPress: handleVideoCamera });
    }
    if (showGallery) {
      options.push({ text: "Escolher da Galeria", onPress: handleGallery });
    }
    if (showFilePicker) {
      options.push({ text: "Selecionar Arquivo", onPress: handleFilePicker });
    }
    options.push({ text: "Cancelar", style: "cancel", onPress: () => {} });

    Alert.alert("Adicionar Arquivo", "Escolha uma opcao:", options, { cancelable: true });
  };

  const iconColor = disabled ? colors.mutedForeground : colors.foreground;

  // Render single file preview (full width)
  const renderSingleFilePreview = () => {
    if (!hasFiles || !isSingleFileMode) return null;

    const file = value[0];
    const FileIcon = getFileIcon(file.type || file.mimeType || "");
    const fileIsImage = isImage(file.type || file.mimeType || "");

    return (
      <View
        style={[
          styles.singleFileContainer,
          {
            backgroundColor: colors.muted,
            borderColor: error ? colors.destructive : colors.border,
          },
        ]}
      >
        {/* Preview */}
        <View style={styles.singleFilePreview}>
          {fileIsImage ? (
            <Image
              source={{ uri: file.uploaded && file.thumbnailUrl ? file.thumbnailUrl : file.uri }}
              style={styles.singleFileImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.singleFileIconContainer, { backgroundColor: colors.muted }]}>
              <FileIcon size={48} color={colors.mutedForeground} />
            </View>
          )}
        </View>

        {/* File info */}
        <View style={styles.singleFileInfo}>
          <ThemedText
            style={[styles.singleFileName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {file.name}
          </ThemedText>
          {showFileSize && file.size && (
            <ThemedText style={[styles.singleFileSize, { color: colors.mutedForeground }]}>
              {formatFileSize(file.size)}
            </ThemedText>
          )}
        </View>

        {/* Remove button */}
        {!disabled && (
          <TouchableOpacity
            onPress={() => handleRemove(0)}
            style={[styles.singleFileRemoveButton, { backgroundColor: colors.destructive }]}
            activeOpacity={0.7}
          >
            <IconX size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render multi file preview list
  const renderMultiFilePreview = () => {
    if (!hasFiles || isSingleFileMode) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.previewList}
        contentContainerStyle={styles.previewListContent}
      >
        {value.map((file, index) => {
          const FileIcon = getFileIcon(file.type || file.mimeType || "");
          const fileIsImage = isImage(file.type || file.mimeType || "");

          return (
            <View
              key={`${file.uri}-${index}`}
              style={[styles.previewItem, { width: previewSize }]}
            >
              {/* Preview container with padding for remove button */}
              <View style={styles.previewItemWrapper}>
                <View
                  style={[
                    styles.previewImageContainer,
                    {
                      width: previewSize - 12,
                      height: previewSize - 12,
                      backgroundColor: colors.muted,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {fileIsImage ? (
                    <Image
                      source={{ uri: file.uploaded && file.thumbnailUrl ? file.thumbnailUrl : file.uri }}
                      style={styles.previewImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.fileIconContainer}>
                      <FileIcon size={28} color={colors.mutedForeground} />
                    </View>
                  )}
                </View>

                {/* Remove button - positioned inside wrapper */}
                {!disabled && (
                  <TouchableOpacity
                    onPress={() => handleRemove(index)}
                    style={[styles.removeButton, { backgroundColor: colors.destructive }]}
                    activeOpacity={0.7}
                  >
                    <IconX size={12} color="white" />
                  </TouchableOpacity>
                )}
              </View>

              {/* File info */}
              <View style={styles.fileInfo}>
                <ThemedText
                  style={[styles.fileName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {file.name}
                </ThemedText>
                {showFileSize && file.size && (
                  <ThemedText style={[styles.fileSize, { color: colors.mutedForeground }]}>
                    {formatFileSize(file.size)}
                  </ThemedText>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && (
        <ThemedText style={[styles.label, { color: colors.foreground }]}>
          {label}
          {required && <ThemedText style={{ color: colors.destructive }}> *</ThemedText>}
        </ThemedText>
      )}

      {/* Single file mode: show preview if has file, otherwise show picker */}
      {isSingleFileMode ? (
        hasFiles ? (
          renderSingleFilePreview()
        ) : (
          <TouchableOpacity
            onPress={showOptions}
            disabled={disabled || isLoading}
            activeOpacity={0.7}
            style={[
              styles.pickerArea,
              {
                backgroundColor: colors.muted,
                borderColor: error ? colors.destructive : colors.border,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          >
            <View style={styles.pickerContent}>
              <View style={styles.pickerTextContainer}>
                <IconUpload size={24} color={colors.mutedForeground} />
                <View style={styles.pickerTextContent}>
                  <ThemedText style={[styles.placeholder, { color: colors.foreground }]}>
                    {placeholder}
                  </ThemedText>
                  {helperText && (
                    <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
                      {helperText}
                    </ThemedText>
                  )}
                </View>
              </View>

              {!isLoading && (
                <View style={styles.actionButtons}>
                  {showCamera && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleCamera();
                      }}
                      disabled={disabled}
                      style={[styles.iconButton, { backgroundColor: colors.background }]}
                      activeOpacity={0.7}
                    >
                      <IconCamera size={20} color={iconColor} />
                    </TouchableOpacity>
                  )}
                  {showVideoCamera && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleVideoCamera();
                      }}
                      disabled={disabled}
                      style={[styles.iconButton, { backgroundColor: colors.background }]}
                      activeOpacity={0.7}
                    >
                      <IconVideoPlus size={20} color={iconColor} />
                    </TouchableOpacity>
                  )}
                  {showGallery && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleGallery();
                      }}
                      disabled={disabled}
                      style={[styles.iconButton, { backgroundColor: colors.background }]}
                      activeOpacity={0.7}
                    >
                      <IconPhoto size={20} color={iconColor} />
                    </TouchableOpacity>
                  )}
                  {showFilePicker && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleFilePicker();
                      }}
                      disabled={disabled}
                      style={[styles.iconButton, { backgroundColor: colors.background }]}
                      activeOpacity={0.7}
                    >
                      <IconFile size={20} color={iconColor} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
            </View>
          </TouchableOpacity>
        )
      ) : (
        <>
          {/* Multi file mode: always show picker if can add more */}
          {canAddMore && (
            <TouchableOpacity
              onPress={showOptions}
              disabled={disabled || isLoading}
              activeOpacity={0.7}
              style={[
                styles.pickerArea,
                {
                  backgroundColor: colors.muted,
                  borderColor: error ? colors.destructive : colors.border,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              <View style={styles.pickerContent}>
                <View style={styles.pickerTextContainer}>
                  <IconUpload size={24} color={colors.mutedForeground} />
                  <View style={styles.pickerTextContent}>
                    <ThemedText style={[styles.placeholder, { color: colors.foreground }]}>
                      {placeholder}
                    </ThemedText>
                    {helperText && (
                      <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
                        {helperText}
                      </ThemedText>
                    )}
                  </View>
                </View>

                {!isLoading && (
                  <View style={styles.actionButtons}>
                    {showCamera && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleCamera();
                        }}
                        disabled={disabled}
                        style={[styles.iconButton, { backgroundColor: colors.background }]}
                        activeOpacity={0.7}
                      >
                        <IconCamera size={20} color={iconColor} />
                      </TouchableOpacity>
                    )}
                    {showVideoCamera && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleVideoCamera();
                        }}
                        disabled={disabled}
                        style={[styles.iconButton, { backgroundColor: colors.background }]}
                        activeOpacity={0.7}
                      >
                        <IconVideoPlus size={20} color={iconColor} />
                      </TouchableOpacity>
                    )}
                    {showGallery && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleGallery();
                        }}
                        disabled={disabled}
                        style={[styles.iconButton, { backgroundColor: colors.background }]}
                        activeOpacity={0.7}
                      >
                        <IconPhoto size={20} color={iconColor} />
                      </TouchableOpacity>
                    )}
                    {showFilePicker && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleFilePicker();
                        }}
                        disabled={disabled}
                        style={[styles.iconButton, { backgroundColor: colors.background }]}
                        activeOpacity={0.7}
                      >
                        <IconFile size={20} color={iconColor} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
              </View>
            </TouchableOpacity>
          )}

          {/* File count indicator */}
          <ThemedText style={[styles.fileCount, { color: colors.mutedForeground }]}>
            {value.length}/{maxFiles} arquivos
          </ThemedText>

          {/* Multi file preview list */}
          {renderMultiFilePreview()}
        </>
      )}

      {/* Error message */}
      {error && (
        <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium as any,
  },
  pickerArea: {
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  pickerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 72,
  },
  pickerTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  pickerTextContent: {
    flex: 1,
    gap: spacing.xxs,
  },
  placeholder: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium as any,
  },
  helperText: {
    fontSize: fontSize.xs,
  },
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xxs,
    maxWidth: 76,
    justifyContent: "flex-end",
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  fileCount: {
    fontSize: fontSize.xs,
    textAlign: "right",
  },
  // Single file mode styles
  singleFileContainer: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  singleFilePreview: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  singleFileImage: {
    width: "100%",
    height: "100%",
  },
  singleFileIconContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  singleFileInfo: {
    padding: spacing.sm,
    gap: 2,
  },
  singleFileName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium as any,
  },
  singleFileSize: {
    fontSize: fontSize.xs,
  },
  singleFileRemoveButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Multi file mode styles
  previewList: {
    marginTop: spacing.xs,
  },
  previewListContent: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  previewItem: {
    gap: spacing.xs,
  },
  previewItemWrapper: {
    position: "relative",
    padding: 6,
  },
  previewImageContainer: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  fileIconContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  fileInfo: {
    paddingHorizontal: spacing.xxs,
  },
  fileName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium as any,
  },
  fileSize: {
    fontSize: 10,
    marginTop: 2,
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
