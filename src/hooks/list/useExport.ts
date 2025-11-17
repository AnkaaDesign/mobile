import { useState, useCallback } from 'react'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { Alert } from 'react-native'
import { format } from 'date-fns'
import type { ExportConfig, ExportFormat } from '@/components/list/types'

interface UseExportOptions<T> {
  data: T[]
  config?: ExportConfig
  selection: Set<string>
}

export function useExport<T extends { id: string }>({
  data,
  config,
  selection,
}: UseExportOptions<T>) {
  const [isExporting, setIsExporting] = useState(false)

  const onExport = useCallback(
    async (format: ExportFormat, mode: 'all' | 'selected') => {
      if (!config) return

      const exportData = mode === 'selected'
        ? data.filter((item) => selection.has(item.id))
        : data

      if (exportData.length === 0) {
        Alert.alert('Aviso', 'Não há dados para exportar')
        return
      }

      setIsExporting(true)

      try {
        let fileUri: string

        switch (format) {
          case 'csv':
            fileUri = await exportToCSV(exportData, config)
            break
          case 'json':
            fileUri = await exportToJSON(exportData, config)
            break
          case 'pdf':
            fileUri = await exportToPDF(exportData, config)
            break
          default:
            throw new Error(`Unsupported format: ${format}`)
        }

        // Share file
        await Sharing.shareAsync(fileUri, {
          mimeType: getMimeType(format),
          dialogTitle: `Exportar ${config.title || 'Dados'}`,
        })

        Alert.alert('Sucesso', 'Dados exportados com sucesso!')
      } catch (error) {
        console.error('Export error:', error)
        Alert.alert('Erro', 'Falha ao exportar dados')
      } finally {
        setIsExporting(false)
      }
    },
    [data, config, selection]
  )

  return {
    onExport,
    isExporting,
    disabled: data.length === 0,
  }
}

// Helper: Export to CSV
async function exportToCSV<T>(data: T[], config: ExportConfig): Promise<string> {
  const headers = config.columns.map((col) => col.label)
  const rows = data.map((item) =>
    config.columns.map((col) => {
      const value = getNestedValue(item, col.path || col.key)
      return formatValue(value, col.format)
    })
  )

  // Build CSV content with UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF'
  const csvContent =
    BOM +
    [headers.join(','), ...rows.map((row) => row.map(escapeCSV).join(','))].join('\n')

  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
  const filename = `${config.filename}_${timestamp}.csv`
  const fileUri = `${FileSystem.documentDirectory}${filename}`

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  })

  return fileUri
}

// Helper: Export to JSON
async function exportToJSON<T>(data: T[], config: ExportConfig): Promise<string> {
  const exportData = data.map((item) => {
    const obj: any = {}
    config.columns.forEach((col) => {
      const value = getNestedValue(item, col.path || col.key)
      obj[col.key] = formatValue(value, col.format)
    })
    return obj
  })

  const jsonContent = JSON.stringify(exportData, null, 2)
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
  const filename = `${config.filename}_${timestamp}.json`
  const fileUri = `${FileSystem.documentDirectory}${filename}`

  await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
    encoding: FileSystem.EncodingType.UTF8,
  })

  return fileUri
}

// Helper: Export to PDF (simplified - could use react-native-html-to-pdf)
async function exportToPDF<T>(data: T[], config: ExportConfig): Promise<string> {
  // For now, create a simple HTML and convert to PDF
  // This would need react-native-html-to-pdf or similar library
  // Placeholder implementation:
  throw new Error('PDF export not yet implemented')
}

// Helpers
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

function formatValue(value: any, formatType: any): string {
  if (value === null || value === undefined) return '-'

  if (typeof formatType === 'function') {
    return formatType(value)
  }

  switch (formatType) {
    case 'date':
      return value instanceof Date ? format(value, 'dd/MM/yyyy') : String(value)
    case 'datetime':
      return value instanceof Date ? format(value, 'dd/MM/yyyy HH:mm') : String(value)
    case 'currency':
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    case 'number':
      return new Intl.NumberFormat('pt-BR').format(value)
    case 'boolean':
      return value ? 'Sim' : 'Não'
    default:
      return String(value)
  }
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return 'text/csv'
    case 'json':
      return 'application/json'
    case 'pdf':
      return 'application/pdf'
    default:
      return 'application/octet-stream'
  }
}
