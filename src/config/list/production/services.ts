import type { ListConfig } from '@/components/list/types'
import type { Service } from '@/types'
import { canEditTasks } from '@/utils/permissions/entity-permissions'

export const servicesListConfig: ListConfig<Service> = {
  key: 'production-services',
  title: 'Serviços',

  query: {
    hook: 'useServicesInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {},
  },

  table: {
    columns: [
      {
        key: 'description',
        label: 'DESCRIÇÃO',
        sortable: true,
        width: 2.5,
        align: 'left',
        render: (service) => service.description,
        style: { fontWeight: '500' },
      },
      {
        key: 'price',
        label: 'PREÇO',
        sortable: true,
        width: 1.2,
        align: 'right',
        render: (service) => String(service.price || 0),
        format: 'currency',
      },
      {
        key: 'estimatedDuration',
        label: 'DURAÇÃO ESTIMADA',
        sortable: true,
        width: 1.5,
        align: 'center',
        render: (service) => service.estimatedDuration ? `${service.estimatedDuration}h` : '-',
      },
      {
        key: 'isActive',
        label: 'ATIVO',
        sortable: true,
        width: 0.8,
        align: 'center',
        render: (service) => service.isActive,
        format: 'boolean',
      },
      {
        key: 'createdAt',
        label: 'CADASTRADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (service) => service.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['description', 'price', 'isActive'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (service, router) => {
          router.push(`/producao/servicos/detalhes/${service.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (service, router) => {
          router.push(`/producao/servicos/editar/${service.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (service) => `Deseja excluir o serviço "${service.description}"?`,
        },
        onPress: async (service, _, { delete: deleteService }) => {
          await deleteService(service.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'isActive',
        type: 'toggle',
        placeholder: 'Serviços Ativos',
        defaultValue: true,
      },
      {
        key: 'priceRange',
        type: 'number-range',
        placeholder: { min: 'Mínimo', max: 'Máximo' },
      },
      {
        key: 'durationRange',
        type: 'number-range',
        placeholder: { min: 'Mínimo', max: 'Máximo' },
      },
      {
        key: 'createdAt',
        type: 'date-range',
        placeholder: 'Data de Cadastro',
      },
    ],
  },

  search: {
    placeholder: 'Buscar serviços...',
    debounce: 300,
  },

  export: {
    title: 'Serviços',
    filename: 'servicos',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'description', label: 'Descrição', path: 'description' },
      { key: 'price', label: 'Preço', path: 'price', format: 'currency' },
      { key: 'estimatedDuration', label: 'Duração Estimada (h)', path: 'estimatedDuration' },
      { key: 'isActive', label: 'Ativo', path: 'isActive', format: 'boolean' },
      { key: 'createdAt', label: 'Cadastrado em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Serviço',
      route: '/producao/servicos/cadastrar',
      canCreate: canEditTasks,
    },
    bulk: [
      {
        key: 'activate',
        label: 'Ativar',
        icon: 'check',
        variant: 'default',
        confirm: {
          title: 'Confirmar Ativação',
          message: (count) => `Ativar ${count} ${count === 1 ? 'serviço' : 'serviços'}?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), isActive: true })
        },
      },
      {
        key: 'deactivate',
        label: 'Desativar',
        icon: 'x',
        variant: 'secondary',
        confirm: {
          title: 'Confirmar Desativação',
          message: (count) => `Desativar ${count} ${count === 1 ? 'serviço' : 'serviços'}?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), isActive: false })
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'serviço' : 'serviços'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
