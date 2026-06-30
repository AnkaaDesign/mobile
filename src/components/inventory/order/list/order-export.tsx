import React from 'react';
import { ExportButton } from '@/components/ui/export-button';
import type { ExportFormat, ExportColumn } from '@/lib/export-utils';
import { exportData } from '@/lib/export-utils';
import type { Order } from '@/types';
import { formatCurrency, formatDate, formatDateTime, resolveOrderTotal } from '@/utils';
import { ORDER_STATUS_LABELS } from '@/constants';
import { useCanViewPrices } from '@/hooks';

interface OrderExportProps {
  orders: Order[];
  disabled?: boolean;
}

/**
 * Order Export Component for Mobile
 * Provides CSV and JSON export functionality for order lists
 */
export const OrderExport: React.FC<OrderExportProps> = ({ orders, disabled = false }) => {
  const canViewPrices = useCanViewPrices();

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
      ...(canViewPrices
        ? [{
            key: 'total',
            label: 'VALOR TOTAL',
            getValue: (order: Order) => {
              let computed = 0;
              if (order.items && order.items.length > 0) {
                computed = order.items.reduce((sum, item) => {
                  const subtotal = item.orderedQuantity * item.price;
                  const icmsAmount = subtotal * (item.icms / 100);
                  const ipiAmount = subtotal * (item.ipi / 100);
                  return sum + subtotal + icmsAmount + ipiAmount;
                }, 0);
              }
              // A manual override (Valor Total) wins over the computed total.
              return resolveOrderTotal(order, computed);
            },
            format: (value: unknown) => formatCurrency(value as number),
          } as ExportColumn<Order>]
        : []),
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
