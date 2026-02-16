import React from 'react'
import { View, Alert } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import type { ListConfig } from '@/components/list/types'
import type { Task } from '@/types'
import { canEditTasks, canEditLayoutForTask, canLeaderManageTask, isLeader, canReleaseTasks, canAccessAdvancedTaskMenu, canViewLayouts, canChangeTaskSector, canCancelTasks, canAddArtworks } from '@/utils/permissions/entity-permissions'
import { canViewPricing } from '@/utils/permissions/pricing-permissions'
import { SECTOR_PRIVILEGES } from '@/constants'
import { navigationTracker } from '@/utils/navigation-tracker'

// Column visibility helpers matching web task-edit-form.tsx
const canViewRestrictedFields = (user: any) => {
  const privilege = user?.sector?.privileges
  return privilege === SECTOR_PRIVILEGES.ADMIN ||
         privilege === SECTOR_PRIVILEGES.FINANCIAL ||
         privilege === SECTOR_PRIVILEGES.COMMERCIAL ||
         privilege === SECTOR_PRIVILEGES.LOGISTIC ||
         privilege === SECTOR_PRIVILEGES.DESIGNER
}

const canViewCommissionField = (user: any) => {
  const privilege = user?.sector?.privileges
  return privilege === SECTOR_PRIVILEGES.ADMIN ||
         privilege === SECTOR_PRIVILEGES.FINANCIAL ||
         privilege === SECTOR_PRIVILEGES.COMMERCIAL ||
         privilege === SECTOR_PRIVILEGES.PRODUCTION
}

const canViewPriceField = (user: any) => {
  const privilege = user?.sector?.privileges
  return privilege === SECTOR_PRIVILEGES.ADMIN ||
         privilege === SECTOR_PRIVILEGES.FINANCIAL ||
         privilege === SECTOR_PRIVILEGES.COMMERCIAL
}
import {
  TASK_STATUS,
  TASK_STATUS_LABELS,
  COMMISSION_STATUS_LABELS,
  SERVICE_ORDER_STATUS,
} from '@/constants'
import { updateTask } from '@/api-client'
import { queryClient } from '@/lib/query-client'
import { taskKeys } from '@/hooks/queryKeys'
import { ServiceOrderProgressBar } from '@/components/production/task/service-order-progress-bar'
import { ForecastDateCell } from '@/components/production/task/forecast-date-cell'

// Helper to check if task has pending service orders
const hasPendingServiceOrders = (task: Task): boolean => {
  if (!task.serviceOrders || task.serviceOrders.length === 0) return false
  return task.serviceOrders.some(
    (service) => service.status === SERVICE_ORDER_STATUS.PENDING || service.status === SERVICE_ORDER_STATUS.IN_PROGRESS
  )
}
import { DeadlineCountdown } from '@/components/production/DeadlineCountdown'
import { PaintPreview } from '@/components/painting/preview/painting-preview'

// Statuses that should show the countdown
const COUNTDOWN_STATUSES = [
  TASK_STATUS.IN_PRODUCTION,
  TASK_STATUS.WAITING_PRODUCTION,
]

