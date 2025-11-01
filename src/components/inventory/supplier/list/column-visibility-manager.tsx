
// Function to get default visible columns for suppliers
export function getDefaultVisibleColumns(): Set<string> {
  return new Set([
    "fantasyName",
    "city",
    "itemsCount"
  ]);
}
