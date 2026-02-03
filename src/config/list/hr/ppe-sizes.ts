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
    defaultVisible: ['user', 'shirts', 'pants'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
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
    fields: [
      {
        key: 'hasAllSizes',
        label: 'Completo',
        type: 'toggle',
        placeholder: 'Completo (todos os tamanhos)',
      },
      {
        key: 'missingShirts',
        label: 'Sem Tamanho de Camisa',
        type: 'toggle',
        placeholder: 'Sem tamanho de camisa',
      },
      {
        key: 'missingPants',
        label: 'Sem Tamanho de Calça',
        type: 'toggle',
        placeholder: 'Sem tamanho de calça',
      },
      {
        key: 'missingBoots',
        label: 'Sem Tamanho de Bota',
        type: 'toggle',
        placeholder: 'Sem tamanho de bota',
      },
      {
        key: 'userIds',
        label: 'Funcionários',
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
        placeholder: 'Selecione os funcionários',
      },
    ],
  },

  search: {
    placeholder: 'Buscar por funcionário...',
    debounce: 500,
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
