import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius } from '@/constants/design-system';
import { Input } from '@/components/ui/input';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { ThemedText } from '@/components/ui/themed-text';
import { IconCamera, IconPhoto, IconLink, IconRefresh } from '@tabler/icons-react-native';
import { uploadSingleFile } from '@/api-client/file';
import { getCurrentApiUrl } from '@/api-client/axiosClient';
import type { ImageBlock, ImageSizePreset } from '../types';

interface ImageBlockEditorProps {
  block: ImageBlock;
  onUpdate: (updates: Partial<ImageBlock>) => void;
  disabled?: boolean;
}

const SIZE_OPTIONS: ComboboxOption[] = [
  { value: '64px', label: 'Ícone (64px)' },
  { value: '128px', label: 'Pequeno (128px)' },
  { value: '256px', label: 'Médio (256px)' },
  { value: '384px', label: 'Grande (384px)' },
  { value: '25%', label: '25%' },
  { value: '50%', label: '50%' },
  { value: '75%', label: '75%' },
  { value: '100%', label: '100%' },
];

const ALIGNMENT_OPTIONS: ComboboxOption[] = [
  { value: 'left', label: 'Esquerda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Direita' },
];

export function ImageBlockEditor({ block, onUpdate, disabled }: ImageBlockEditorProps) {
  const { colors } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const hasImage = !!block.url;

  // Resolve relative URLs (e.g. /files/serve/...) to absolute URLs for display
  const resolvedImageUrl = useMemo(() => {
    if (!block.url) return undefined;
    if (block.url.startsWith('/')) {
      return `${getCurrentApiUrl()}${block.url}`;
    }
    return block.url;
  }, [block.url]);

  const handlePickCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Necessária', 'Precisamos de permissão para usar a câmera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        await handleUpload(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao capturar imagem');
    }
  };

  const handlePickGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Necessária', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        await handleUpload(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao selecionar imagem');
    }
  };

  const handleUpload = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setIsUploading(true);

      const file = {
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      };

      const response = await uploadSingleFile(file, { fileContext: 'messageImages' });

      if (response?.success && response?.data?.id) {
        // Match web pattern: store as relative path `/files/serve/<fileId>`
        // The renderer resolves this against the API base URL
        onUpdate({ url: `/files/serve/${response.data.id}` });
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
    }
  };

  if (isUploading) {
    return (
      <View style={[styles.uploadingContainer, { borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} />
        <ThemedText style={[styles.uploadingText, { color: colors.mutedForeground }]}>
          Enviando imagem...
        </ThemedText>
      </View>
    );
  }

  if (!hasImage) {
    return (
      <View style={styles.container}>
        {showUrlInput ? (
          <View style={styles.urlInputContainer}>
            <Input
              value={block.url}
              onChangeText={(val) => onUpdate({ url: val })}
              placeholder="https://exemplo.com/imagem.jpg"
              autoCapitalize="none"
              keyboardType="url"
              editable={!disabled}
            />
            <TouchableOpacity
              onPress={() => setShowUrlInput(false)}
              style={styles.cancelUrlButton}
            >
              <ThemedText style={[styles.cancelUrlText, { color: colors.mutedForeground }]}>
                Voltar
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Adicionar imagem
            </ThemedText>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.pickButton, { backgroundColor: colors.primary }]}
                onPress={handlePickCamera}
                disabled={disabled}
              >
                <IconCamera size={18} color="#FFFFFF" />
                <ThemedText style={styles.pickButtonText}>Câmera</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickButton, { backgroundColor: colors.primary }]}
                onPress={handlePickGallery}
                disabled={disabled}
              >
                <IconPhoto size={18} color="#FFFFFF" />
                <ThemedText style={styles.pickButtonText}>Galeria</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickButton, { borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setShowUrlInput(true)}
                disabled={disabled}
              >
                <IconLink size={18} color={colors.foreground} />
                <ThemedText style={[styles.pickButtonTextAlt, { color: colors.foreground }]}>URL</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Image Preview */}
      <View style={styles.previewContainer}>
        <Image
          source={{ uri: resolvedImageUrl }}
          style={styles.imagePreview}
          contentFit="contain"
        />
        <TouchableOpacity
          style={[styles.changeButton, { backgroundColor: colors.muted }]}
          onPress={() => onUpdate({ url: '' })}
          disabled={disabled}
        >
          <IconRefresh size={14} color={colors.foreground} />
          <ThemedText style={[styles.changeText, { color: colors.foreground }]}>Alterar</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Image Settings */}
      <View style={styles.row}>
        <View style={styles.halfField}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Tamanho</ThemedText>
          <Combobox
            options={SIZE_OPTIONS}
            value={block.size || '100%'}
            onValueChange={(val) => onUpdate({ size: val as ImageSizePreset })}
            placeholder="Tamanho"
            disabled={disabled}
            searchable={false}
            clearable={false}
          />
        </View>
        <View style={styles.halfField}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Alinhamento</ThemedText>
          <Combobox
            options={ALIGNMENT_OPTIONS}
            value={block.alignment || 'center'}
            onValueChange={(val) => onUpdate({ alignment: val as ImageBlock['alignment'] })}
            placeholder="Alinhamento"
            disabled={disabled}
            searchable={false}
            clearable={false}
          />
        </View>
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Texto alternativo</ThemedText>
        <Input
          value={block.alt || ''}
          onChangeText={(val) => onUpdate({ alt: val })}
          placeholder="Descrição da imagem"
          editable={!disabled}
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Legenda</ThemedText>
        <Input
          value={block.caption || ''}
          onChangeText={(val) => onUpdate({ caption: val })}
          placeholder="Legenda opcional"
          editable={!disabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  emptyState: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 14,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  pickButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  pickButtonTextAlt: {
    fontSize: 13,
    fontWeight: '600',
  },
  urlInputContainer: {
    gap: spacing.xs,
  },
  cancelUrlButton: {
    alignSelf: 'flex-start',
  },
  cancelUrlText: {
    fontSize: 13,
  },
  previewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.md,
    backgroundColor: '#f0f0f0',
  },
  changeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  uploadingContainer: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  uploadingText: {
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
    gap: 4,
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
});
