import React from 'react'
import { View } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import type { ListConfig } from '@/components/list/types'
import type { Task, User } from '@/types'
import {
  TASK_STATUS,
  TASK_STATUS_LABELS,
} from '@/constants'
import { canEditTasks, canDeleteTasks } from '@/utils/permissions/entity-permissions'
import { PaintPreview } from '@/components/painting/preview/painting-preview'
import { PAINT_FINISH } from '@/constants/enums'

export const historyCancelledListConfig: ListConfig<Task> = {
  key: 'production-history-cancelled',
  title: 'Histórico de Cancelados',

  query: {
    hook: 'useTasksInfiniteMobile',
    defaultSort: { field: 'updatedAt', direction: 'desc' },
    pageSize: 25,
    include: {
      customer: true,
      sector: true,
      generalPainting: {
        include: {
          paintType: true,
          paintBrand: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      services: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    where: {
      status: TASK_STATUS.CANCELLED,
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
        width: 1.4,
        align: 'left',
        render: (task) => task.sector?.name || '-',
        format: 'badge',
      },
      {
        key: 'updatedBy.name',
        label: 'CANCELADO POR',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (task) => task.updatedBy?.name || '-',
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
        sortable: false,
        width: 1.0,
        align: 'left',
        render: (task) => task.truck?.plate?.toUpperCase() || '-',
      },
      {
        key: 'chassisNumber',
        label: 'Nº CHASSI',
        sortable: false,
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
        key: 'updatedAt',
        label: 'CANCELADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.updatedAt,
        format: 'date',
      },
      {
        key: 'term',
        label: 'PRAZO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.term,
        format: 'date',
      },
      {
        key: 'services',
        label: 'SERVIÇOS',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (task) => String(task.services?.length || 0),
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
    defaultVisible: ['name', 'customer.fantasyName', 'updatedAt', 'updatedBy.name'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (task, router) => {
          router.push(`/producao/cronograma/detalhes/${task.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        canPerform: canEditTasks,
        onPress: (task, router) => {
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
        onPress: async (task, _, { delete: deleteTask }) => {
          await deleteTask(task.id)
        },
      },
    ],
  },

  filters: {
    fields: [
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
        key: 'updatedByIds',
        label: 'Cancelado por',
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
        placeholder: 'Selecione quem cancelou',
      },
      {
        key: 'updatedDateRange',
        label: 'Data de Cancelamento',
        type: 'date-range',
        placeholder: 'Data de Cancelamento',
      },
      {
        key: 'entryDateRange',
        label: 'Data de Entrada',
        type: 'date-range',
        placeholder: 'Data de Entrada',
      },
      {
        key: 'priceRange',
        label: 'Preço',
        type: 'number-range',
        placeholder: { min: 'Mín', max: 'Máx' },
      },
    ],
  },

  search: {
    placeholder: 'Buscar por cliente, placa, chassi...',
    debounce: 300,
  },

  export: {
    title: 'Histórico de Cancelados',
    filename: 'historico-cancelados',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'customer', label: 'Cliente', path: 'customer.fantasyName' },
      { key: 'generalPainting', label: 'Pintura', path: 'generalPainting.name' },
      { key: 'sector', label: 'Setor', path: 'sector.name' },
      { key: 'updatedBy', label: 'Cancelado Por', path: 'updatedBy.name' },
      { key: 'serialNumber', label: 'Nº Série', path: 'serialNumber' },
      { key: 'plate', label: 'Placa', path: 'truck.plate' },
      { key: 'chassisNumber', label: 'Nº Chassi', path: 'truck.chassisNumber' },
      { key: 'entryDate', label: 'Data de Entrada', path: 'entryDate', format: 'date' },
      { key: 'updatedAt', label: 'Cancelado Em', path: 'updatedAt', format: 'date' },
      { key: 'term', label: 'Prazo', path: 'term', format: 'date' },
      { key: 'details', label: 'Detalhes', path: 'details' },
      { key: 'observation', label: 'Observação', path: 'observation.description' },
    ],
  },

  actions: {
    bulk: [
      {
        key: 'update-sector',
        label: 'Atribuir Setor',
        icon: 'users',
        variant: 'default',
        confirm: {
          title: 'Atribuir Setor',
          message: (count) => `Deseja atribuir um setor a ${count} ${count === 1 ? 'tarefa' : 'tarefas'}?`,
        },
        onPress: async (ids, { batchUpdateAsync }) => {
          // Implementation would need to prompt for sector
          await batchUpdateAsync({ ids: Array.from(ids), data: {} })
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
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
