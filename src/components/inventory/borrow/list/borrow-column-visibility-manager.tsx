// Column visibility manager for borrow table
// Provides default visible columns following the same pattern as item table

export function getDefaultVisibleColumns(): Set<string> {
  return new Set([
    "item.name",
    "user.name",
    "status"
  ]);
}
