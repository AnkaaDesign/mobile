/**
 * Get default visible columns for task history table
 */
export const getDefaultVisibleColumns = (): Set<string> => {
  return new Set([
    "name",
    "customer.fantasyName",
    "generalPainting",
    "sector.name",
    "serialNumber",
    "finishedAt",
  ]);
};
