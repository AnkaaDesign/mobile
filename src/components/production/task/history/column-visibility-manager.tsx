import { getDefaultVisibleColumnsWithTablet } from '@/lib/table-utils';

// Mobile columns (< 624px)
const MOBILE_COLUMNS = [
  "name",                    // NOME/LOGOMARCA
  "sector.name",             // SETOR
  "finishedAt",              // FINALIZADO EM
];

// Tablet columns (>= 624px) - adds serial number and finished at
const TABLET_COLUMNS = [
  "name",                    // NOME/LOGOMARCA
  "serialNumber",            // Nº SÉRIE
  "sector.name",             // SETOR
  "finishedAt",              // FINALIZADO EM
];

/**
 * Get default visible columns for task history table
 */
export const getDefaultVisibleColumns = (): Set<string> => {
  return getDefaultVisibleColumnsWithTablet(MOBILE_COLUMNS, TABLET_COLUMNS);
};
