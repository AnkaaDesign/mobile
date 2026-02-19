import type { ListConfig } from '@/components/list/types'
import type { Representative } from '@/types'
import { RepresentativeRole, REPRESENTATIVE_ROLE_LABELS, REPRESENTATIVE_ROLE_COLORS } from '@/types/representative'
import { canEditRepresentatives } from '@/utils/permissions/entity-permissions'
import { formatBrazilianPhone } from '@/utils'
import { fontWeight } from '@/constants/design-system'
import { View, StyleSheet } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Badge } from '@/components/ui/badge'

const styles = StyleSheet.create({
  nameText: {
    flex: 1,
    fontWeight: fontWeight.medium,
    fontSize: 12,
  },
  cellText: {
    fontSize: 12,
  },
  mutedText: {
    fontSize: 12,
    opacity: 0.5,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: '#ffffff',
  },
})

export const representativesListConfig: ListConfig<Representative> = {
  key: 'administration-representatives',
  title: 'Representantes',

  query: {
    hook: 'useRepresentativesInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    select: {
      id: true,
      name: true,
      role: true,
      phone: true,
      email: true,
      isActive: true,
      customerId: true,
      createdAt: true,
      updatedAt: true,
      customer: {
        select: {
          id: true,
          fantasyName: true,
        },
      },
    },
  },

  table: {
    columns: [
      {
        key: 'name',
        label: 'NOME',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (rep: Representative) => (
          <ThemedText style={styles.nameText} numberOfLines={2}>
            {rep.name}
          </ThemedText>
        ),
        style: { fontWeight: '500' },
      },
      {
        key: 'role',
        label: 'FUNÇÃO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (rep: Representative) => (
          <View style={[styles.roleBadge, { backgroundColor: REPRESENTATIVE_ROLE_COLORS[rep.role] }]}>
            <ThemedText style={styles.roleBadgeText}>
              {REPRESENTATIVE_ROLE_LABELS[rep.role]}
            </ThemedText>
          </View>
        ),
      },
      {
        key: 'customer',
        label: 'CLIENTE',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (rep: Representative) => (
          <ThemedText style={styles.cellText} numberOfLines={1}>
            {rep.customer?.fantasyName || '-'}
          </ThemedText>
        ),
      },
      {
        key: 'phone',
        label: 'TELEFONE',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (rep: Representative) => (
          <ThemedText style={styles.cellText} numberOfLines={1}>
            {formatBrazilianPhone(rep.phone)}
          </ThemedText>
        ),
      },
      {
        key: 'email',
        label: 'E-MAIL',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (rep: Representative) => (
          <ThemedText style={styles.cellText} numberOfLines={1}>
            {rep.email || '-'}
          </ThemedText>
        ),
      },
      {
        key: 'isActive',
        label: 'STATUS',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (rep: Representative) => (
          <Badge variant={rep.isActive ? 'default' : 'secondary'} size="sm">
            <ThemedText style={{ fontSize: 10 }}>
              {rep.isActive ? 'Ativo' : 'Inativo'}
            </ThemedText>
          </Badge>
        ),
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (rep: Representative) => rep.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['name', 'role', 'phone'],
    rowHeight: 48,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (rep, router) => {
          router.push(`/administracao/representantes/detalhes/${rep.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (rep, router) => {
          router.push(`/administracao/representantes/editar/${rep.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (rep) => `Deseja excluir o representante "${rep.name}"?`,
        },
        onPress: async (rep, _, context) => {
          await context?.delete?.(rep.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'role',
        label: 'Função',
        type: 'select',
        options: Object.values(RepresentativeRole).map((role) => ({
          label: REPRESENTATIVE_ROLE_LABELS[role],
          value: role,
        })),
        placeholder: 'Selecione a função',
      },
      {
        key: 'isActive',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Ativo', value: 'true' },
          { label: 'Inativo', value: 'false' },
        ],
        placeholder: 'Selecione o status',
      },
    ],
  },

  search: {
    placeholder: 'Buscar representantes...',
    debounce: 300,
  },

  export: {
    title: 'Representantes',
    filename: 'representantes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'role', label: 'Função', path: 'role' },
      { key: 'phone', label: 'Telefone', path: 'phone' },
      { key: 'email', label: 'E-mail', path: 'email' },
      { key: 'customer', label: 'Cliente', path: 'customer.fantasyName' },
      { key: 'isActive', label: 'Status', path: 'isActive', format: (value: boolean) => value ? 'Ativo' : 'Inativo' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
      { key: 'updatedAt', label: 'Atualizado Em', path: 'updatedAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Representante',
      route: '/administracao/representantes/cadastrar',
      canCreate: canEditRepresentatives,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'representante' : 'representantes'}?`,
        },
        onPress: async (ids, context) => {
          await context?.batchDeleteAsync?.({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
