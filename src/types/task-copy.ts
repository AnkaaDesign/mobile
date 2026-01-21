// packages/schemas/src/task-copy.ts

import { z } from 'zod';

/**
 * Schema for copying fields from one task to another
 * Supports granular field selection for copy operations
 */

// All copyable field names
export const COPYABLE_TASK_FIELDS = [
  // Basic Task Fields (Copy Values)
  'name',
  'details',
  'term',
  'entryDate',
  'forecastDate',
  'commission',
  'negotiatingWith',

  // References (Shared - Copy IDs)
  'customerId',
  'invoiceToId',
  'sectorId',
  'pricingId',
  'paintId',

  // Files (Shared - Copy IDs)
  'artworkIds',
  'budgetIds',
  'invoiceIds',
  'receiptIds',
  'reimbursementIds',
  'reimbursementInvoiceIds',
  'baseFileIds',
  'logoPaintIds',

  // Individual Resources (Create New Instances)
  'cuts',
  'airbrushings',

  // Shared Resources (Assign Same IDs)
  'layouts',
  'truck',

  // Service Orders
  'serviceOrders',

  // Observation
  'observation',

  // Quick Action
  'all',
] as const;

export type CopyableTaskField = typeof COPYABLE_TASK_FIELDS[number];

/**
 * Schema for task copy request
 */
export const taskCopyFromSchema = z.object({
  sourceTaskId: z
    .string()
    .uuid('ID da tarefa de origem deve ser um UUID válido'),

  fields: z
    .array(z.enum(COPYABLE_TASK_FIELDS))
    .min(1, 'Pelo menos um campo deve ser selecionado para copiar')
    .refine(
      (fields) => {
        // If 'all' is selected, no other fields should be selected
        if (fields.includes('all')) {
          return fields.length === 1;
        }
        return true;
      },
      {
        message: 'Se "all" for selecionado, nenhum outro campo deve ser selecionado',
      }
    ),
});

export type TaskCopyFromFormData = z.infer<typeof taskCopyFromSchema>;

/**
 * Field metadata for UI rendering
 */
