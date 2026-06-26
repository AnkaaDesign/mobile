import React from 'react'
import { View } from 'react-native'
import type { ListConfig } from '@/components/list/types'
import type { Vacation, User } from '@/types'
import { VACATION_STATUS } from '@/constants/enums'
import { VACATION_STATUS_LABELS } from '@/constants/enum-labels'
import { canDeleteDpRecords } from '@/utils/permissions/entity-permissions'
import { isVacationInProgress, isConcessiveExpired, isConcessiveExpiringSoon } from '@/components/personnel-department/vacation/vacation-utils'
import { Badge } from '@/components/ui/badge'
import { ThemedText } from '@/components/ui/themed-text'
import { formatDate } from '@/utils/formatters'
import type { BadgeVariant } from '@/constants/badge-colors'
import { hasAnyPrivilege } from '@/utils'
import { SECTOR_PRIVILEGES } from '@/constants'

/**
 * Manage (create / edit / mark-as-paid) férias is ACCOUNTING / HR / ADMIN.
 * PRODUCTION_MANAGER has read-only access (mirrors the web list+detail pages
 * and the API @Roles). This is broader than the shared `canEditHrEntities`
 * helper (which omits ACCOUNTING), so it is defined locally for vacations.
 */
function canManageVacations(user: User | null): boolean {
  if (!user) return false
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ACCOUNTING,
    SECTOR_PRIVILEGES.HUMAN_RESOURCES,
    SECTOR_PRIVILEGES.ADMIN,
  ])
}

// Status → Badge variant (no VACATION entry in getBadgeVariant; map inline like warnings).
// SCHEDULED = warning/amber, PAID = success/green, EXPIRED = destructive/red.
const STATUS_VARIANT: Record<VACATION_STATUS, BadgeVariant> = {
  [VACATION_STATUS.SCHEDULED]: 'warning',
  [VACATION_STATUS.PAID]: 'success',
  [VACATION_STATUS.EXPIRED]: 'destructive',
}

