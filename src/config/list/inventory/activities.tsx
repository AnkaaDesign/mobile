import React from 'react'
import { View, StyleSheet } from 'react-native'
import { IconArrowUp, IconArrowDown } from '@tabler/icons-react-native'
import type { ListConfig } from '@/components/list/types'
import type { Activity } from '@/types'
import { ACTIVITY_OPERATION, ACTIVITY_REASON } from '@/constants/enums'
import { ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON_LABELS } from '@/constants/enum-labels'
import { canEditItems } from '@/utils/permissions/entity-permissions'
import { ThemedText } from '@/components/ui/themed-text'
import { Badge } from '@/components/ui/badge'
import { isTabletWidth } from '@/lib/table-utils'

const styles = StyleSheet.create({
  quantityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
  },
})


export const activitiesListConfig: ListConfig<Activity> = {
  key: 'inventory-activities',
  title: 'Movimentações',

  query: {
    hook: 'useActivitiesInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      item: true,
      user: true,
    },
  },

  table: {
    columns: [
      {
        key: 'item.uniCode',
        label: 'CÓDIGO',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (activity) => activity.item?.uniCode || '-',
      },
      {
        key: 'item.name',
        label: 'PRODUTO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (activity) => activity.item?.name || 'Item não encontrado',
        style: { fontWeight: '500' },
      },
      {
        key: 'user.name',
        label: 'COLABORADOR',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (activity) => activity.user?.name || 'Sistema',
      },
      {
        key: 'quantity',
        label: 'QNT',
        sortable: true,
        width: 0.8,
        align: 'center',
        render: (activity) => {
          const quantity = activity.quantity || 0
          const formattedQuantity = quantity.toLocaleString('pt-BR')
          const isInbound = activity.operation === ACTIVITY_OPERATION.INBOUND

          const IconComponent = isInbound ? IconArrowUp : IconArrowDown

          return (
            <View style={{ width: '100%' }}>
              <Badge
                variant={isInbound ? 'success' : 'destructive'}
                size="sm"
                style={{ alignSelf: 'stretch', justifyContent: 'center' }}
              >
                <View style={styles.quantityContent}>
                  <IconComponent size={12} color="#ffffff" />
                  <ThemedText style={styles.badgeText}>{formattedQuantity}</ThemedText>
                </View>
              </Badge>
            </View>
          )
        },
      },
      {
        key: 'reason',
        label: 'MOTIVO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (activity) => activity.reason ? ACTIVITY_REASON_LABELS[activity.reason] : '-',
        format: 'badge',
      },
      {
        key: 'createdAt',
        label: 'DATA',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (activity) => activity.createdAt,
        format: 'datetime',
      },
      {
        key: 'updatedAt',
        label: 'ATUALIZADO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (activity) => activity.updatedAt,
        format: 'datetime',
      },
    ],
    defaultVisible: isTabletWidth()
      ? ['item.name', 'user.name', 'quantity', 'createdAt']
      : ['item.name', 'user.name', 'quantity'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (activity, router) => {
          router.push(`/estoque/movimentacoes/detalhes/${activity.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (activity, router) => {
          router.push(`/estoque/movimentacoes/editar/${activity.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (activity) => `Deseja excluir esta movimentação?`,
        },
        onPress: async (activity, _, { delete: deleteActivity }) => {
          await deleteActivity(activity.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'hasUser',
        label: 'Atribuição',
        type: 'select',
        multiple: false,
        options: [
          { label: 'Ambos', value: 'ambos' },
          { label: 'Com usuário atribuído', value: 'com' },
          { label: 'Sem usuário atribuído', value: 'sem' },
        ],
        placeholder: 'Selecione...',
      },
      {
        key: 'operations',
        label: 'Operação',
        type: 'select',
        multiple: false,
        options: [
          { label: 'Ambos', value: 'ambos' },
          { label: 'Entrada', value: 'entrada' },
          { label: 'Saída', value: 'saida' },
        ],
        placeholder: 'Selecione...',
      },
      {
        key: 'showPaintProduction',
        label: 'Exibir atividades de produção de tinta',
        description: 'Incluir movimentações de produção de tintas',
        type: 'toggle',
        placeholder: 'Produção de Tintas',
      },
      {
        key: 'reasons',
        label: 'Motivo da Atividade',
        type: 'select',
        multiple: true,
        options: Object.values(ACTIVITY_REASON).map((reason) => ({
          label: ACTIVITY_REASON_LABELS[reason],
          value: reason,
        })),
        placeholder: 'Selecione os motivos...',
      },
      {
        key: 'userIds',
        label: 'Usuários',
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
        placeholder: 'Selecione usuários...',
      },
      {
        key: 'itemIds',
        label: 'Itens',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['items', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getItems } = await import('@/api-client')
            const pageSize = 20
            const response = await getItems({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((item: any) => ({
                label: `${item.name} (${item.uniCode || '-'})`,
                value: item.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Item Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione itens...',
      },
      {
        key: 'quantityRange',
        label: 'Quantidade',
        type: 'number-range',
        placeholder: { min: 'Mínimo', max: 'Máximo' },
      },
      {
        key: 'createdAt',
        label: 'Data de Criação',
        type: 'date-range',
        placeholder: 'Data de Criação',
      },
    ],
  },

  search: {
    placeholder: 'Buscar movimentações...',
    debounce: 300,
  },

  export: {
    title: 'Movimentações',
    filename: 'movimentacoes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'operation', label: 'Operação', path: 'operation', format: (value) => ACTIVITY_OPERATION_LABELS[value] || value },
      { key: 'itemCode', label: 'Código', path: 'item.uniCode' },
      { key: 'itemName', label: 'Produto', path: 'item.name' },
      { key: 'quantity', label: 'Quantidade', path: 'quantity', format: 'number' },
      { key: 'reason', label: 'Motivo', path: 'reason', format: (value) => value ? ACTIVITY_REASON_LABELS[value] : '-' },
      { key: 'user', label: 'Usuário', path: 'user.name' },
      { key: 'createdAt', label: 'Data', path: 'createdAt', format: 'datetime' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Movimentação',
      route: '/estoque/movimentacoes/cadastrar',
      canCreate: canEditItems,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'movimentação' : 'movimentações'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
