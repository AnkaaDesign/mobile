import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius } from '@/constants/design-system';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { ThemedText } from '@/components/ui/themed-text';
import { IconSwitch } from '@tabler/icons-react-native';
import { getCurrentApiUrl } from '@/api-client/axiosClient';
import type { CompanyAssetBlock, ImageSizePreset } from '../types';

interface CompanyAssetBlockEditorProps {
  block: CompanyAssetBlock;
  onUpdate: (updates: Partial<CompanyAssetBlock>) => void;
  disabled?: boolean;
}

const ASSETS: Array<{
  key: 'logo' | 'icon';
  label: string;
  description: string;
  path: string;
  defaultSize: ImageSizePreset;
}> = [
  { key: 'logo', label: 'Logo', description: 'Logotipo da empresa', path: '/logo.png', defaultSize: '75%' },
  { key: 'icon', label: 'Ícone', description: 'Ícone da empresa', path: '/android-chrome-192x192.png', defaultSize: '128px' },
];

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

export function CompanyAssetBlockEditor({ block, onUpdate, disabled }: CompanyAssetBlockEditorProps) {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const currentAsset = ASSETS.find((a) => a.key === block.asset) ?? ASSETS[0];
  const baseUrl = getCurrentApiUrl();
  const imageUri = `${baseUrl}${currentAsset.path}`;

  return (
    <View style={styles.container}>
      {/* Asset Preview */}
      <View style={[styles.preview, { backgroundColor: colors.muted }]}>
        <Image
          source={{ uri: imageUri }}
          style={styles.previewImage}
          resizeMode="contain"
        />
      </View>

      {/* Switch Asset Button */}
      <TouchableOpacity
        style={[styles.switchButton, { borderColor: colors.border }]}
        onPress={() => setShowPicker(true)}
        disabled={disabled}
      >
        <IconSwitch size={16} color={colors.foreground} />
        <ThemedText style={[styles.switchText, { color: colors.foreground }]}>Trocar Ativo</ThemedText>
      </TouchableOpacity>

      {/* Size and Alignment */}
      <View style={styles.row}>
        <View style={styles.halfField}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Tamanho</ThemedText>
          <Combobox
            options={SIZE_OPTIONS}
            value={block.size || '75%'}
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
            onValueChange={(val) => onUpdate({ alignment: val as CompanyAssetBlock['alignment'] })}
            placeholder="Alinhamento"
            disabled={disabled}
            searchable={false}
            clearable={false}
          />
        </View>
      </View>

      {/* Asset Picker Modal */}
      <Modal visible={showPicker} transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={[styles.modalTitle, { color: colors.foreground }]}>
              Selecionar Ativo da Empresa
            </ThemedText>
            <FlatList
              data={ASSETS}
              keyExtractor={(item) => item.key}
              numColumns={2}
              columnWrapperStyle={styles.assetGrid}
              renderItem={({ item: asset }) => {
                const isSelected = block.asset === asset.key;
                const assetUri = `${baseUrl}${asset.path}`;
                return (
                  <TouchableOpacity
                    style={[
                      styles.assetItem,
                      { borderColor: isSelected ? colors.primary : colors.border },
                      isSelected && { backgroundColor: colors.primary + '10' },
                    ]}
                    onPress={() => {
                      onUpdate({ asset: asset.key, size: asset.defaultSize });
                      setShowPicker(false);
                    }}
                  >
                    <Image
                      source={{ uri: assetUri }}
                      style={styles.assetImage}
                      resizeMode="contain"
                    />
                    <ThemedText
                      style={[
                        styles.assetLabel,
                        { color: isSelected ? colors.primary : colors.foreground },
                      ]}
                    >
                      {asset.label}
                    </ThemedText>
                    <ThemedText style={[styles.assetDescription, { color: colors.mutedForeground }]}>
                      {asset.description}
                    </ThemedText>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  preview: {
    width: '100%',
    height: 100,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '80%',
    height: 80,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: borderRadius.md,
  },
  switchText: {
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  assetGrid: {
    gap: spacing.sm,
  },
  assetItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  assetImage: {
    width: 64,
    height: 64,
  },
  assetLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  assetDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
});
