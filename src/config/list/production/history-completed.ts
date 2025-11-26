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

export const historyCompletedListConfig: ListConfig<Task> = {
  key: 'production-history-completed',
  title: 'Histórico - Concluídos',

  query: {
    hook: 'useTasksInfiniteMobile',
    defaultSort: { field: 'finishedAt', direction: 'desc' },
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
      status: {
        in: [TASK_STATUS.COMPLETED, TASK_STATUS.INVOICED, TASK_STATUS.SETTLED],
      },
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
        key: 'sector.name',
        label: 'SETOR',
        sortable: true,
        width: 1.4,
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
        key: 'finishedAt',
        label: 'FINALIZADO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.finishedAt,
        format: 'date',
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
        key: 'generalPainting.name',
        label: 'PINTURA',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (task) => task.generalPainting?.name || '-',
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
    defaultVisible: ['name', 'sector.name', 'status', 'finishedAt'],
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
            label: TASK_STATUS_LABELS[TASK_STATUS.INVOICED],
            value: TASK_STATUS.INVOICED,
          },
          {
            label: TASK_STATUS_LABELS[TASK_STATUS.SETTLED],
            value: TASK_STATUS.SETTLED,
          },
        ],
        placeholder: 'Selecione os status',
        defaultValue: [TASK_STATUS.COMPLETED, TASK_STATUS.INVOICED, TASK_STATUS.SETTLED],
      },
      {
        key: 'customerIds',
        label: 'Clientes',
        type: 'select',
        multiple: true,
        placeholder: 'Selecione os clientes',
      },
      {
        key: 'sectorIds',
        label: 'Setores',
        type: 'select',
        multiple: true,
        placeholder: 'Selecione os setores',
      },
      {
        key: 'assigneeIds',
        label: 'Finalizado por',
        type: 'select',
        multiple: true,
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
      },
    ],
  },

  search: {
    placeholder: 'Buscar por cliente, placa, chassi...',
    debounce: 300,
  },

  export: {
    title: 'Histórico - Concluídos',
    filename: 'historico-concluidos',
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
        onPress: async (ids, { batchUpdateAsync }) => {
          // Implementation would need to prompt for new status
          await batchUpdateAsync({ ids: Array.from(ids), data: {} })
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
