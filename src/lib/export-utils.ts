import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { formatCurrency, formatDate, formatDateTime } from '@/utils';

export type ExportFormat = 'csv' | 'json';

export interface ExportColumn<T = any> {
  key: string;
  label: string;
  getValue: (item: T) => string | number | null | undefined;
  format?: (value: any) => string;
}

export interface ExportOptions<T = any> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  format: ExportFormat;
  title?: string;
}

/**
 * Generate CSV content from data
 */
function generateCSV<T>(data: T[], columns: ExportColumn<T>[]): string {
  // BOM for UTF-8 (helps Excel open files correctly)
  const BOM = '\uFEFF';

  // Header row
  const headers = columns.map(col => `"${col.label.replace(/"/g, '""')}"`).join(',');

  // Data rows
  const rows = data.map(item => {
    return columns
      .map(col => {
        let value = col.getValue(item);

        // Apply custom formatting if provided
        if (col.format && value !== null && value !== undefined) {
          value = col.format(value);
        }

        // Convert to string and escape quotes
        const stringValue = value !== null && value !== undefined ? String(value) : '';
        return `"${stringValue.replace(/"/g, '""')}"`;
      })
      .join(',');
  }).join('\n');

  return BOM + headers + '\n' + rows;
}

/**
 * Generate JSON content from data
 */
function generateJSON<T>(data: T[], columns: ExportColumn<T>[]): string {
  const jsonData = data.map(item => {
    const obj: Record<string, any> = {};
    columns.forEach(col => {
      let value = col.getValue(item);
      if (col.format && value !== null && value !== undefined) {
        value = col.format(value);
      }
      obj[col.key] = value;
    });
    return obj;
  });

  return JSON.stringify(jsonData, null, 2);
}

/**
 * Export data to a file and share it
 */
export async function exportData<T>(options: ExportOptions<T>): Promise<void> {
  try {
    const { data, columns, filename, format, title } = options;

    if (data.length === 0) {
      Alert.alert('Aviso', 'Não há dados para exportar');
      return;
    }

    // Generate content based on format
    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case 'csv':
        content = generateCSV(data, columns);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      case 'json':
        content = generateJSON(data, columns);
        mimeType = 'application/json';
        extension = 'json';
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    // Create filename with timestamp
    const timestamp = formatDate(new Date()).replace(/\//g, '-');
    const fullFilename = `${filename}_${timestamp}.${extension}`;

    // Write to file
    const fileUri = `${FileSystem.documentDirectory}${fullFilename}`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();

    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: title || 'Exportar dados',
        UTI: mimeType,
      });
    } else {
      Alert.alert(
        'Sucesso',
        `Arquivo exportado para: ${fileUri}\n\nNota: Compartilhamento não disponível neste dispositivo.`
      );
    }
  } catch (error) {
    console.error('Export error:', error);
    Alert.alert('Erro', 'Falha ao exportar dados');
    throw error;
  }
}

/**
 * Export items with common columns
 */
export async function exportItems(items: any[], format: ExportFormat = 'csv'): Promise<void> {
  const columns: ExportColumn[] = [
    {
      key: 'uniCode',
      label: 'Código',
      getValue: (item) => item.uniCode,
    },
    {
      key: 'name',
      label: 'Nome',
      getValue: (item) => item.name,
    },
    {
      key: 'brand',
      label: 'Marca',
      getValue: (item) => item.brand?.name,
    },
    {
      key: 'category',
      label: 'Categoria',
      getValue: (item) => item.category?.name,
    },
    {
      key: 'quantity',
      label: 'Quantidade',
      getValue: (item) => item.quantity,
      format: (value) => value?.toLocaleString('pt-BR') || '0',
    },
    {
      key: 'price',
      label: 'Preço',
      getValue: (item) => item.prices?.[0]?.value,
      format: (value) => (value !== null && value !== undefined ? formatCurrency(value) : '-'),
    },
    {
      key: 'monthlyConsumption',
      label: 'Consumo Mensal',
      getValue: (item) => item.monthlyConsumption,
      format: (value) => value?.toLocaleString('pt-BR') || '0',
    },
    {
      key: 'supplier',
      label: 'Fornecedor',
      getValue: (item) => item.supplier?.fantasyName,
    },
    {
      key: 'isActive',
      label: 'Status',
      getValue: (item) => item.isActive,
      format: (value) => (value ? 'Ativo' : 'Inativo'),
    },
    {
      key: 'createdAt',
      label: 'Criado em',
      getValue: (item) => item.createdAt,
      format: (value) => (value ? formatDateTime(new Date(value)) : '-'),
    },
  ];

  await exportData({
    data: items,
    columns,
    filename: 'items',
    format,
    title: 'Exportar Itens',
  });
}

/**
 * Export activities with common columns
 */
