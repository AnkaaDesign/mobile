/**
 * Get default visible columns for task history table
 */
export const getDefaultVisibleColumns = (): Set<string> => {
  return new Set([
    "name",                    // NOME/LOGOMARCA
    "sector.name",             // SETOR
    "finishedAt",              // FINALIZADO EM
  ]);
};
