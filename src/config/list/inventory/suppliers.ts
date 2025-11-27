import type { ListConfig } from '@/components/list/types'
import type { Supplier } from '@/types'
import { canEditSuppliers } from '@/utils/permissions/entity-permissions'
import { formatBrazilianPhone, formatCNPJ } from '@/utils'

export const suppliersListConfig: ListConfig<Supplier> = {
  key: 'inventory-suppliers',
  title: 'Fornecedores',

  query: {
    hook: 'useSuppliersInfiniteMobile',
    defaultSort: { field: 'fantasyName', direction: 'asc' },
    pageSize: 25,
    include: {
      items: true,
      _count: {
        select: {
          items: true,
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
        width: 2.0,
        align: 'left',
        render: (supplier) => supplier.fantasyName,
        style: { fontWeight: '500' },
      },
      {
        key: 'corporateName',
        label: 'RAZÃO SOCIAL',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (supplier) => supplier.corporateName || '-',
      },
      {
        key: 'cnpj',
        label: 'CNPJ',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (supplier) => supplier.cnpj ? formatCNPJ(supplier.cnpj) : '-',
      },
      {
        key: 'email',
        label: 'EMAIL',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (supplier) => supplier.email || '-',
      },
      {
        key: 'phones',
        label: 'TELEFONES',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (supplier) => {
          if (!supplier.phones || supplier.phones.length === 0) return '-'
          const formattedPhones = supplier.phones.slice(0, 2).map(phone => formatBrazilianPhone(phone))
          const phonesText = formattedPhones.join(', ')
          return supplier.phones.length > 2 ? `${phonesText} +${supplier.phones.length - 2}` : phonesText
        },
      },
      {
        key: 'address',
        label: 'ENDEREÇO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (supplier) => {
          if (!supplier.address) return '-'
          const parts = [supplier.address, supplier.addressNumber, supplier.neighborhood].filter(Boolean)
          return parts.join(', ')
        },
      },
      {
        key: 'city',
        label: 'CIDADE',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (supplier) => supplier.city || '-',
      },
      {
        key: 'state',
        label: 'ESTADO',
        sortable: true,
        width: 0.8,
        align: 'center',
        render: (supplier) => supplier.state || '-',
      },
      {
        key: 'zipCode',
        label: 'CEP',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (supplier) => supplier.zipCode || '-',
      },
      {
        key: 'site',
        label: 'SITE',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (supplier) => supplier.site || '-',
      },
      {
        key: 'itemsCount',
        label: 'PRODUTOS',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (supplier) => String((supplier as any)._count?.items || 0),
        format: 'count-badge',
      },
      {
        key: 'createdAt',
        label: 'CADASTRADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (supplier) => supplier.createdAt || '-',
        format: 'date',
      },
    ],
    defaultVisible: ['fantasyName', 'itemsCount'],
    rowHeight: 48,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (supplier, router) => {
          router.push(`/estoque/fornecedores/detalhes/${supplier.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (supplier, router) => {
          router.push(`/estoque/fornecedores/editar/${supplier.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (supplier) => `Deseja excluir o fornecedor "${supplier.fantasyName}"?`,
        },
        onPress: async (supplier, _, { delete: deleteSupplier }) => {
          await deleteSupplier(supplier.id)
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
        options: [
          { label: 'AC', value: 'AC' },
          { label: 'AL', value: 'AL' },
          { label: 'AP', value: 'AP' },
          { label: 'AM', value: 'AM' },
          { label: 'BA', value: 'BA' },
          { label: 'CE', value: 'CE' },
          { label: 'DF', value: 'DF' },
          { label: 'ES', value: 'ES' },
          { label: 'GO', value: 'GO' },
          { label: 'MA', value: 'MA' },
          { label: 'MT', value: 'MT' },
          { label: 'MS', value: 'MS' },
          { label: 'MG', value: 'MG' },
          { label: 'PA', value: 'PA' },
          { label: 'PB', value: 'PB' },
          { label: 'PR', value: 'PR' },
          { label: 'PE', value: 'PE' },
          { label: 'PI', value: 'PI' },
          { label: 'RJ', value: 'RJ' },
          { label: 'RN', value: 'RN' },
          { label: 'RS', value: 'RS' },
          { label: 'RO', value: 'RO' },
          { label: 'RR', value: 'RR' },
          { label: 'SC', value: 'SC' },
          { label: 'SP', value: 'SP' },
          { label: 'SE', value: 'SE' },
          { label: 'TO', value: 'TO' },
        ],
        placeholder: 'Selecione os estados',
      },
      {
        key: 'itemCount',
        label: 'Quantidade de Itens',
        type: 'number-range',
        placeholder: { min: 'Mín', max: 'Máx' },
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
    placeholder: 'Buscar fornecedores...',
    debounce: 300,
  },

  export: {
    title: 'Fornecedores',
    filename: 'fornecedores',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'fantasyName', label: 'Nome Fantasia', path: 'fantasyName' },
      { key: 'corporateName', label: 'Razão Social', path: 'corporateName' },
      { key: 'cnpj', label: 'CNPJ', path: 'cnpj' },
      { key: 'email', label: 'Email', path: 'email' },
      { key: 'address', label: 'Endereço', path: 'address' },
      { key: 'city', label: 'Cidade', path: 'city' },
      { key: 'state', label: 'Estado', path: 'state' },
      { key: 'zipCode', label: 'CEP', path: 'zipCode' },
      { key: 'site', label: 'Site', path: 'site' },
      { key: 'itemsCount', label: 'Produtos', path: '_count.items' },
      { key: 'createdAt', label: 'Cadastrado em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Fornecedor',
      route: '/estoque/fornecedores/cadastrar',
      canCreate: canEditSuppliers,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'fornecedor' : 'fornecedores'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
