import type { ListConfig } from '@/components/list/types'
import type { SecullumHorarioItem } from '@/hooks/use-secullum-horarios-infinite-mobile'

export const schedulesListConfig: ListConfig<SecullumHorarioItem> = {
  key: 'hr-schedules',
  title: 'Horários',

  query: {
    hook: 'useSecullumHorariosInfiniteMobile',
    defaultSort: { field: 'Codigo', direction: 'asc' },
    pageSize: 50,
  },

  table: {
    columns: [
      {
        key: 'Codigo',
        label: 'CÓDIGO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (schedule) => schedule.Codigo || '-',
        style: { fontWeight: '600' },
      },
      {
        key: 'Descricao',
        label: 'DESCRIÇÃO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (schedule) => schedule.Descricao || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'HorarioFlexivel',
        label: 'TIPO',
        sortable: true,
        width: 0.8,
        align: 'center',
        render: (schedule) => schedule.HorarioFlexivel ? 'Flexível' : 'Fixo',
      },
      {
        key: 'CargaHorariaDiaria',
        label: 'CARGA DIÁRIA',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (schedule) => schedule.CargaHorariaDiaria || '-',
      },
    ],
    defaultVisible: ['Codigo', 'Descricao', 'HorarioFlexivel'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (schedule, router) => {
          router.push(`/recursos-humanos/horarios/detalhes/${schedule.Id}`)
        },
      },
    ],
  },

  search: {
    placeholder: 'Buscar horários...',
    debounce: 300,
  },

  emptyState: {
    icon: 'clock',
    title: 'Nenhum horário encontrado',
    description: 'Não há horários cadastrados no sistema Secullum.',
  },
}
