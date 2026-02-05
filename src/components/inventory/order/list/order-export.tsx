import React from 'react';
import { ExportButton } from '@/components/ui/export-button';
import type { ExportFormat, ExportColumn } from '@/lib/export-utils';
import { exportData } from '@/lib/export-utils';
import type { Order } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/utils';
import { ORDER_STATUS_LABELS } from '@/constants';

interface OrderExportProps {
  orders: Order[];
  disabled?: boolean;
}

/**
 * Order Export Component for Mobile
 * Provides CSV and JSON export functionality for order lists
 */
export const OrderExport: React.FC<OrderExportProps> = ({ orders, disabled = false }) => {
  const handleExport = async (format: ExportFormat) => {
    const columns: ExportColumn<Order>[] = [
      {
        key: 'id',
        label: 'CÓDIGO',
        getValue: (order) => order.id,
      },
      {
        key: 'description',
        label: 'DESCRIÇÃO',
        getValue: (order) => order.description || '-',
      },
      {
        key: 'supplier',
        label: 'FORNECEDOR',
        getValue: (order) => order.supplier?.fantasyName || '-',
      },
      {
        key: 'itemCount',
        label: 'QTD. ITENS',
        getValue: (order) => order._count?.items || order.items?.length || 0,
      },
      {
        key: 'status',
        label: 'STATUS',
        getValue: (order) => order.status,
        format: (value) => ORDER_STATUS_LABELS[value as keyof typeof ORDER_STATUS_LABELS] || value,
      },
      {
        key: 'forecast',
        label: 'PREVISÃO',
        getValue: (order) => (order.forecast ? order.forecast.toISOString() : null),
        format: (value) => (value ? formatDate(new Date(value)) : '-'),
      },
      {
        key: 'total',
        label: 'VALOR TOTAL',
        getValue: (order) => {
          if (order.items && order.items.length > 0) {
            const total = order.items.reduce((sum, item) => {
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
        key: 'createdAt',
        label: 'CRIADO EM',
        getValue: (order) => order.createdAt.toISOString(),
        format: (value) => (value ? formatDateTime(new Date(value)) : '-'),
      },
      {
        key: 'updatedAt',
        label: 'ATUALIZADO EM',
        getValue: (order) => order.updatedAt.toISOString(),
        format: (value) => (value ? formatDateTime(new Date(value)) : '-'),
      },
      {
        key: 'notes',
        label: 'OBSERVAÇÕES',
        getValue: (order) => order.notes || '-',
      },
    ];

    await exportData({
      data: orders,
      columns,
      filename: 'pedidos',
      format,
      title: 'Exportar Pedidos',
    });
  };

  return <ExportButton onExport={handleExport} disabled={disabled || orders.length === 0} iconOnly />;
};