export async function exportActivities(activities: any[], format: ExportFormat = 'csv'): Promise<void> {
  const columns: ExportColumn[] = [
    {
      key: 'item',
      label: 'Item',
      getValue: (activity) => activity.item?.name,
    },
    {
      key: 'itemCode',
      label: 'Código',
      getValue: (activity) => activity.item?.uniCode,
    },
    {
      key: 'operation',
      label: 'Operação',
      getValue: (activity) => activity.operation,
      format: (value) => (value === 'INBOUND' ? 'Entrada' : 'Saída'),
    },
    {
      key: 'quantity',
      label: 'Quantidade',
      getValue: (activity) => activity.quantity,
      format: (value) => value?.toLocaleString('pt-BR') || '0',
    },
    {
      key: 'user',
      label: 'Usuário',
      getValue: (activity) => activity.user?.name || 'Sistema',
    },
    {
      key: 'reason',
      label: 'Motivo',
      getValue: (activity) => activity.reason,
    },
    {
      key: 'createdAt',
      label: 'Data',
      getValue: (activity) => activity.createdAt,
      format: (value) => (value ? formatDateTime(new Date(value)) : '-'),
    },
  ];

  await exportData({
    data: activities,
    columns,
    filename: 'activities',
    format,
    title: 'Exportar Movimentações',
  });
}

/**
 * Export borrows with common columns
 */
export async function exportBorrows(borrows: any[], format: ExportFormat = 'csv'): Promise<void> {
  const columns: ExportColumn[] = [
    {
      key: 'item',
      label: 'Item',
      getValue: (borrow) => borrow.item?.name,
    },
    {
      key: 'itemCode',
      label: 'Código',
      getValue: (borrow) => borrow.item?.uniCode,
    },
    {
      key: 'user',
      label: 'Colaborador',
      getValue: (borrow) => borrow.user?.name,
    },
    {
      key: 'quantity',
      label: 'Quantidade',
      getValue: (borrow) => borrow.quantity,
      format: (value) => value?.toLocaleString('pt-BR') || '0',
    },
    {
      key: 'status',
      label: 'Status',
      getValue: (borrow) => borrow.status,
      format: (value) => {
        switch (value) {
          case 'ACTIVE':
            return 'Ativo';
          case 'RETURNED':
            return 'Devolvido';
          case 'LOST':
            return 'Perdido';
          default:
            return value;
        }
      },
    },
    {
      key: 'createdAt',
      label: 'Emprestado em',
      getValue: (borrow) => borrow.createdAt,
      format: (value) => (value ? formatDateTime(new Date(value)) : '-'),
    },
    {
      key: 'returnedAt',
      label: 'Devolvido em',
      getValue: (borrow) => borrow.returnedAt,
      format: (value) => (value ? formatDateTime(new Date(value)) : '-'),
    },
  ];

  await exportData({
    data: borrows,
    columns,
    filename: 'borrows',
    format,
    title: 'Exportar Empréstimos',
  });
}

/**
 * Export orders with common columns
 */
export async function exportOrders(orders: any[], format: ExportFormat = 'csv'): Promise<void> {
  const columns: ExportColumn[] = [
    {
      key: 'id',
      label: 'Código',
      getValue: (order) => order.id,
    },
    {
      key: 'description',
      label: 'Descrição',
      getValue: (order) => order.description,
    },
    {
      key: 'supplier',
      label: 'Fornecedor',
      getValue: (order) => order.supplier?.fantasyName,
    },
    {
      key: 'status',
      label: 'Status',
      getValue: (order) => order.status,
    },
    {
      key: 'itemCount',
      label: 'Itens',
      getValue: (order) => order._count?.items || order.items?.length || 0,
    },
    {
      key: 'total',
      label: 'Valor Total',
      getValue: (order) => {
        if (order.items && order.items.length > 0) {
          const total = order.items.reduce((sum: number, item: any) => {
            const subtotal = item.orderedQuantity * item.price;
            const icmsAmount = subtotal * (item.icms / 100);
            const ipiAmount = subtotal * (item.ipi / 100);
            return sum + subtotal + icmsAmount + ipiAmount;
          }, 0);
          return total;
        }
        return 0;
      },
      format: (value) => formatCurrency(value as number),
    },
    {
      key: 'forecast',
      label: 'Previsão',
      getValue: (order) => order.forecast,
      format: (value) => (value ? formatDate(new Date(value)) : '-'),
    },
    {
      key: 'createdAt',
      label: 'Criado em',
      getValue: (order) => order.createdAt,
      format: (value) => (value ? formatDateTime(new Date(value)) : '-'),
    },
    {
      key: 'updatedAt',
      label: 'Atualizado em',
      getValue: (order) => order.updatedAt,
      format: (value) => (value ? formatDateTime(new Date(value)) : '-'),
    },
    {
      key: 'notes',
      label: 'Observações',
      getValue: (order) => order.notes,
    },
  ];

  await exportData({
    data: orders,
    columns,
    filename: 'pedidos',
    format,
    title: 'Exportar Pedidos',
  });
}
