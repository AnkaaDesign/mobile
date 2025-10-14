// Column visibility manager for task table
// Provides default visible columns and utilities for managing column visibility

export function getDefaultVisibleColumns(): Set<string> {
  return new Set([
    "name",
    "customer.fantasyName",
    "status"
  ]);
}
