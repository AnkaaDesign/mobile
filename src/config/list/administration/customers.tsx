import type { ListConfig } from '@/components/list/types'
import type { Customer } from '@/types'
import {
  BRAZILIAN_STATES,
  BRAZILIAN_STATE_NAMES,
} from '@/constants'
import { canEditCustomers } from '@/utils/permissions/entity-permissions'
import { formatCNPJ, formatCPF, formatBrazilianPhone, getFileUrl } from '@/utils'
import { extendedColors } from '@/lib/theme/extended-colors'
import { fontWeight } from '@/constants/design-system'
import { View, Image, StyleSheet, Text } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Badge } from '@/components/ui/badge'

const styles = StyleSheet.create({
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
  },
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
  emailText: {
    color: '#16a34a', // green-600
  },
  phonesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneBadge: {
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tagText: {
    fontSize: 10,
  },
  centerAlign: {
    alignItems: 'center',
  },
})

export const customersListConfig: ListConfig<Customer> = {
  key: 'administration-customers',
  title: 'Clientes',

  query: {
    hook: 'useCustomersInfiniteMobile',
    defaultSort: { field: 'fantasyName', direction: 'asc' },
    pageSize: 25,
    // Use select to fetch only the fields needed for the list view
    // This reduces data transfer and improves performance
    select: {
      id: true,
      fantasyName: true,
      corporateName: true,
      cnpj: true,
      cpf: true,
      email: true,
      phones: true,
      city: true,
      state: true,
      registrationStatus: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
      logoId: true,
      economicActivityId: true,
      // Include logo relation for display
      logo: {
        select: {
          id: true,
        },
      },
      // Include economicActivity relation for display
      economicActivity: {
        select: {
          id: true,
          code: true,
          description: true,
        },
      },
      // Include task count
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  },

  table: {
    columns: [
      {
        key: 'fantasyName',
        label: 'NOME FANTASIA',
        sortable: true,
        width: 2.5,
        align: 'left',
        render: (customer: Customer) => (
          <View style={styles.nameContainer}>
            {customer.logo?.id ? (
              <Image
                source={{ uri: getFileUrl(customer.logo!) }}
                style={[styles.logoImage, { borderColor: extendedColors.neutral[300] }]}
                onError={() => {
                  console.log('Failed to load logo for customer:', customer.fantasyName)
                }}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: extendedColors.neutral[200] }]}>
                <ThemedText style={[styles.avatarText, { color: extendedColors.neutral[600] }]}>
                  {customer.fantasyName?.charAt(0)?.toUpperCase() || '?'}
                </ThemedText>
              </View>
            )}
            <ThemedText style={styles.nameText} numberOfLines={2}>
              {customer.fantasyName}
            </ThemedText>
          </View>
        ),
        style: { fontWeight: '500' },
      },
      {
        key: 'legalName',
        label: 'RAZÃO SOCIAL',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (customer: Customer) => customer.corporateName || '-',
      },
      {
        key: 'cnpj',
        label: 'CNPJ',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (customer: Customer) => {
          if (customer.cnpj) {
            return formatCNPJ(customer.cnpj)
          }
          if (customer.cpf) {
            return formatCPF(customer.cpf)
          }
          return '-'
        },
      },
      {
        key: 'email',
        label: 'E-MAIL',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (customer: Customer) => customer.email || '-',
        style: { color: '#16a34a' },
      },
      {
        key: 'phone',
        label: 'TELEFONE',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (customer: Customer) => {
          if (customer.phones && customer.phones.length > 0) {
            const mainPhone = formatBrazilianPhone(customer.phones[0])
            const otherCount = customer.phones.length - 1

            return (
              <View style={styles.phonesContainer}>
                <ThemedText style={styles.cellText} numberOfLines={2}>
                  {mainPhone}
                </ThemedText>
                {otherCount > 0 && (
                  <Badge variant="secondary" size="sm" style={styles.phoneBadge}>
                    <ThemedText style={styles.badgeText}>+{otherCount}</ThemedText>
                  </Badge>
                )}
              </View>
            )
          }
          return '-'
        },
      },
      {
        key: 'city',
        label: 'CIDADE',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (customer: Customer) => {
          if (customer.city && customer.state) {
            return `${customer.city}/${customer.state}`
          }
          if (customer.city) {
            return customer.city
          }
          return '-'
        },
      },
      {
        key: 'state',
        label: 'ESTADO',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (customer: Customer) => customer.state || '-',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (customer: Customer) => customer.registrationStatus || '-',
        format: 'badge',
      },
      {
        key: 'tags',
        label: 'TAGS',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (customer: Customer) => {
          if (customer.tags && customer.tags.length > 0) {
            return (
              <View style={styles.tagsContainer}>
                {customer.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="outline" size="sm">
                    <ThemedText style={styles.tagText}>{tag}</ThemedText>
                  </Badge>
                ))}
                {customer.tags.length > 2 && (
                  <Badge variant="secondary" size="sm">
                    <ThemedText style={styles.badgeText}>+{customer.tags.length - 2}</ThemedText>
                  </Badge>
                )}
              </View>
            )
          }
          return '-'
        },
      },
      {
        key: 'economicActivity',
        label: 'ATIVIDADE ECONÔMICA',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (customer: Customer) => customer.economicActivity?.description || '-',
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (customer: Customer) => customer.createdAt,
        format: 'date',
      },
      {
        key: 'updatedAt',
        label: 'ATUALIZADO EM',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (customer: Customer) => customer.updatedAt,
        format: 'date',
      },
      {
        key: 'taskCount',
        label: 'TAREFAS',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (customer: Customer) => String((customer as any)._count?.tasks || 0),
        format: 'count-badge',
      },
    ],
    defaultVisible: ['fantasyName', 'cnpj', 'taskCount'],
    rowHeight: 48,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (customer, router) => {
          router.push(`/administracao/clientes/detalhes/${customer.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (customer, router) => {
          router.push(`/administracao/clientes/editar/${customer.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (customer) => `Deseja excluir o cliente "${customer.fantasyName}"?`,
        },
        onPress: async (customer, _, context) => {
          await context?.delete?.(customer.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'states',
        label: 'Estados',
        type: 'select',
        multiple: true,
        options: BRAZILIAN_STATES.map((state) => ({
          label: BRAZILIAN_STATE_NAMES[state],
          value: state,
        })),
        placeholder: 'Selecione os estados',
      },
      {
        key: 'taskCount',
        label: 'Quantidade de Tarefas',
        type: 'number-range',
        placeholder: {
          min: 'Mínimo',
          max: 'Máximo',
        },
      },
      {
        key: 'createdAt',
        label: 'Data de Cadastro',
        type: 'date-range',
        placeholder: 'Data de Cadastro',
      },
    ],
  },

  search: {
    placeholder: 'Buscar clientes...',
    debounce: 300,
  },

  export: {
    title: 'Clientes',
    filename: 'clientes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'fantasyName', label: 'Nome Fantasia', path: 'fantasyName' },
      { key: 'legalName', label: 'Razão Social', path: 'corporateName' },
      { key: 'cnpj', label: 'CNPJ', path: 'cnpj' },
      { key: 'cpf', label: 'CPF', path: 'cpf' },
      { key: 'email', label: 'E-mail', path: 'email' },
      { key: 'phones', label: 'Telefones', path: 'phones', format: (value: string[]) => value?.join(', ') || '-' },
      { key: 'city', label: 'Cidade', path: 'city' },
      { key: 'state', label: 'Estado', path: 'state' },
      { key: 'zipCode', label: 'CEP', path: 'zipCode' },
      { key: 'address', label: 'Endereço', path: 'address' },
      { key: 'status', label: 'Status', path: 'registrationStatus' },
      { key: 'economicActivity', label: 'Atividade Econômica', path: 'economicActivity.name' },
      { key: 'tags', label: 'Tags', path: 'tags', format: (value: string[]) => value?.join(', ') || '-' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
      { key: 'updatedAt', label: 'Atualizado Em', path: 'updatedAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Cliente',
      route: '/administracao/clientes/cadastrar',
      canCreate: canEditCustomers,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'cliente' : 'clientes'}?`,
        },
        onPress: async (ids, context) => {
          await context?.batchDeleteAsync?.({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
