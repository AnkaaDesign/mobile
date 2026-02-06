import React from 'react'
import { View } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import type { ListConfig } from '@/components/list/types'
import type { Task } from '@/types'
import {
  TASK_STATUS,
  TASK_STATUS_LABELS,
  SECTOR_PRIVILEGES,
  COMMISSION_STATUS,
  COMMISSION_STATUS_LABELS,
} from '@/constants'
import { canEditTasks, canDeleteTasks } from '@/utils/permissions/entity-permissions'
import { PaintPreview } from '@/components/painting/preview/painting-preview'
import { navigationTracker } from '@/utils/navigation-tracker'

// Helper to check if user is FINANCIAL or ADMIN
const isFinancialOrAdmin = (user: any): boolean => {
  const privilege = user?.sector?.privileges
  return privilege === SECTOR_PRIVILEGES.FINANCIAL || privilege === SECTOR_PRIVILEGES.ADMIN
}

export const historyListConfig: ListConfig<Task> = {
  key: 'production-history',
  title: 'Histórico de Produção',

  query: {
    hook: 'useTasksInfiniteMobile',
    defaultSort: { field: 'finishedAt', direction: 'desc' },
    pageSize: 25,
    // Use include for relations - scalar fields (including commission) are automatically included
    include: {
      customer: {
        select: {
          id: true,
          fantasyName: true,
        },
      },
      sector: {
        select: {
          id: true,
          name: true,
        },
      },
      generalPainting: {
        select: {
          id: true,
          name: true,
          hex: true,
          paintType: {
            select: {
              id: true,
              name: true,
            },
          },
          paintBrand: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      updatedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      serviceOrders: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      truck: {
        select: {
          id: true,
          plate: true,
          chassisNumber: true,
        },
      },
      observation: {
        select: {
          id: true,
          description: true,
        },
      },
    },
    where: {
      // Default: show COMPLETED for all users
      // FINANCIAL/ADMIN can change this using the status filter
      status: TASK_STATUS.COMPLETED,
    },
  },

  table: {
    columns: [
      {
        key: 'name',
        label: 'LOGOMARCA',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (task: Task) => {
          if (task.generalPainting?.hex) {
            return React.createElement(
              View,
              { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 } },
              React.createElement(
                ThemedText,
                { style: { flex: 1, marginRight: 8, fontSize: 12, fontWeight: '500' } },
                task.name
              ),
              React.createElement(PaintPreview, {
                paint: task.generalPainting,
                width: 24,
                height: 24,
                borderRadius: 4,
              })
            )
          }
          return task.name
        },
        style: { fontWeight: '500' },
      },
      {
        key: 'customer.fantasyName',
        label: 'CLIENTE',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (task) => task.customer?.fantasyName || '-',
      },
      {
        key: 'generalPainting.name',
        label: 'PINTURA',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (task) => task.generalPainting?.name || '-',
      },
      {
        key: 'sector.name',
        label: 'SETOR',
        sortable: true,
        width: 1.6,
        align: 'left',
        render: (task) => task.sector?.name || '-',
        format: 'badge',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.6,
        align: 'center',
        render: (task) => TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS] || task.status,
        format: 'badge',
      },
      {
        key: 'commission',
        label: 'COMISSÃO',
        sortable: true,
        sortField: 'commissionOrder',
        width: 1.6,
        align: 'center',
        render: (task) => task.commission ? COMMISSION_STATUS_LABELS[task.commission as keyof typeof COMMISSION_STATUS_LABELS] || task.commission : '-',
        format: 'badge',
        badgeEntity: 'COMMISSION_STATUS',
      },
      {
        key: 'serialNumber',
        label: 'Nº SÉRIE',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.serialNumber || '-',
      },
      {
        key: 'plate',
        label: 'PLACA',
        sortable: false, // Removed sorting - plate is on Truck entity
        width: 1.0,
        align: 'left',
        render: (task) => task.truck?.plate?.toUpperCase() || '-',
      },
      {
        key: 'chassisNumber',
        label: 'Nº CHASSI',
        sortable: false, // Removed sorting - chassisNumber is on Truck entity
        width: 1.5,
        align: 'left',
        render: (task) => task.truck?.chassisNumber || '-',
      },
      {
        key: 'entryDate',
        label: 'ENTRADA',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.entryDate,
        format: 'date',
      },
      {
        key: 'startedAt',
        label: 'INICIADO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.startedAt,
        format: 'datetime-multiline',
      },
      {
        key: 'finishedAt',
        label: 'FINALIZADO',
        sortable: true,
        width: 1,
        align: 'left',
        render: (task) => task.finishedAt,
        format: 'datetime-multiline',
      },
      {
        key: 'term',
        label: 'PRAZO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.term,
        format: 'datetime-multiline',
      },
      {
        key: 'services',
        label: 'SERVIÇOS',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (task) => String(task.serviceOrders?.length || 0),
        format: 'badge',
      },
      {
        key: 'details',
        label: 'DETALHES',
        sortable: false,
        width: 2.5,
        align: 'left',
        render: (task) => task.details || '-',
      },
      {
        key: 'observation',
        label: 'OBSERVAÇÃO',
        sortable: false,
        width: 2.5,
        align: 'left',
        render: (task) => task.observation?.description || '-',
      },
    ],
    defaultVisible: ['name', 'sector.name', 'finishedAt'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (task, router) => {
          navigationTracker.setSource('/(tabs)/producao/historico')
          router.push(`/producao/historico/detalhes/${task.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        canPerform: canEditTasks,
        onPress: (task, router) => {
          navigationTracker.setSource('/(tabs)/producao/historico')
          router.push(`/producao/cronograma/editar/${task.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        canPerform: canDeleteTasks,
        confirm: {
          title: 'Confirmar Exclusão',
          message: (task) => `Deseja excluir a tarefa "${task.name}"?`,
        },
        onPress: async (task, _, context) => {
          if (context?.delete) {
            await context.delete(task.id)
          }
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: [
          {
            label: TASK_STATUS_LABELS[TASK_STATUS.COMPLETED],
            value: TASK_STATUS.COMPLETED,
          },
          {
            label: TASK_STATUS_LABELS[TASK_STATUS.CANCELLED],
            value: TASK_STATUS.CANCELLED,
          },
        ],
        placeholder: 'Selecione os status',
        defaultValue: [TASK_STATUS.COMPLETED],
        // Only FINANCIAL and ADMIN can see status filter
        canView: isFinancialOrAdmin,
      },
      {
        key: 'customerIds',
        label: 'Clientes',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['customers', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getCustomers } = await import('@/api-client')
            const pageSize = 20
            const response = await getCustomers({
              where: searchTerm ? { fantasyName: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { fantasyName: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((customer: any) => ({
                label: customer.fantasyName,
                value: customer.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Customer Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os clientes',
      },
      {
        key: 'sectorIds',
        label: 'Setores',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['sectors', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getSectors } = await import('@/api-client')
            const pageSize = 20
            const response = await getSectors({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((sector: any) => ({
                label: sector.name,
                value: sector.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Sector Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os setores',
      },
      {
        key: 'assigneeIds',
        label: 'Finalizado por',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getUsers } = await import('@/api-client')
            const pageSize = 20
            const response = await getUsers({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((user: any) => ({
                label: user.name,
                value: user.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[User Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione quem finalizou',
      },
      {
        key: 'finishedDateRange',
        label: 'Data de Finalização',
        type: 'date-range',
        placeholder: 'Data de Finalização',
      },
      {
        key: 'entryDateRange',
        label: 'Data de Entrada',
        type: 'date-range',
        placeholder: 'Data de Entrada',
      },
      {
        key: 'startedDateRange',
        label: 'Data de Início',
        type: 'date-range',
        placeholder: 'Data de Início',
      },
      {
        key: 'priceRange',
        label: 'Preço',
        type: 'number-range',
        placeholder: { min: 'Mín', max: 'Máx' },
        // Only FINANCIAL and ADMIN can see price filter
        canView: isFinancialOrAdmin,
      },
    ],
  },

  search: {
    placeholder: 'Buscar por cliente, placa, chassi...',
    debounce: 500,
  },

  export: {
    title: 'Histórico de Produção',
    filename: 'historico-producao',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'customer', label: 'Cliente', path: 'customer.fantasyName' },
      { key: 'generalPainting', label: 'Pintura', path: 'generalPainting.name' },
      { key: 'sector', label: 'Setor', path: 'sector.name' },
      { key: 'status', label: 'Status', path: 'status' },
      { key: 'serialNumber', label: 'Nº Série', path: 'serialNumber' },
      { key: 'plate', label: 'Placa', path: 'truck.plate' },
      { key: 'chassisNumber', label: 'Nº Chassi', path: 'truck.chassisNumber' },
      { key: 'entryDate', label: 'Data de Entrada', path: 'entryDate', format: 'date' },
      { key: 'startedAt', label: 'Iniciado Em', path: 'startedAt', format: 'date' },
      { key: 'finishedAt', label: 'Finalizado Em', path: 'finishedAt', format: 'date' },
      { key: 'term', label: 'Prazo', path: 'term', format: 'date' },
      { key: 'details', label: 'Detalhes', path: 'details' },
      { key: 'observation', label: 'Observação', path: 'observation.description' },
    ],
  },

  actions: {
    bulk: [
      {
        key: 'update-status',
        label: 'Atualizar Status',
        icon: 'list-checks',
        variant: 'default',
        confirm: {
          title: 'Atualizar Status',
          message: (count) => `Deseja atualizar o status de ${count} ${count === 1 ? 'tarefa' : 'tarefas'}?`,
        },
        onPress: async (ids, context) => {
          // Implementation would need to prompt for new status
          if (context?.batchUpdateAsync) {
            await context.batchUpdateAsync({ ids: Array.from(ids), data: {} })
          }
        },
      },
      {
        key: 'update-sector',
        label: 'Atribuir Setor',
        icon: 'users',
        variant: 'default',
        confirm: {
          title: 'Atribuir Setor',
          message: (count) => `Deseja atribuir um setor a ${count} ${count === 1 ? 'tarefa' : 'tarefas'}?`,
        },
        onPress: async (ids, context) => {
          // Implementation would need to prompt for sector
          if (context?.batchUpdateAsync) {
            await context.batchUpdateAsync({ ids: Array.from(ids), data: {} })
          }
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'tarefa' : 'tarefas'}?`,
        },
        onPress: async (ids, context) => {
          if (context?.batchDeleteAsync) {
            await context.batchDeleteAsync({ ids: Array.from(ids) })
          }
        },
      },
    ],
  },
}
