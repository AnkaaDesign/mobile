import { memo, useState, useCallback } from 'react'
import { View, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { useTheme } from '@/lib/theme'
import { IconFileExport, IconX, IconFileTypeCsv, IconJson, IconFileTypePdf } from '@tabler/icons-react-native'
import type { ExportProps, ExportFormat } from '../types'

export const Export = memo(function Export({
  onExport,
  isExporting,
  disabled = false,
  formats,
  hasSelection,
  selectedCount,
  totalCount,
}: ExportProps) {
  const { colors } = useTheme()
  const [modalVisible, setModalVisible] = useState(false)
  const [exportMode, setExportMode] = useState<'all' | 'selected'>('all')

  const handleOpen = useCallback(() => {
    if (!disabled) {
      setExportMode(hasSelection ? 'selected' : 'all')
      setModalVisible(true)
    }
  }, [disabled, hasSelection])

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      try {
        await onExport(format, exportMode)
        setModalVisible(false)
      } catch (error) {
        console.error('Export error:', error)
      }
    },
    [onExport, exportMode]
  )

  return (
    <>
      <TouchableOpacity
        onPress={handleOpen}
        disabled={disabled}
        style={[
          styles.button,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          disabled && styles.buttonDisabled,
        ]}
        activeOpacity={0.7}
      >
        <IconFileExport size={20} color={disabled ? colors.mutedForeground : colors.foreground} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: colors.foreground }]}>
                Exportar Dados
              </ThemedText>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <IconX size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Export Mode Selection */}
            {hasSelection && (
              <View style={styles.modeSelection}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    {
                      backgroundColor: exportMode === 'all' ? colors.primary : colors.muted,
                      borderColor: exportMode === 'all' ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setExportMode('all')}
                >
                  <ThemedText
                    style={[
                      styles.modeText,
                      { color: exportMode === 'all' ? '#fff' : colors.foreground },
                    ]}
                  >
                    Exportar Todos ({totalCount})
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    {
                      backgroundColor: exportMode === 'selected' ? colors.primary : colors.muted,
                      borderColor: exportMode === 'selected' ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setExportMode('selected')}
                >
                  <ThemedText
                    style={[
                      styles.modeText,
                      { color: exportMode === 'selected' ? '#fff' : colors.foreground },
                    ]}
                  >
                    Exportar Selecionados ({selectedCount})
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {/* Format Options */}
            <View style={styles.formats}>
              {formats.includes('csv') && (
                <TouchableOpacity
                  style={[styles.formatOption, { borderColor: colors.border }]}
                  onPress={() => handleExport('csv')}
                  disabled={isExporting}
                  activeOpacity={0.7}
                >
                  <IconFileTypeCsv size={32} color={colors.primary} />
                  <View style={styles.formatInfo}>
                    <ThemedText style={[styles.formatTitle, { color: colors.foreground }]}>
                      CSV
                    </ThemedText>
                    <ThemedText style={[styles.formatDescription, { color: colors.mutedForeground }]}>
                      Excel e Google Sheets
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              )}

              {formats.includes('json') && (
                <TouchableOpacity
                  style={[styles.formatOption, { borderColor: colors.border }]}
                  onPress={() => handleExport('json')}
                  disabled={isExporting}
                  activeOpacity={0.7}
                >
                  <IconJson size={32} color={colors.primary} />
                  <View style={styles.formatInfo}>
                    <ThemedText style={[styles.formatTitle, { color: colors.foreground }]}>
                      JSON
                    </ThemedText>
                    <ThemedText style={[styles.formatDescription, { color: colors.mutedForeground }]}>
                      Formato estruturado
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              )}

              {formats.includes('pdf') && (
                <TouchableOpacity
                  style={[styles.formatOption, { borderColor: colors.border }]}
                  onPress={() => handleExport('pdf')}
                  disabled={isExporting}
                  activeOpacity={0.7}
                >
                  <IconFileTypePdf size={32} color={colors.primary} />
                  <View style={styles.formatInfo}>
                    <ThemedText style={[styles.formatTitle, { color: colors.foreground }]}>
                      PDF
                    </ThemedText>
                    <ThemedText style={[styles.formatDescription, { color: colors.mutedForeground }]}>
                      Documento portátil
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Loading Indicator */}
            {isExporting && (
              <View style={styles.loading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <ThemedText style={[styles.loadingText, { color: colors.mutedForeground }]}>
                  Exportando...
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  )
})

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  modeSelection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formats: {
    gap: 12,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
  },
  formatInfo: {
    flex: 1,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  formatDescription: {
    fontSize: 13,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  loadingText: {
    fontSize: 14,
  },
})
