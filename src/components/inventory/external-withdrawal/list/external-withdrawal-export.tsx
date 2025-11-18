import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Share, Platform } from 'react-native';
import { Modal, ModalContent, ModalHeader, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/lib/theme';
import { ExternalWithdrawal } from '@/types';
import { formatDate, formatCurrency } from '@/utils';
import {
  EXTERNAL_WITHDRAWAL_STATUS_LABELS,
  EXTERNAL_WITHDRAWAL_TYPE,
  EXTERNAL_WITHDRAWAL_TYPE_LABELS,
} from '@/constants';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface ExternalWithdrawalExportProps {
  visible: boolean;
  onClose: () => void;
  data: ExternalWithdrawal[];
  totalCount: number;
  selectedCount?: number;
  onFetchAll?: () => Promise<ExternalWithdrawal[]>;
}

type ExportFormat = 'csv' | 'json';
type ExportMode = 'current' | 'all' | 'selected';

export const ExternalWithdrawalExport = React.memo<ExternalWithdrawalExportProps>(
  ({ visible, onClose, data, totalCount, selectedCount = 0, onFetchAll }) => {
    const { colors } = useTheme();
    const [isExporting, setIsExporting] = useState(false);

    const generateCSV = useCallback((items: ExternalWithdrawal[]): string => {
      const headers = [
        'Retirador',
        'Status',
        'Tipo',
        'Itens',
        'Valor Total',
        'Data de Criação',
        'Observações',
      ];

      const rows = items.map((withdrawal) => {
        const itemCount = withdrawal.items?.length || 0;
        const totalValue =
          withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE && withdrawal.items
            ? withdrawal.items.reduce((sum, item) => {
                const price = item.price || item.unitPrice || 0;
                return sum + item.withdrawedQuantity * price;
              }, 0)
            : 0;

        return [
          `"${withdrawal.withdrawerName}"`,
          `"${EXTERNAL_WITHDRAWAL_STATUS_LABELS[withdrawal.status]}"`,
          `"${EXTERNAL_WITHDRAWAL_TYPE_LABELS[withdrawal.type]}"`,
          itemCount,
          totalValue > 0 ? formatCurrency(totalValue) : '-',
          formatDate(withdrawal.createdAt),
          `"${withdrawal.notes || '-'}"`,
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      // Add UTF-8 BOM for proper Excel encoding
      return '\uFEFF' + csvContent;
    }, []);

    const generateJSON = useCallback((items: ExternalWithdrawal[]): string => {
      const exportData = items.map((withdrawal) => {
        const itemCount = withdrawal.items?.length || 0;
        const totalValue =
          withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE && withdrawal.items
            ? withdrawal.items.reduce((sum, item) => {
                const price = item.price || item.unitPrice || 0;
                return sum + item.withdrawedQuantity * price;
              }, 0)
            : 0;

        return {
          id: withdrawal.id,
          withdrawerName: withdrawal.withdrawerName,
          status: EXTERNAL_WITHDRAWAL_STATUS_LABELS[withdrawal.status],
          type: EXTERNAL_WITHDRAWAL_TYPE_LABELS[withdrawal.type],
          itemCount,
          totalValue: totalValue > 0 ? totalValue : null,
          createdAt: withdrawal.createdAt,
          notes: withdrawal.notes,
          items: withdrawal.items?.map((item) => ({
            itemName: item.item?.name,
            withdrawedQuantity: item.withdrawedQuantity,
            returnedQuantity: item.returnedQuantity,
            price: item.price,
          })),
        };
      });

      return JSON.stringify(exportData, null, 2);
    }, []);

    const saveAndShareFile = useCallback(
      async (content: string, format: ExportFormat) => {
        try {
          const timestamp = new Date().toISOString().split('T')[0];
          const fileName = `retiradas_externas_${timestamp}.${format}`;
          const fileUri = `${FileSystem.documentDirectory}${fileName}`;

          // Write file
          await FileSystem.writeAsStringAsync(fileUri, content, {
            encoding: FileSystem.EncodingType.UTF8,
          });

          // Check if sharing is available
          const canShare = await Sharing.isAvailableAsync();

          if (canShare) {
            await Sharing.shareAsync(fileUri, {
              mimeType: format === 'csv' ? 'text/csv' : 'application/json',
              dialogTitle: 'Exportar Retiradas Externas',
              UTI: format === 'csv' ? 'public.comma-separated-values-text' : 'public.json',
            });
          } else if (Platform.OS === 'web') {
            // For web platform, use Share API
            await Share.share({
              message: content,
              title: 'Retiradas Externas',
            });
          } else {
            Alert.alert('Sucesso', `Arquivo salvo em: ${fileUri}`);
          }
        } catch (error) {
          console.error('Error saving/sharing file:', error);
          Alert.alert('Erro', 'Não foi possível exportar o arquivo.');
        }
      },
      []
    );

    const handleExport = useCallback(
      async (format: ExportFormat, mode: ExportMode) => {
        try {
          setIsExporting(true);

          let itemsToExport: ExternalWithdrawal[];

          if (mode === 'all' && onFetchAll) {
            itemsToExport = await onFetchAll();
          } else {
            itemsToExport = data;
          }

          if (itemsToExport.length === 0) {
            Alert.alert('Aviso', 'Não há dados para exportar.');
            return;
          }

          const content =
            format === 'csv' ? generateCSV(itemsToExport) : generateJSON(itemsToExport);

          await saveAndShareFile(content, format);
          onClose();
        } catch (error) {
          console.error('Export error:', error);
          Alert.alert('Erro', 'Não foi possível exportar os dados.');
        } finally {
          setIsExporting(false);
        }
      },
      [data, onFetchAll, generateCSV, generateJSON, saveAndShareFile, onClose]
    );

    return (
      <Modal visible={visible} onClose={onClose} animationType="slide">
        <ModalContent style={styles.modalContent}>
          <ModalHeader>
            <View style={styles.header}>
              <Icon name="download" size={20} color={colors.foreground} />
              <Text style={[styles.title, { color: colors.foreground }]}>Exportar</Text>
            </View>
          </ModalHeader>

          <View style={styles.content}>
            {/* Info */}
            <View style={styles.info}>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Registros visíveis: {data.length}
              </Text>
              {totalCount > data.length && (
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  Total: {totalCount}
                </Text>
              )}
              {selectedCount > 0 && (
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  Selecionados: {selectedCount}
                </Text>
              )}
            </View>

            {/* Export Options */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
                Formato de Exportação
              </Text>

              {/* CSV Export */}
              <View style={styles.optionGroup}>
                <Button
                  variant="outline"
                  onPress={() => handleExport('csv', 'current')}
                  disabled={isExporting || data.length === 0}
                  style={styles.optionButton}
                >
                  <Icon name="file-text" size={20} color={colors.foreground} />
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, { color: colors.foreground }]}>
                      CSV - Página Atual
                    </Text>
                    <Text style={[styles.optionDescription, { color: colors.mutedForeground }]}>
                      {data.length} registros
                    </Text>
                  </View>
                </Button>

                {onFetchAll && totalCount > data.length && (
                  <Button
                    variant="outline"
                    onPress={() => handleExport('csv', 'all')}
                    disabled={isExporting}
                    style={styles.optionButton}
                  >
                    <Icon name="file-text" size={20} color={colors.foreground} />
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionTitle, { color: colors.foreground }]}>
                        CSV - Todos
                      </Text>
                      <Text style={[styles.optionDescription, { color: colors.mutedForeground }]}>
                        {totalCount} registros
                      </Text>
                    </View>
                  </Button>
                )}
              </View>

              {/* JSON Export */}
              <View style={styles.optionGroup}>
                <Button
                  variant="outline"
                  onPress={() => handleExport('json', 'current')}
                  disabled={isExporting || data.length === 0}
                  style={styles.optionButton}
                >
                  <Icon name="file-code" size={20} color={colors.foreground} />
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, { color: colors.foreground }]}>
                      JSON - Página Atual
                    </Text>
                    <Text style={[styles.optionDescription, { color: colors.mutedForeground }]}>
                      {data.length} registros
                    </Text>
                  </View>
                </Button>

                {onFetchAll && totalCount > data.length && (
                  <Button
                    variant="outline"
                    onPress={() => handleExport('json', 'all')}
                    disabled={isExporting}
                    style={styles.optionButton}
                  >
                    <Icon name="file-code" size={20} color={colors.foreground} />
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionTitle, { color: colors.foreground }]}>
                        JSON - Todos
                      </Text>
                      <Text style={[styles.optionDescription, { color: colors.mutedForeground }]}>
                        {totalCount} registros
                      </Text>
                    </View>
                  </Button>
                )}
              </View>
            </View>
          </View>

          <ModalFooter>
            <Button variant="outline" onPress={onClose} disabled={isExporting}>
              <Text style={[styles.buttonText, { color: colors.foreground }]}>Cancelar</Text>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }
);

ExternalWithdrawalExport.displayName = 'ExternalWithdrawalExport';

const styles = StyleSheet.create({
  modalContent: {
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    gap: 24,
  },
  info: {
    gap: 4,
  },
  infoText: {
    fontSize: 13,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionGroup: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