// Get row background color based on status and deadline (for cronograma only)
// NOTE: PREPARATION and WAITING_PRODUCTION statuses use neutral alternating colors (matching web version)
const getRowBackgroundColor = (task: Task, isDark: boolean = false) => {
  // For PREPARATION and WAITING_PRODUCTION: use neutral alternating colors (like web version)
  // Corner flags indicate issues, not row background colors
  if (task.status === TASK_STATUS.PREPARATION || task.status === TASK_STATUS.WAITING_PRODUCTION) {
    // Return null to use default alternating row colors (handled by the table component)
    return null
  }

  // For IN_PRODUCTION tasks: use term-based coloring (cronograma logic)
  if (task.status === TASK_STATUS.IN_PRODUCTION) {
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

  // For COMPLETED and other statuses: neutral color
  return isDark ? '#262626' : '#f5f5f5' // neutral-800 / neutral-100
}


export const tasksListConfig: ListConfig<Task> = {
  key: 'production-tasks',
  title: 'Tarefas',

  query: {
    hook: 'useTasksInfiniteMobile',
    defaultSort: { field: 'term', direction: 'asc' },
    pageSize: 25,
    // Use include for relations - scalar fields (including commission) are automatically included
    include: {
      customer: {
        select: {
          id: true,
          fantasyName: true, // Only fantasy name for lists - 60% less data
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
          finish: true,
          // NO formulas - major performance improvement
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
      truck: {
        select: {
          id: true,
          plate: true,
          chassisNumber: true,
        },
      },
      serviceOrders: {
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          managedSector: {
            select: {
              id: true,
            },
          },
        },
      },
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
        key: 'customer.fantasyName',
        label: 'CLIENTE',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (task) => task.customer?.fantasyName || '-',
      },
      {
        key: 'details',
        label: 'DETALHES',
        sortable: true,
        width: 1.1,
        align: 'left',
        render: (task) => task.details || '-',
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
        width: 1.3,
        align: 'left',
        render: (task) => task.term,
        format: 'date',
      },
      {
        key: 'forecastDate',
        label: 'PREVISÃO',
        sortable: true,
        width: 1.4,
        align: 'left',
        render: (task, context) => {
          // Use ForecastDateCell with corner flags for preparation route
          const navigationRoute = context?.navigationRoute === 'preparation' ? 'preparation' : 'schedule'
          return React.createElement(ForecastDateCell, {
            task,
            navigationRoute,
          })
        },
        // Only visible to ADMIN, FINANCIAL, COMMERCIAL, LOGISTIC, DESIGNER (matches web canViewRestrictedFields)
        canView: canViewRestrictedFields,
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
        key: 'identificador',
        label: 'IDENTIFICADOR',
        sortable: true,
        width: 1.2,
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
        sortField: 'commissionOrder',
        width: 1.2,
        align: 'center',
        render: (task) => task.commission ? COMMISSION_STATUS_LABELS[task.commission as keyof typeof COMMISSION_STATUS_LABELS] || task.commission : '-',
        format: 'badge',
        badgeEntity: 'COMMISSION_STATUS',
        // Only visible to ADMIN, FINANCIAL, COMMERCIAL, PRODUCTION (matches web canViewCommissionField)
        canView: canViewCommissionField,
      },
      {
        key: 'price',
        label: 'PREÇO',
        sortable: false,
        width: 1.0,
        align: 'right',
        render: (task) => task.pricing?.total || null,
        format: 'currency',
        // Only visible to ADMIN, FINANCIAL, COMMERCIAL (matches web canViewPricingSections)
        canView: canViewPriceField,
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
        width: 1.4,
        align: 'center',
        render: (task, context) => {
          // Pass navigationRoute to ServiceOrderProgressBar for corner flags
          const navigationRoute = context?.navigationRoute === 'preparation' ? 'preparation' : 'schedule'
          return React.createElement(ServiceOrderProgressBar, {
            task,
            compact: true,
            navigationRoute,
          })
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
          // task.term is typed as Date but comes as string from JSON API
          const termValue = task.term
          const deadlineStr = termValue
            ? (typeof termValue === 'string' ? termValue : (termValue as Date).toISOString())
            : null
          return React.createElement(DeadlineCountdown, {
            deadline: deadlineStr,
            showForStatuses: COUNTDOWN_STATUSES,
            currentStatus: task.status,
          })
        },
      },
    ],
    defaultVisible: ['name', 'serialNumber', 'term', 'remainingTime'],
    rowHeight: 48,
    getRowStyle: (task: Task, isDark?: boolean) => {
      const backgroundColor = getRowBackgroundColor(task, isDark)
      // If null, don't set backgroundColor - let the table handle alternating colors
      return backgroundColor ? { backgroundColor } : {}
    },
    actions: [
      // View action (handled by row click, not shown in swipe)
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (task, router) => {
          navigationTracker.setSource('/(tabs)/producao/cronograma')
          router.push(`/producao/cronograma/detalhes/${task.id}`)
        },
      },
      // Release action - sets forecastDate to today (ADMIN, LOGISTIC, COMMERCIAL)
      // Only visible for PREPARATION status tasks
      {
        key: 'release',
        label: 'Liberar',
        icon: 'calendar-check',
        variant: 'default',
        canPerform: canReleaseTasks,
        visible: (task: Task) => task.status === TASK_STATUS.PREPARATION,
        onPress: async (task: Task) => {
          try {
            await updateTask(task.id, {
              forecastDate: new Date(),
            })
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
            // API client already shows success/error alerts
          } catch (_error) {
            // API client already shows error alert
          }
        },
      },
      // Leader actions (start/finish) - only shown for leaders managing tasks
      {
        key: 'start',
        label: 'Iniciar Tarefa',
        icon: 'player-play',
        variant: 'default',
        canPerform: isLeader,
        visible: (task: Task, user: any) => {
          if (task.status !== TASK_STATUS.WAITING_PRODUCTION) return false
          return canLeaderManageTask(user, task.sectorId)
        },
        onPress: async (task: Task, router: any, context?) => {
          try {
            const user = context?.user
            const updateData: any = {
              status: TASK_STATUS.IN_PRODUCTION,
              startedAt: new Date().toISOString(),
            }

            if (!task.sectorId && user?.managedSector?.id) {
              updateData.sectorId = user.managedSector.id
            }

            await updateTask(task.id, updateData)
            queryClient.invalidateQueries({ queryKey: taskKeys.all })

            // API client already shows success alert
          } catch (_error) {
            // API client already shows error alert
          }
        },
      },
      {
        key: 'finish',
        label: 'Finalizar Tarefa',
        icon: 'circle-check',
        variant: 'default',
        canPerform: isLeader,
        visible: (task: Task, user: any) => {
          if (task.status !== TASK_STATUS.IN_PRODUCTION) return false
          if (!task.sectorId) return false
          return canLeaderManageTask(user, task.sectorId)
        },
        onPress: async (task: Task, router: any) => {
          try {
            if (hasPendingServiceOrders(task)) {
              Alert.alert(
                'Não é possível finalizar',
                'Existem ordens de serviço pendentes. Finalize todas as ordens de serviço antes de finalizar a tarefa.'
              )
              return
            }

            await updateTask(task.id, {
              status: TASK_STATUS.COMPLETED,
              finishedAt: new Date(),
            })

            queryClient.invalidateQueries({ queryKey: taskKeys.all })

            // API client already shows success alert
          } catch (_error) {
            // API client already shows error alert
          }
        },
      },
      // Order from left to right: Layout, Adicionar Artes, Copiar de Outra, Definir Setor, Editar, Deletar
      {
        key: 'layout',
        label: (task: Task) => {
          const hasLayout = task.truck?.leftSideLayoutId ||
                           task.truck?.rightSideLayoutId ||
                           task.truck?.backSideLayoutId
          return hasLayout ? 'Editar Layout' : 'Adicionar Layout'
        },
        icon: 'truck',
        variant: 'default',
        // ADMIN, LOGISTIC, or Team Leaders can view/edit layouts
        canPerform: canViewLayouts,
        visible: (task: Task, user: any) => canEditLayoutForTask(user, task.sectorId),
        onPress: (task, router, context) => {
          // Store navigation source for proper back navigation
          const currentPath = context?.route || '/(tabs)/producao/cronograma'
          console.log('[Tasks] Storing navigation source for layout:', currentPath)
          navigationTracker.setSource(currentPath)
          router.push(`/producao/cronograma/layout/${task.id}`)
        },
      },
      {
        key: 'addArtworks',
        label: 'Adicionar Artes',
        icon: 'photo',
        variant: 'default',
        // ADMIN, COMMERCIAL, FINANCIAL can add artworks (LOGISTIC excluded)
        canPerform: canAddArtworks,
        // Action is handled by TaskScheduleLayout - opens modal
      },
      {
        key: 'copyFromTask',
        label: 'Copiar de Outra',
        icon: 'clipboardCopy',
        variant: 'default',
        // ADMIN, COMMERCIAL, FINANCIAL, LOGISTIC can copy from another task
        canPerform: canAccessAdvancedTaskMenu,
        // Action is handled by TaskScheduleLayout - opens modal
      },
      {
        key: 'change-sector',
        label: 'Definir Setor',
        icon: 'users',
        variant: 'default',
        // ADMIN and LOGISTIC can change sector
        canPerform: canChangeTaskSector,
        // Action is handled by TaskScheduleLayout - opens modal
      },
      {
        key: 'pricing',
        label: 'Orçamento',
        icon: 'currency-real',
        variant: 'default',
        canPerform: (user: any) => canViewPricing(user?.sector?.privileges || ''),
        onPress: (task, router, context) => {
          // Store navigation source for proper back navigation
          const currentPath = context?.route || '/(tabs)/producao/agenda'
          console.log('[Tasks] Storing navigation source for pricing:', currentPath)
          navigationTracker.setSource(currentPath)
          router.push(`/producao/agenda/precificacao/${task.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar Tarefa',
        icon: 'pencil',
        variant: 'default',
        canPerform: canEditTasks,
        onPress: (task, router, context) => {
          // Store navigation source for proper back navigation
          // The context should have the route from renderContext
          const currentPath = context?.route || '/(tabs)/producao/cronograma'
          console.log('[Tasks] Storing navigation source for edit:', currentPath)
          navigationTracker.setSource(currentPath)
          router.push(`/producao/cronograma/editar/${task.id}`)
        },
      },
      {
        key: 'cancel',
        label: 'Cancelar Tarefa',
        icon: 'x',
        variant: 'destructive',
        // ADMIN, LOGISTIC, FINANCIAL, COMMERCIAL can cancel tasks
        canPerform: canCancelTasks,
        // Don't show for already cancelled tasks
        visible: (task: Task) => task.status !== TASK_STATUS.CANCELLED,
        confirm: {
          title: 'Confirmar Cancelamento',
          message: (task) => `Deseja cancelar a tarefa "${task.name}"?`,
        },
        onPress: async (task: Task) => {
          try {
            await updateTask(task.id, {
              status: TASK_STATUS.CANCELLED,
            })
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
            // API client already shows success/error alerts
          } catch (_error) {
            // API client already shows error alert
          }
        },
      },
    ],
  },

  filters: {
    defaultValues: {
      status: [TASK_STATUS.WAITING_PRODUCTION, TASK_STATUS.IN_PRODUCTION],
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
        type: 'toggle',
        placeholder: 'Mostrar apenas tarefas atrasadas',
      },
    ],
  },

  search: {
    placeholder: 'Buscar por nome, cliente, número de série, placa, setor...',
    debounce: 500,
  },

  export: {
    title: 'Cronograma',
    filename: 'cronograma',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Logomarca', path: 'name' },
      { key: 'customer', label: 'Cliente', path: 'customer.fantasyName' },
      { key: 'details', label: 'Detalhes', path: 'details' },
      { key: 'generalPainting', label: 'Pintura', path: 'generalPainting.name' },
      { key: 'serialNumber', label: 'Nº Série', path: 'serialNumber' },
      { key: 'chassisNumber', label: 'Nº Chassi', path: 'truck.chassisNumber' },
      { key: 'sector', label: 'Setor', path: 'sector.name' },
      { key: 'entryDate', label: 'Entrada', path: 'entryDate', format: 'date' },
      { key: 'startedAt', label: 'Iniciado Em', path: 'startedAt', format: 'datetime' },
      { key: 'term', label: 'Prazo', path: 'term', format: 'date' },
      { key: 'status', label: 'Status', path: 'status' },
      { key: 'details', label: 'Detalhes', path: 'details' },
      { key: 'price', label: 'Preço', path: 'pricing.total', format: 'currency' },
      { key: 'commission', label: 'Comissão', path: 'commission' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    // Note: Create button removed from schedule page - now only available on agenda page (em-preparacao)
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
        onPress: async (ids, { batchUpdateAsync } = {}) => {
          // Implementation would need to prompt for new status
          // This is a placeholder for the structure
          await batchUpdateAsync?.({ ids: Array.from(ids), data: {} })
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
        onPress: async (ids, { batchUpdateAsync } = {}) => {
          // Implementation would need to prompt for sector
          // This is a placeholder for the structure
          await batchUpdateAsync?.({ ids: Array.from(ids), data: {} })
        },
      },
    ],
  },
}
