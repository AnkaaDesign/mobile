import type { ListConfig } from '@/components/list/types'
import type { PpeSize } from '@/types'

export const ppeSizesListConfig: ListConfig<PpeSize> = {
  key: 'hr-ppe-sizes',
  title: 'Tamanhos de EPI',

  query: {
    hook: 'usePpeSizesInfiniteMobile',
    defaultSort: { field: 'user', direction: 'asc' },
    pageSize: 25,
    include: {
      user: true,
    },
  },

  table: {
    columns: [
      {
        key: 'user',
        label: 'FUNCIONÁRIO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (size) => size.user?.name || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'shirts',
        label: 'CAMISA',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (size) => size.shirts || '-',
      },
      {
        key: 'pants',
        label: 'CALÇA',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (size) => size.pants || '-',
      },
      {
        key: 'boots',
        label: 'BOTA',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (size) => size.boots || '-',
      },
      {
        key: 'sleeves',
        label: 'MANGA',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (size) => size.sleeves || '-',
      },
      {
        key: 'mask',
        label: 'MÁSCARA',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (size) => size.mask || '-',
      },
      {
        key: 'gloves',
        label: 'LUVA',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (size) => size.gloves || '-',
      },
      {
        key: 'rainBoots',
        label: 'BOTA CHUVA',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (size) => size.rainBoots || '-',
      },
      {
        key: 'completeness',
        label: 'COMPLETUDE',
        sortable: false,
        width: 1.2,
        align: 'center',
        render: (size) => {
          const totalFields = 7
          const filledFields = [
            size.shirts,
            size.pants,
            size.boots,
            size.sleeves,
            size.mask,
            size.gloves,
            size.rainBoots,
          ].filter(Boolean).length
          const percentage = Math.round((filledFields / totalFields) * 100)
          return `${percentage}%`
        },
      },
    ],
    defaultVisible: ['user', 'shirts', 'pants', 'boots', 'completeness'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (size, router) => {
          router.push(`/recursos-humanos/epi/tamanhos/detalhes/${size.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (size, router) => {
          router.push(`/recursos-humanos/epi/tamanhos/editar/${size.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (size) => `Deseja excluir os tamanhos de "${size.user?.name || 'funcionário'}"?`,
        },
        onPress: async (size, _, { delete: deleteSize }) => {
          await deleteSize(size.id)
        },
      },
    ],
  },

  filters: {
    sections: [
      {
        key: 'completeness',
        label: 'Completude',
        icon: 'checkbox',
        collapsible: true,
        defaultOpen: true,
        fields: [
          {
            key: 'hasAllSizes',
            label: 'Completo (todos os tamanhos)',
            type: 'toggle',
          },
          {
            key: 'missingShirts',
            label: 'Sem tamanho de camisa',
            type: 'toggle',
          },
          {
            key: 'missingPants',
            label: 'Sem tamanho de calça',
            type: 'toggle',
          },
          {
            key: 'missingBoots',
            label: 'Sem tamanho de bota',
            type: 'toggle',
          },
        ],
      },
      {
        key: 'entities',
        label: 'Relacionamentos',
        icon: 'link',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'userIds',
            label: 'Funcionários',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione os funcionários',
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar por funcionário...',
    debounce: 300,
  },

  export: {
    title: 'Tamanhos de EPI',
    filename: 'tamanhos-epi',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'user', label: 'Funcionário', path: 'user.name' },
      { key: 'shirts', label: 'Camisa', path: 'shirts' },
      { key: 'pants', label: 'Calça', path: 'pants' },
      { key: 'boots', label: 'Bota', path: 'boots' },
      { key: 'sleeves', label: 'Manga', path: 'sleeves' },
      { key: 'mask', label: 'Máscara', path: 'mask' },
      { key: 'gloves', label: 'Luva', path: 'gloves' },
      { key: 'rainBoots', label: 'Bota Chuva', path: 'rainBoots' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Tamanho',
      route: '/recursos-humanos/epi/tamanhos/cadastrar',
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'registro' : 'registros'} de tamanho?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
