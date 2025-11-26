import React from 'react'
import { View } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import type { ListConfig } from '@/components/list/types'
import type { Task } from '@/types'
import { canCreateTasks, canEditTasks, canDeleteTasks } from '@/utils/permissions/entity-permissions'
import { useAuth } from '@/hooks/useAuth'
import {
  TASK_STATUS,
  TASK_STATUS_LABELS,
  COMMISSION_STATUS,
} from '@/constants'
import { DeadlineCountdown } from '@/components/production/DeadlineCountdown'
import { PaintPreview } from '@/components/painting/preview/painting-preview'
import { PAINT_FINISH } from '@/constants/enums'

// Statuses that should show the countdown
const COUNTDOWN_STATUSES = [
  TASK_STATUS.IN_PRODUCTION,
  TASK_STATUS.PENDING,
  TASK_STATUS.ON_HOLD,
]

// Get row background color based on status and deadline
// Matches web version logic exactly
const getRowBackgroundColor = (task: Task, isDark: boolean = false) => {
  // Non-production tasks (PENDING, COMPLETED, CANCELLED, ON_HOLD) use neutral gray
  if (task.status !== TASK_STATUS.IN_PRODUCTION) {
    return isDark ? '#262626' : '#f5f5f5' // neutral-800 / neutral-100
  }

  // Tasks with no deadline use neutral gray
  if (!task.term) {
    return isDark ? '#262626' : '#f5f5f5' // neutral-800 / neutral-100
  }

  // Check if task is overdue
  const now = new Date()
  const deadline = new Date(task.term)
  const diffMs = deadline.getTime() - now.getTime()

  if (diffMs < 0) {
    // Overdue - red
    return isDark ? '#7f1d1d' : '#fecaca' // red-900 / red-200
  }

  // Calculate hours remaining for active production tasks
  const hoursRemaining = diffMs / (1000 * 60 * 60)

  if (hoursRemaining > 4) {
    // Safe - green (>4 hours)
    return isDark ? '#14532d' : '#bbf7d0' // green-900 / green-200
  } else {
    // Warning - orange (0-4 hours)
    return isDark ? '#7c2d12' : '#fed7aa' // orange-900 / orange-200
  }
}


