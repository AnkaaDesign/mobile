// Column visibility manager for task table
// Provides default visible columns and utilities for managing column visibility
// Mobile optimized - minimal default columns

export function getDefaultVisibleColumns(): Set<string> {
  return new Set([
    "name",                    // NOME/LOGOMARCA (includes paint square)
    "serialNumber",            // Nº SÉRIE
    "remainingTime"            // TEMPO RESTANTE
  ]);
}
