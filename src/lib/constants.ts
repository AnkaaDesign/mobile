// lib/constants.ts - Mobile app specific constants
import { ACTIVE_USER_STATUSES } from "@/constants";

// Re-export design system constants for convenience
export { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

// Available columns for item tables
export const AVAILABLE_ITEMS_COLUMNS = [
  { id: "name", label: "Nome", sortable: true },
  { id: "barcode", label: "Código de Barras", sortable: true },
  { id: "quantity", label: "Quantidade", sortable: true },
  { id: "price", label: "Preço", sortable: true },
  { id: "supplier", label: "Fornecedor", sortable: true },
  { id: "category", label: "Categoria", sortable: true },
  { id: "status", label: "Status", sortable: true },
  { id: "createdAt", label: "Data de Criação", sortable: true },
  { id: "updatedAt", label: "Última Atualização", sortable: true },
];

// Other mobile-specific constants
export const MOBILE_BREAKPOINTS = {
  small: 320,
  medium: 768,
  large: 1024,
};

export const ITEM_FILTER_DEFAULTS = {
  searchingFor: "",
  status: ACTIVE_USER_STATUSES,
  sortBy: "name",
  sortOrder: "asc",
};

// Navigation theme constants
export const NAV_THEME = {
  light: {
    background: "#ffffff",
    foreground: "#000000",
  },
  dark: {
    background: "#000000",
    foreground: "#ffffff",
  },
};
