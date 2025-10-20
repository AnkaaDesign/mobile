// Column visibility manager for order table
// Provides default visible columns following the same pattern as item table

export function getDefaultVisibleColumns(): Set<string> {
  return new Set([
    "description",
    "status",
    "itemsCount"
  ]);
}
