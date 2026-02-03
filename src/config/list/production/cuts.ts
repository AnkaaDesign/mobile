import type { ListConfig } from '@/components/list/types'
import type { Cut, User } from '@/types'
import { CUT_STATUS, CUT_TYPE, CUT_ORIGIN, SECTOR_PRIVILEGES } from '@/constants/enums'
import { canEditCuts, canDeleteCuts } from '@/utils/permissions/entity-permissions'
import { isTabletWidth } from '@/lib/table-utils'

// Special value for tasks without a sector
const UNDEFINED_SECTOR_VALUE = "__UNDEFINED__";

// Helper function to get sector-based where clause for production/team leader users
const getSectorBasedWhere = (user: User | null) => {
  if (!user?.sector) return {};

  const { privileges, id: userSectorId } = user.sector;

  // Production users can only see cuts from their own sector
  if (privileges === SECTOR_PRIVILEGES.PRODUCTION) {
    return {
      task: {
        sectorId: userSectorId,
      },
    };
  }

  // Team leaders (users who manage a sector) can see cuts from their sector and managed sector
  const managedSectorId = user.managedSector?.id;
  if (managedSectorId) {
    const sectorIds = [userSectorId];
    sectorIds.push(managedSectorId);
    return {
      task: {
        sectorId: { in: sectorIds },
      },
    };
  }

  // Other privileges (ADMIN, WAREHOUSE, etc.) can see all cuts
  return {};
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CUTTING: 'Cortando',
  COMPLETED: 'Concluído',
}

const TYPE_LABELS: Record<string, string> = {
  VINYL: 'Adesivo',
  STENCIL: 'Espovo',
}

const ORIGIN_LABELS: Record<string, string> = {
  PLAN: 'Plano',
  REQUEST: 'Solicitação',
}

export const cutsListConfig: ListConfig<Cut> = {
  key: 'production-cuts',
  title: 'Cortes',

  query: {
    hook: 'useCutsInfiniteMobile',
    defaultSort: { field: 'status', direction: 'asc' },
    pageSize: 25,
    include: {
      file: true,
      task: {
        include: {
          sector: true,
        },
      },
      parentCut: true,
    },
  },

  table: {
    columns: [
      {
        key: 'filePreview',
        label: 'ARQUIVO',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (cut) => cut.file, // Return the file object for file-thumbnail component
        component: 'file-thumbnail',
        // onCellPress will be set dynamically in the listar page
      },
      {
        key: 'fileName',
        label: 'NOME',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (cut) => cut.file?.filename || '-',
      },
      {
        key: 'task',
        label: 'TAREFA',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (cut) => cut.task?.name || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (cut) => STATUS_LABELS[cut.status] || cut.status,
        format: 'badge',
        badgeEntity: 'CUT',
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (cut) => TYPE_LABELS[cut.type] || cut.type,
      },
      {
        key: 'origin',
        label: 'ORIGEM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (cut) => ORIGIN_LABELS[cut.origin] || cut.origin,
      },
      {
        key: 'reason',
        label: 'MOTIVO',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (cut) => cut.reason || '-',
      },
      {
        key: 'startedAt',
        label: 'INICIADO EM',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (cut) => cut.startedAt,
        format: 'datetime',
      },
      {
        key: 'completedAt',
        label: 'FINALIZADO EM',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (cut) => cut.completedAt,
        format: 'datetime',
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (cut) => cut.createdAt,
        format: 'datetime',
      },
      {
        key: 'sector',
        label: 'SETOR',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (cut) => cut.task?.sector?.name || 'Indefinido',
      },
    ],
    defaultVisible: isTabletWidth()
      ? ['filePreview', 'fileName', 'status', 'createdAt']
      : ['filePreview', 'fileName', 'status'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (cut, router) => {
          router.push(`/(tabs)/producao/recorte/detalhes/${cut.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        canPerform: canDeleteCuts,
        confirm: {
          title: 'Confirmar Exclusão',
          message: () => `Deseja excluir este corte?`,
        },
        onPress: async (cut, _, { delete: deleteCut }) => {
          await deleteCut(cut.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: Object.values(CUT_STATUS).map((status) => ({
          label: STATUS_LABELS[status],
          value: status,
        })),
        placeholder: 'Selecione os status',
      },
      {
        key: 'type',
        label: 'Tipo de Corte',
        type: 'select',
        multiple: true,
        options: Object.values(CUT_TYPE).map((type) => ({
          label: TYPE_LABELS[type],
          value: type,
        })),
        placeholder: 'Selecione os tipos de corte',
      },
      {
        key: 'origin',
        label: 'Origem',
        type: 'select',
        multiple: true,
        options: Object.values(CUT_ORIGIN).map((origin) => ({
          label: ORIGIN_LABELS[origin],
          value: origin,
        })),
        placeholder: 'Selecione as origens',
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
        key: 'createdAt',
        label: 'Data de Criação',
        type: 'date-range',
        placeholder: 'Data de Criação',
      },
    ],
  },

  search: {
    placeholder: 'Buscar cortes...',
    debounce: 500,
  },

  export: {
    title: 'Cortes',
    filename: 'cortes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'status', label: 'Status', path: 'status', format: (value) => STATUS_LABELS[value] || value },
      { key: 'type', label: 'Tipo', path: 'type', format: (value) => TYPE_LABELS[value] || value },
      { key: 'origin', label: 'Origem', path: 'origin', format: (value) => ORIGIN_LABELS[value] || value },
      { key: 'task', label: 'Tarefa', path: 'task.name' },
      { key: 'file', label: 'Arquivo', path: 'file.fileName' },
      { key: 'startedAt', label: 'Início', path: 'startedAt', format: 'datetime' },
      { key: 'completedAt', label: 'Conclusão', path: 'completedAt', format: 'datetime' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'datetime' },
    ],
  },

  actions: {
    create: {
      label: 'Novo Corte',
      route: '/(tabs)/producao/recorte/cadastrar',
      canCreate: canEditCuts,
    },
    bulk: [
      {
        key: 'start',
        label: 'Iniciar',
        icon: 'play',
        variant: 'default',
        confirm: {
          title: 'Confirmar Início',
          message: (count) => `Iniciar ${count} ${count === 1 ? 'corte' : 'cortes'}?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), status: 'CUTTING', startedAt: new Date() })
        },
      },
      {
        key: 'complete',
        label: 'Concluir',
        icon: 'check',
        variant: 'default',
        confirm: {
          title: 'Confirmar Conclusão',
          message: (count) => `Concluir ${count} ${count === 1 ? 'corte' : 'cortes'}?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), status: 'COMPLETED', completedAt: new Date() })
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'corte' : 'cortes'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
