import { tasksListConfig } from './tasks';
import type { ListConfig } from '@/components/list/types';
import type { Task } from '@/types';

/**
 * Task List Configuration for Agenda Page
 * Optimized with select patterns for better performance
 */
export const tasksListAgendaConfig: ListConfig<Task> = {
  ...tasksListConfig,

  query: {
    ...tasksListConfig.query,
    pageSize: 15, // Reduce from 25 to 15 for much faster loads

    // Use SELECT pattern for optimal performance - only fetch needed fields
    select: {
      // Core task fields needed for agenda display
      id: true,
      name: true,
      status: true,
      statusOrder: true,
      serialNumber: true,
      details: true,
      entryDate: true,
      startedAt: true,
      finishedAt: true,
      term: true,
      forecastDate: true,
      commission: true,
      createdAt: true,
      updatedAt: true,

      // Customer - only essential fields
      customer: {
        select: {
          id: true,
          fantasyName: true,
        }
      },

      // Sector for display
      sector: {
        select: {
          id: true,
          name: true,
        }
      },

      // Paint data - optimized (no formulas)
      generalPainting: {
        select: {
          id: true,
          name: true,
          hex: true,
          finish: true,
          paintType: {
            select: {
              id: true,
              name: true,
            },
          },
          paintBrand: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },

      // Truck - minimal fields
      truck: {
        select: {
          id: true,
          plate: true,
          chassisNumber: true,
        },
      },

      // Service orders - needed for progress bar
      serviceOrders: {
        select: {
          id: true,
          description: true,
          status: true,
          type: true,
          statusOrder: true,
          assignedToId: true,
        },
      },
    },
  },

  // Use the original table configuration - it already has the proper renderers
  table: {
    ...tasksListConfig.table,
    // Keep default visible columns optimized for agenda view
    defaultVisible: ['name', 'customer.fantasyName', 'generalPainting.name', 'forecastDate', 'status'],
  },
};