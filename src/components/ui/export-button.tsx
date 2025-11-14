import React, { useState } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity} from 'react-native';
import { IconFileExport, IconFileTypeCsv, IconJson, IconX } from '@tabler/icons-react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Button } from './button';
import { useTheme } from '@/lib/theme';
import type { ExportFormat } from '@/lib/export-utils';

interface ExportButtonProps {
  onExport: (format: ExportFormat) => Promise<void>;
  disabled?: boolean;
  iconOnly?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  disabled = false,
  iconOnly = false,
}) => {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      await onExport(format);
      setModalVisible(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.card,
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.semibold as any,
      color: theme.colors.text,
    },
    closeButton: {
      padding: theme.spacing.xs,
    },
    formatOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    formatIcon: {
      marginRight: theme.spacing.md,
    },
    formatContent: {
      flex: 1,
    },
    formatTitle: {
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.medium as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.xxs,
    },
    formatDescription: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
    },
  });

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onPress={() => setModalVisible(true)}
        disabled={disabled}
      >
        <IconFileExport size={20} color={theme.colors.text} />
        {!iconOnly && <ThemedText style={{ marginLeft: theme.spacing.xs }}>Exportar</ThemedText>}
      </Button>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !isExporting && setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !isExporting && setModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <ThemedText style={styles.title}>Exportar Dados</ThemedText>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => !isExporting && setModalVisible(false)}
                  disabled={isExporting}
                >
                  <IconX size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ThemedText
                style={{
                  marginBottom: theme.spacing.lg,
                  color: theme.colors.textSecondary,
                }}
              >
                Escolha o formato de exportação:
              </ThemedText>

              {/* CSV Option */}
              <TouchableOpacity
                style={styles.formatOption}
                onPress={() => handleExport('csv')}
                disabled={isExporting}
              >
                <IconFileTypeCsv
                  size={32}
                  color={theme.colors.primary}
                  style={styles.formatIcon}
                />
                <View style={styles.formatContent}>
                  <ThemedText style={styles.formatTitle}>CSV</ThemedText>
                  <ThemedText style={styles.formatDescription}>
                    Compatível com Excel e Google Sheets
                  </ThemedText>
                </View>
              </TouchableOpacity>

              {/* JSON Option */}
              <TouchableOpacity
                style={styles.formatOption}
                onPress={() => handleExport('json')}
                disabled={isExporting}
              >
                <IconJson
                  size={32}
                  color={theme.colors.primary}
                  style={styles.formatIcon}
                />
                <View style={styles.formatContent}>
                  <ThemedText style={styles.formatTitle}>JSON</ThemedText>
                  <ThemedText style={styles.formatDescription}>
                    Formato estruturado para processamento
                  </ThemedText>
                </View>
              </TouchableOpacity>

              {isExporting && (
                <ThemedText
                  style={{
                    marginTop: theme.spacing.md,
                    textAlign: 'center',
                    color: theme.colors.textSecondary,
                  }}
                >
                  Exportando...
                </ThemedText>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};
