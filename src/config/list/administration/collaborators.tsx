import React from 'react'
import type { ListConfig } from '@/components/list/types'
import type { User } from '@/types'
import { canEditUsers, canDeleteUsers } from '@/utils/permissions/entity-permissions'
import { CONTRACT_TYPE, CONTRACT_STATUS, EMPLOYEE_TYPE } from '@/constants/enums'
import { CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS, EMPLOYEE_TYPE_LABELS } from '@/constants/enum-labels'
import { Badge } from '@/components/ui/badge'
import { getCollaboratorStatus } from '@/utils/user'
import { getDocumentProgress } from '@/components/personnel-department/admission/utils'

export const collaboratorsListConfig: ListConfig<User> = {
  key: 'administration-collaborators',
  title: 'Colaboradores',

  query: {
    hook: 'useUsersInfiniteMobile',
    mutationsHook: 'useUserMutations',
    batchMutationsHook: 'useUserBatchMutations',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    // Use optimized select for better performance - fetches only required fields
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      cpf: true,
      pis: true,
      status: true,
      isActive: true,
      avatarId: true,
      payrollNumber: true,
      verified: true,
      lastLoginAt: true,
      requirePasswordChange: true,
      performanceLevel: true,
      birth: true,
      currentContractType: true,
      currentContractStatus: true,
      currentContract: true,
      city: true,
      state: true,
      zipCode: true,
      address: true,
      addressNumber: true,
      addressComplement: true,
      neighborhood: true,
      createdAt: true,
      updatedAt: true,
      position: {
        select: {
          id: true,
          name: true,
        },
      },
      sector: {
        select: {
          id: true,
          name: true,
        },
      },
      ledSector: {
        select: {
          id: true,
          name: true,
        },
      },
      // Most-recent admission + its checklist documents drive the "DOCUMENTOS"
      // progress column (matches web getDocumentProgress over admissions[0]).
      admissions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { documents: true },
      },
      _count: {
        select: {
          createdTasks: true,
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
        render: (user) => user.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'email',
        label: 'EMAIL',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (user) => user.email || '-',
      },
      {
        key: 'cpf',
        label: 'CPF',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (user) => user.cpf || '-',
      },
      {
        key: 'currentContractType',
        label: 'TIPO DE CONTRATO',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (user) => {
          const { label, variant } = getCollaboratorStatus(user)
          return (
            <Badge
              variant={variant}
              size="sm"
              style={{ alignSelf: 'flex-start' }}
            >
              {label}
            </Badge>
          )
        },
      },
      {
        key: 'position',
        label: 'CARGO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (user) => user.position?.name || '-',
      },
      {
        key: 'sector',
        label: 'SETOR',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (user) => user.sector?.name || '-',
      },
      {
        // DOCUMENTOS — admission checklist progress (done/total) from the most
        // recent admission. Mirrors the web "DOCUMENTOS" column.
        key: 'documents',
        label: 'DOCUMENTOS',
        sortable: false,
        width: 1.3,
        align: 'left',
        render: (user) => {
          const latestAdmission = user.admissions?.[0]
          const { done, total } = getDocumentProgress(latestAdmission?.documents)
          if (total === 0) return '-'
          return (
            <Badge
              variant={done >= total ? 'success' : 'warning'}
              size="sm"
              style={{ alignSelf: 'flex-start' }}
            >
              {`${done}/${total}`}
            </Badge>
          )
        },
      },
      {
        key: 'phone',
        label: 'TELEFONE',
        sortable: false,
        width: 1.3,
        align: 'left',
        render: (user) => user.phone || '-',
      },
      {
        key: 'admissionDate',
        label: 'ADMISSÃO',
        sortable: false,
        width: 1.2,
        align: 'left',
        render: (user) => user.currentContract?.admissionDate ?? user.currentContract?.exp1StartAt,
        format: 'date',
      },
      {
        key: 'pis',
        label: 'PIS',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (user) => user.pis || '-',
      },
      {
        key: 'payrollNumber',
        label: 'Nº FOLHA',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (user) => user.payrollNumber || '-',
      },
      {
        key: 'birth',
        label: 'DATA DE NASCIMENTO',
        sortable: true,
        width: 1.4,
        align: 'left',
        render: (user) => user.birth,
        format: 'date',
      },
      {
        key: 'terminationDate',
        label: 'DATA DE DEMISSÃO',
        sortable: false,
        width: 1.4,
        align: 'left',
        render: (user) => user.currentContract?.terminationDate,
        format: 'date',
      },
      {
        key: 'performanceLevel',
        label: 'NÍVEL DE PERFORMANCE',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (user) => String(user.performanceLevel || 0),
        format: 'number',
      },
      {
        key: 'verified',
        label: 'VERIFICADO',
        sortable: true,
        width: 1.1,
        align: 'left',
        render: (user) => user.verified ? 'Sim' : 'Não',
        format: 'badge',
      },
      {
        key: 'lastLoginAt',
        label: 'ÚLTIMO LOGIN',
        sortable: true,
        width: 1.6,
        align: 'left',
        render: (user) => user.lastLoginAt || '-',
        format: 'datetime',
      },
      {
        key: 'ledSector',
        label: 'SETOR LIDERADO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (user) => user.ledSector?.name || '-',
      },
      {
        key: 'city',
        label: 'CIDADE',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (user) => user.city || '-',
      },
      {
        key: 'state',
        label: 'ESTADO',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (user) => user.state || '-',
      },
      {
        key: 'zipCode',
        label: 'CEP',
        sortable: true,
        width: 1.1,
        align: 'left',
        render: (user) => user.zipCode || '-',
      },
      {
        key: 'address',
        label: 'ENDEREÇO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (user) => {
          if (!user.address) return '-';
          let full = user.address;
          if (user.addressNumber) full += `, ${user.addressNumber}`;
          if (user.addressComplement) full += ` - ${user.addressComplement}`;
          return full;
        },
      },
      {
        key: 'neighborhood',
        label: 'BAIRRO',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (user) => user.neighborhood || '-',
      },
      {
        key: 'requirePasswordChange',
        label: 'REQUER ALTERAÇÃO DE SENHA',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (user) => user.requirePasswordChange ? 'Sim' : 'Não',
        format: 'badge',
      },
      {
        key: 'tasksCount',
        label: 'TAREFAS',
        sortable: false,
        width: 1.0,
        align: 'left',
        render: (user) => String(user._count?.createdTasks || 0),
        format: 'number',
      },
      {
        key: 'createdAt',
        label: 'DATA DE CRIAÇÃO',
        sortable: true,
        width: 1.6,
        align: 'left',
        render: (user) => user.createdAt,
        format: 'datetime',
      },
      {
        key: 'updatedAt',
        label: 'ÚLTIMA ATUALIZAÇÃO',
        sortable: true,
        width: 1.6,
        align: 'left',
        render: (user) => user.updatedAt,
        format: 'datetime',
      },
    ],
    // Mobile screens are narrow — default to the three essential columns
    // (name, sector, contract type). Users can reveal more via the column manager.
    defaultVisible: ['name', 'sector', 'currentContractType'],
    rowHeight: 48,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (user, router) => {
          router.push(`/administracao/colaboradores/detalhes/${user.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        canPerform: canEditUsers,
        onPress: (user, router) => {
          router.push(`/administracao/colaboradores/editar/${user.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        canPerform: canDeleteUsers,
        confirm: {
          title: 'Confirmar Exclusão',
          message: (user) => `Deseja excluir o colaborador "${user.name}"?`,
        },
        onPress: async (user, _, mutations) => {
          await mutations?.delete?.(user.id)
        },
      },
    ],
  },

  filters: {
    // Default to active-only (matches useUsersInfiniteMobile + web behavior).
    defaultValues: {
      isActive: true,
    },
    fields: [
      {
        // "Exibir": Ativos (isActive:true) | Demitidos (isActive:false) | Todos (omit).
        // The '__all__' sentinel is stripped by the user schema transform → omits isActive.
        key: 'isActive',
        label: 'Exibir',
        type: 'select',
        multiple: false,
        options: [
          { label: 'Ativos', value: true },
          { label: 'Desligados', value: false },
          { label: 'Todos', value: '__all__' },
        ],
        placeholder: 'Ativos',
      },
      {
        // Situação — maps to currentContractStatus (API param: contractStatuses).
        key: 'contractStatuses',
        label: 'Situação',
        type: 'select',
        multiple: true,
        options: Object.values(CONTRACT_STATUS).map((status) => ({
          label: CONTRACT_STATUS_LABELS[status],
          value: status,
        })),
        placeholder: 'Selecione as situações',
      },
      {
        // Modalidade — maps to currentContractType (API param: contractTypes).
        key: 'contractTypes',
        label: 'Modalidade do Vínculo',
        type: 'select',
        multiple: true,
        options: Object.values(CONTRACT_TYPE).map((type) => ({
          label: CONTRACT_TYPE_LABELS[type],
          value: type,
        })),
        placeholder: 'Selecione as modalidades',
      },
      {
        // Categoria — maps to currentEmployeeType (API param: employeeTypes).
        key: 'employeeTypes',
        label: 'Categoria',
        type: 'select',
        multiple: true,
        options: Object.values(EMPLOYEE_TYPE).map((type) => ({
          label: EMPLOYEE_TYPE_LABELS[type],
          value: type,
        })),
        placeholder: 'Selecione as categorias',
      },
      {
        key: 'positionIds',
        label: 'Cargos',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['positions', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getPositions } = await import('@/api-client')
            const pageSize = 20
            const response = await getPositions({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((position: any) => ({
                label: position.name,
                value: position.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Position Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os cargos',
      },
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
        key: 'birth',
        label: 'Data de Nascimento',
        type: 'date-range',
        placeholder: 'Data de Nascimento',
      },
      // NOTE: "Data de Demissão" (dismissedAt) and "Data de Contratação"
      // (exp1EndAt) date-range filters removed — those dates moved onto the
      // EmploymentContract and the API has no convenience filter for them; the
      // list framework only sends verbatim top-level params (no nested where).
    ],
  },

  search: {
    placeholder: 'Buscar: nome, email, CPF ou nº folha (apenas números)',
    debounce: 300,
  },

  export: {
    title: 'Colaboradores',
    filename: 'colaboradores',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'payrollNumber', label: 'Nº Folha', path: 'payrollNumber' },
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'email', label: 'Email', path: 'email' },
      { key: 'phone', label: 'Telefone', path: 'phone' },
      { key: 'cpf', label: 'CPF', path: 'cpf' },
      { key: 'pis', label: 'PIS', path: 'pis' },
      { key: 'position', label: 'Cargo', path: 'position.name' },
      { key: 'sector', label: 'Setor', path: 'sector.name' },
      { key: 'ledSector', label: 'Setor Liderado', path: 'ledSector.name' },
      { key: 'currentContractType', label: 'Modalidade do Vínculo', path: 'currentContractType', format: (value) => CONTRACT_TYPE_LABELS[value as CONTRACT_TYPE] || value },
      { key: 'currentContractStatus', label: 'Situação', path: 'currentContractStatus', format: (value) => CONTRACT_STATUS_LABELS[value as keyof typeof CONTRACT_STATUS_LABELS] || value },
      { key: 'birth', label: 'Data de Nascimento', path: 'birth', format: 'date' },
      { key: 'terminationDate', label: 'Data de Demissão', path: 'currentContract.terminationDate', format: 'date' },
      { key: 'admissionDate', label: 'Data de Admissão', path: 'currentContract.admissionDate', format: 'date' },
      { key: 'performanceLevel', label: 'Nível de Performance', path: 'performanceLevel' },
      { key: 'verified', label: 'Verificado', path: 'verified', format: (value) => value ? 'Sim' : 'Não' },
      { key: 'lastLoginAt', label: 'Último Login', path: 'lastLoginAt', format: 'datetime' },
      { key: 'city', label: 'Cidade', path: 'city' },
      { key: 'state', label: 'Estado', path: 'state' },
      { key: 'zipCode', label: 'CEP', path: 'zipCode' },
      { key: 'address', label: 'Endereço', path: 'address' },
      { key: 'neighborhood', label: 'Bairro', path: 'neighborhood' },
      { key: 'requirePasswordChange', label: 'Requer Alteração de Senha', path: 'requirePasswordChange', format: (value) => value ? 'Sim' : 'Não' },
      { key: 'createdAt', label: 'Data de Criação', path: 'createdAt', format: 'datetime' },
      { key: 'updatedAt', label: 'Última Atualização', path: 'updatedAt', format: 'datetime' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Colaborador',
      route: '/administracao/colaboradores/cadastrar',
      canCreate: canEditUsers,
    },
    bulk: [
      {
        key: 'activate',
        label: 'Ativar',
        icon: 'check',
        variant: 'default',
        confirm: {
          title: 'Confirmar Ativação',
          message: (count) => `Ativar ${count} ${count === 1 ? 'colaborador' : 'colaboradores'}?`,
        },
        onPress: async (ids, mutations) => {
          await mutations?.batchUpdateAsync?.({
            users: Array.from(ids).map((id) => ({ id, data: { status: 'ACTIVE' } })),
          })
        },
        canPerform: canEditUsers,
      },
      {
        key: 'deactivate',
        label: 'Desativar',
        icon: 'x',
        variant: 'secondary',
        confirm: {
          title: 'Confirmar Desativação',
          message: (count) => `Desativar ${count} ${count === 1 ? 'colaborador' : 'colaboradores'}?`,
        },
        onPress: async (ids, mutations) => {
          await mutations?.batchUpdateAsync?.({
            users: Array.from(ids).map((id) => ({ id, data: { status: 'INACTIVE' } })),
          })
        },
        canPerform: canEditUsers,
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'colaborador' : 'colaboradores'}?`,
        },
        onPress: async (ids, mutations) => {
          await mutations?.batchDeleteAsync?.({ userIds: Array.from(ids) })
        },
        canPerform: canDeleteUsers,
      },
    ],
  },
}