export const vacationsListConfig: ListConfig<Vacation> = {
  key: 'hr-vacations',
  title: 'Férias',

  query: {
    hook: 'useVacationsInfinite',
    mutationsHook: 'useVacationMutations',
    batchMutationsHook: 'useVacationBatchMutations',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      user: { include: { position: true, sector: true } },
    },
  },

  table: {
    columns: [
      // COLABORADOR (+ "Coletiva" badge when groupId is set)
      {
        key: 'user.name',
        label: 'COLABORADOR',
        sortable: true,
        width: 2.2,
        align: 'left',
        render: (v) =>
          React.createElement(
            View,
            { style: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 } },
            React.createElement(
              ThemedText,
              { numberOfLines: 1, style: { flexShrink: 1, fontSize: 14, fontWeight: '500' } },
              v.user?.name || '—',
            ),
            v.groupId ? React.createElement(Badge, { variant: 'secondary', size: 'sm' }, 'Coletiva') : null,
          ),
      },
      // PERÍODO AQUISITIVO (start — end)
      {
        key: 'acquisitiveStart',
        label: 'PERÍODO AQUISITIVO',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (v) =>
          v.acquisitiveStart && v.acquisitiveEnd
            ? `${formatDate(v.acquisitiveStart)} — ${formatDate(v.acquisitiveEnd)}`
            : '—',
      },
      // LIMITE CONCESSIVO (date + Vencido / A vencer badge)
      {
        key: 'concessiveEnd',
        label: 'LIMITE CONCESSIVO',
        sortable: true,
        width: 1.6,
        align: 'left',
        render: (v) => {
          if (!v.concessiveEnd) return '—'
          const expired = isConcessiveExpired(v)
          const expiring = isConcessiveExpiringSoon(v)
          return React.createElement(
            View,
            { style: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 } },
            React.createElement(ThemedText, { numberOfLines: 1, style: { fontSize: 14 } }, formatDate(v.concessiveEnd)),
            expired
              ? React.createElement(Badge, { variant: 'destructive', size: 'sm' }, 'Vencido')
              : expiring
                ? React.createElement(Badge, { variant: 'warning', size: 'sm' }, 'A vencer')
                : null,
          )
        },
      },
      // GOZO (startDate · N dia(s))
      {
        key: 'gozo',
        label: 'GOZO',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (v) => {
          const dias = v.days ?? 0
          if (v.startDate) return `${formatDate(v.startDate)} · ${dias} dia${dias > 1 ? 's' : ''}`
          return dias > 0 ? `Não agendado · ${dias} dias` : 'Não agendado'
        },
      },
      // DIAS DE DIREITO
      {
        key: 'entitledDays',
        label: 'DIAS DE DIREITO',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (v) => String(v.entitledDays ?? 0),
      },
      // ABONO
      {
        key: 'abonoPecuniarioDays',
        label: 'ABONO',
        sortable: false,
        width: 0.9,
        align: 'center',
        render: (v) =>
          (v.abonoPecuniarioDays ?? 0) > 0
            ? React.createElement(Badge, { variant: 'secondary', size: 'sm' }, `${v.abonoPecuniarioDays} dia${v.abonoPecuniarioDays > 1 ? 's' : ''}`)
            : '—',
      },
      // DOBRO (art. 137)
      {
        key: 'isDouble',
        label: 'DOBRO',
        sortable: false,
        width: 0.9,
        align: 'center',
        render: (v) => (v.isDouble ? React.createElement(Badge, { variant: 'destructive', size: 'sm' }, 'Em dobro') : '—'),
      },
      // STATUS ("Em gozo" computed, else persisted status)
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (v) =>
          isVacationInProgress(v)
            ? React.createElement(Badge, { variant: 'active', size: 'sm' }, 'Em gozo')
            : React.createElement(
                Badge,
                { variant: STATUS_VARIANT[v.status] ?? 'default', size: 'sm' },
                VACATION_STATUS_LABELS[v.status] || v.status,
              ),
      },
      // PAGAMENTO (date or "Prazo: …")
      {
        key: 'paymentDate',
        label: 'PAGAMENTO',
        sortable: true,
        width: 1.4,
        align: 'left',
        render: (v) =>
          v.paymentDate ? formatDate(v.paymentDate) : v.paymentDueDate ? `Prazo: ${formatDate(v.paymentDueDate)}` : '—',
      },
      // CRIADO EM
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (v) => v.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: [
      'user.name',
      'acquisitiveStart',
      'gozo',
      'concessiveEnd',
      'entitledDays',
      'abonoPecuniarioDays',
      'isDouble',
      'status',
    ],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (v, router) => {
          router.push(`/departamento-pessoal/ferias/detalhes/${v.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        canPerform: canManageVacations,
        // Editar is hidden once the vacation is paid (PAID is terminal).
        visible: (v) => v.status !== VACATION_STATUS.PAID,
        onPress: (v, router) => {
          router.push(`/departamento-pessoal/ferias/editar/${v.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        canPerform: canDeleteDpRecords,
        confirm: {
          title: 'Confirmar Exclusão',
          message: () => 'Deseja excluir este registro de férias?',
        },
        onPress: async (v, _, context) => {
          await context?.delete?.(v.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'statuses',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: Object.values(VACATION_STATUS).map((status) => ({
          label: VACATION_STATUS_LABELS[status],
          value: status,
        })),
        placeholder: 'Selecione o status',
      },
      {
        key: 'userIds',
        label: 'Colaboradores',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter', 'vacation-collaborators'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getUsers } = await import('@/api-client')
            const pageSize = 20
            const response = await getUsers({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page,
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
            console.error('[Vacation Collaborator Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os colaboradores',
      },
      {
        key: 'concessiveEnd',
        label: 'Limite Concessivo',
        type: 'date-range',
        placeholder: 'Limite Concessivo',
      },
      {
        key: 'acquisitiveStart',
        label: 'Início do Aquisitivo',
        type: 'date-range',
        placeholder: 'Início do Aquisitivo',
      },
    ],
  },

  search: {
    placeholder: 'Buscar por colaborador ou observações',
    debounce: 500,
  },

  export: {
    title: 'Férias',
    filename: 'ferias',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'user', label: 'Colaborador', path: 'user.name' },
      { key: 'status', label: 'Status', path: 'status', format: (value: any): string => value ? VACATION_STATUS_LABELS[value as VACATION_STATUS] : '—' },
      { key: 'days', label: 'Dias de Gozo', path: 'days' },
      { key: 'startDate', label: 'Início do Gozo', path: 'startDate', format: 'date' },
      { key: 'entitledDays', label: 'Dias de Direito', path: 'entitledDays' },
      { key: 'acquisitiveStart', label: 'Início Aquisitivo', path: 'acquisitiveStart', format: 'date' },
      { key: 'acquisitiveEnd', label: 'Fim Aquisitivo', path: 'acquisitiveEnd', format: 'date' },
      { key: 'concessiveEnd', label: 'Limite Concessivo', path: 'concessiveEnd', format: 'date' },
      { key: 'isDouble', label: 'Dobro', path: 'isDouble', format: (value: any): string => value ? 'Sim' : 'Não' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Férias',
      route: '/departamento-pessoal/ferias/cadastrar',
      canCreate: canManageVacations,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'registro' : 'registros'} de férias?`,
        },
        onPress: async (ids, actions) => {
          await actions?.batchDeleteAsync?.({ vacationIds: Array.from(ids) })
        },
        canPerform: canDeleteDpRecords,
      },
    ],
  },

  emptyState: {
    icon: 'palmtree',
    title: 'Nenhum registro de férias',
    description: 'Cadastre o período aquisitivo de férias de um colaborador',
  },
}