export const tasksListConfig: ListConfig<Task> = {
  key: 'production-tasks',
  title: 'Tarefas',

  query: {
    hook: 'useTasksInfiniteMobile',
    defaultSort: { field: 'term', direction: 'asc' },
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
      truck: true,
      services: {
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: true,
    },
  },

  table: {
    columns: [
      {
        key: 'name',
        label: 'LOGOMARCA',
        sortable: true,
        width: 1.8,
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
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (task) => TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS] || task.status,
        format: 'badge',
      },
      {
        key: 'priority',
        label: 'PRIORIDADE',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (task) => String(task.priority || '-'),
        format: 'badge',
      },
      {
        key: 'customer.fantasyName',
        label: 'CLIENTE',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (task) => task.customer?.fantasyName || '-',
      },
      {
        key: 'measures',
        label: 'MEDIDAS',
        sortable: true,
        width: 1.1,
        align: 'left',
        render: (task) => task.measures || '-',
      },
      {
        key: 'sector.name',
        label: 'SETOR',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.sector?.name || 'Sem setor',
      },
      {
        key: 'term',
        label: 'PRAZO',
        sortable: true,
        width: 1.1,
        align: 'left',
        render: (task) => task.term,
        format: 'date',
      },
      {
        key: 'entryDate',
        label: 'ENTRADA',
        sortable: true,
        width: 1.1,
        align: 'left',
        render: (task) => task.entryDate,
        format: 'date',
      },
      {
        key: 'startedAt',
        label: 'INICIADO EM',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (task) => task.startedAt,
        format: 'datetime',
      },
      {
        key: 'finishedAt',
        label: 'FINALIZADO EM',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (task) => task.finishedAt,
        format: 'datetime',
      },
      {
        key: 'serialNumber',
        label: 'Nº SÉRIE',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (task) => task.serialNumber || task.truck?.plate || '-',
      },
      {
        key: 'chassisNumber',
        label: 'Nº CHASSI',
        sortable: true,
        width: 1.4,
        align: 'left',
        render: (task) => task.truck?.chassisNumber || '-',
      },
      {
        key: 'details',
        label: 'DETALHES',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (task) => task.details || '-',
      },
      {
        key: 'commission',
        label: 'COMISSÃO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (task) => task.commission || '-',
        format: 'badge',
      },
      {
        key: 'price',
        label: 'PREÇO',
        sortable: true,
        width: 1.0,
        align: 'right',
        render: (task) => task.price || null,
        format: 'currency',
      },
      {
        key: 'generalPainting.name',
        label: 'PINTURA',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (task) => task.generalPainting?.name || '-',
      },
      {
        key: 'services',
        label: 'SERVIÇOS',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (task) => {
          if (!task.services || task.services.length === 0) return '-'
          return task.services.map((s: any) => s.name).join(', ')
        },
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.createdAt,
        format: 'date',
      },
      {
        key: 'remainingTime',
        label: 'TEMPO RESTANTE',
        sortable: true,
        width: 1.1,
        align: 'left',
        render: (task) => {
          return React.createElement(DeadlineCountdown, {
            deadline: task.term,
            showForStatuses: COUNTDOWN_STATUSES,
            currentStatus: task.status,
          })
        },
      },
    ],
    defaultVisible: ['name', 'serialNumber', 'remainingTime'],
    rowHeight: 48,
    getRowStyle: (task, isDark) => ({
      backgroundColor: getRowBackgroundColor(task, isDark),
    }),
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
    defaultValues: {
      status: [TASK_STATUS.PENDING, TASK_STATUS.IN_PRODUCTION],
    },
    fields: [
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
        key: 'termRange',
        label: 'Prazo',
        type: 'date-range',
        placeholder: 'Prazo',
      },
      {
        key: 'isOverdue',
        label: 'Mostrar apenas tarefas atrasadas',
        type: 'switch',
        placeholder: 'Mostrar apenas tarefas atrasadas',
      },
    ],
  },

  search: {
    placeholder: 'Buscar por nome, cliente, número de série, placa, setor...',
    debounce: 300,
  },

  export: {
    title: 'Cronograma',
    filename: 'cronograma',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Logomarca', path: 'name' },
      { key: 'customer', label: 'Cliente', path: 'customer.fantasyName' },
      { key: 'measures', label: 'Medidas', path: 'measures' },
      { key: 'generalPainting', label: 'Pintura', path: 'generalPainting.name' },
      { key: 'serialNumber', label: 'Nº Série', path: 'serialNumber' },
      { key: 'chassisNumber', label: 'Nº Chassi', path: 'truck.chassisNumber' },
      { key: 'sector', label: 'Setor', path: 'sector.name' },
      { key: 'entryDate', label: 'Entrada', path: 'entryDate', format: 'date' },
      { key: 'startedAt', label: 'Iniciado Em', path: 'startedAt', format: 'datetime' },
      { key: 'finishedAt', label: 'Finalizado Em', path: 'finishedAt', format: 'datetime' },
      { key: 'term', label: 'Prazo', path: 'term', format: 'date' },
      { key: 'status', label: 'Status', path: 'status' },
      { key: 'priority', label: 'Prioridade', path: 'priority' },
      { key: 'details', label: 'Detalhes', path: 'details' },
      { key: 'price', label: 'Preço', path: 'price', format: 'currency' },
      { key: 'commission', label: 'Comissão', path: 'commission' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Tarefa',
      route: '/producao/cronograma/cadastrar',
      canCreate: canCreateTasks,
    },
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
          // This is a placeholder for the structure
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
          // This is a placeholder for the structure
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