export const COPYABLE_FIELD_METADATA: Record<CopyableTaskField, {
  label: string;
  category: string;
  description: string;
  isShared: boolean;
  createNewInstances: boolean;
}> = {
  // Basic Fields
  name: {
    label: 'Nome da Tarefa',
    category: 'Básico',
    description: 'Nome/título da tarefa',
    isShared: false,
    createNewInstances: false,
  },
  details: {
    label: 'Detalhes',
    category: 'Básico',
    description: 'Descrição detalhada da tarefa',
    isShared: false,
    createNewInstances: false,
  },
  term: {
    label: 'Prazo',
    category: 'Básico',
    description: 'Data limite para conclusão',
    isShared: false,
    createNewInstances: false,
  },
  entryDate: {
    label: 'Data de Entrada',
    category: 'Básico',
    description: 'Data de entrada da tarefa',
    isShared: false,
    createNewInstances: false,
  },
  forecastDate: {
    label: 'Data de Previsão',
    category: 'Básico',
    description: 'Previsão de disponibilidade do caminhão',
    isShared: false,
    createNewInstances: false,
  },
  commission: {
    label: 'Comissão',
    category: 'Básico',
    description: 'Status da comissão',
    isShared: false,
    createNewInstances: false,
  },
  negotiatingWith: {
    label: 'Negociando Com',
    category: 'Básico',
    description: 'Pessoa de contato (nome e telefone)',
    isShared: false,
    createNewInstances: false,
  },

  // References
  customerId: {
    label: 'Cliente',
    category: 'Referências',
    description: 'Cliente da tarefa',
    isShared: true,
    createNewInstances: false,
  },
  invoiceToId: {
    label: 'Faturar Para',
    category: 'Referências',
    description: 'Cliente para faturamento',
    isShared: true,
    createNewInstances: false,
  },
  sectorId: {
    label: 'Setor',
    category: 'Referências',
    description: 'Setor responsável',
    isShared: true,
    createNewInstances: false,
  },
  pricingId: {
    label: 'Precificação',
    category: 'Recursos Compartilhados',
    description: 'Precificação compartilhada (atualizações afetam todas as tarefas)',
    isShared: true,
    createNewInstances: false,
  },
  paintId: {
    label: 'Pintura Geral',
    category: 'Recursos Compartilhados',
    description: 'Pintura geral compartilhada',
    isShared: true,
    createNewInstances: false,
  },

  // Files
  artworkIds: {
    label: 'Artes',
    category: 'Arquivos Compartilhados',
    description: 'Artes compartilhadas (mudanças de status afetam todas as tarefas)',
    isShared: true,
    createNewInstances: false,
  },
  budgetIds: {
    label: 'Orçamentos',
    category: 'Arquivos Compartilhados',
    description: 'Arquivos de orçamento compartilhados',
    isShared: true,
    createNewInstances: false,
  },
  invoiceIds: {
    label: 'Notas Fiscais',
    category: 'Arquivos Compartilhados',
    description: 'Notas fiscais compartilhadas',
    isShared: true,
    createNewInstances: false,
  },
  receiptIds: {
    label: 'Recibos',
    category: 'Arquivos Compartilhados',
    description: 'Recibos compartilhados',
    isShared: true,
    createNewInstances: false,
  },
  reimbursementIds: {
    label: 'Reembolsos',
    category: 'Arquivos Compartilhados',
    description: 'Arquivos de reembolso compartilhados',
    isShared: true,
    createNewInstances: false,
  },
  reimbursementInvoiceIds: {
    label: 'NFs de Reembolso',
    category: 'Arquivos Compartilhados',
    description: 'Notas fiscais de reembolso compartilhadas',
    isShared: true,
    createNewInstances: false,
  },
  baseFileIds: {
    label: 'Arquivos Base',
    category: 'Arquivos Compartilhados',
    description: 'Arquivos base para design compartilhados',
    isShared: true,
    createNewInstances: false,
  },
  logoPaintIds: {
    label: 'Pinturas de Logo',
    category: 'Recursos Compartilhados',
    description: 'Pinturas de logo compartilhadas',
    isShared: true,
    createNewInstances: false,
  },

  // Individual Resources
  cuts: {
    label: 'Cortes',
    category: 'Recursos Individuais',
    description: 'Criar novos registros de corte (individuais para esta tarefa)',
    isShared: false,
    createNewInstances: true,
  },
  airbrushings: {
    label: 'Aerografias',
    category: 'Recursos Individuais',
    description: 'Criar novos registros de aerografia (individuais para esta tarefa)',
    isShared: false,
    createNewInstances: true,
  },

  // Shared Resources
  layouts: {
    label: 'Layouts do Caminhão',
    category: 'Recursos Compartilhados',
    description: 'Layouts compartilhados (atualizações afetam todos os caminhões)',
    isShared: true,
    createNewInstances: false,
  },
  truck: {
    label: 'Dados do Caminhão',
    category: 'Recursos Individuais',
    description: 'Categoria, tipo de implemento e vaga (exceto placa e chassi)',
    isShared: false,
    createNewInstances: false,
  },

  // Service Orders
  serviceOrders: {
    label: 'Ordens de Serviço',
    category: 'Serviços',
    description: 'Ordens de serviço',
    isShared: true,
    createNewInstances: false,
  },

  // Observation
  observation: {
    label: 'Observação/Todos',
    category: 'Observações',
    description: 'Observação da tarefa',
    isShared: false,
    createNewInstances: false,
  },

  // Quick Action
  all: {
    label: 'COPIAR TUDO',
    category: 'Ações Rápidas',
    description: 'Copiar todos os campos (exceto serialNumber, plate e chassisNumber)',
    isShared: false,
    createNewInstances: false,
  },
};
