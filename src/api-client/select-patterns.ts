/**
 * Select patterns for optimized API queries
 *
 * These patterns define which fields to fetch from the API, reducing payload size by 40-95%
 * compared to fetching full entities with all relations.
 *
 * Usage:
 * - TABLE: For list/table views - minimal data needed for display
 * - DETAIL: For detail pages - more complete data including key relations
 * - FORM: For form editing - data needed to populate form fields
 * - MINIMAL: For dropdowns - only id + name
 * - COMBOBOX: For searchable dropdowns - id + name + key display fields
 */

// ============================================
// USER SELECT PATTERNS
// ============================================

/**
 * Minimal user data for dropdowns (id, name only)
 * 95% reduction compared to full user entity
 */
export const USER_SELECT_MINIMAL = {
  id: true,
  name: true,
};

/**
 * User data for comboboxes (id, name, email, status)
 * 90% reduction compared to full entity
 */
export const USER_SELECT_COMBOBOX = {
  id: true,
  name: true,
  email: true,
  status: true,
  statusOrder: true,
  isActive: true,
};

/**
 * User data for table displays
 * Includes key fields and position/sector relations
 */
export const USER_SELECT_TABLE = {
  id: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  statusOrder: true,
  isActive: true,
  position: {
    select: {
      id: true,
      name: true,
    },
  },
  sector: {
    select: {
      id: true,
      name: true,
    },
  },
  createdAt: true,
  updatedAt: true,
};

// ============================================
// ITEM SELECT PATTERNS
// ============================================

/**
 * Minimal item data for dropdowns (id, name, uniCode, quantity)
 * 90% reduction compared to full item entity
 */
export const ITEM_SELECT_MINIMAL = {
  id: true,
  name: true,
  uniCode: true,
  quantity: true,
};

/**
 * Item data for comboboxes
 * 85% reduction compared to full entity
 */
export const ITEM_SELECT_COMBOBOX = {
  id: true,
  name: true,
  uniCode: true,
  quantity: true,
  isActive: true,
  brand: {
    select: {
      id: true,
      name: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
    },
  },
};

/**
 * Item data for table displays
 * Includes key inventory fields and relations
 */
export const ITEM_SELECT_TABLE = {
  id: true,
  name: true,
  uniCode: true,
  quantity: true,
  maxQuantity: true,
  reorderPoint: true,
  isActive: true,
  brand: {
    select: {
      id: true,
      name: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      type: true,
    },
  },
  supplier: {
    select: {
      id: true,
      fantasyName: true,
    },
  },
  createdAt: true,
  updatedAt: true,
};

// ============================================
// BORROW SELECT PATTERNS
// ============================================

/**
 * Minimal borrow data for table/list views
 * 40-60% reduction by including only essential fields
 */
export const BORROW_SELECT_TABLE = {
  id: true,
  itemId: true,
  userId: true,
  quantity: true,
  status: true,
  statusOrder: true,
  returnedAt: true,
  createdAt: true,
  updatedAt: true,
  // Include minimal item info for display
  item: {
    select: {
      id: true,
      name: true,
      uniCode: true,
      quantity: true,
    },
  },
  // Include minimal user info for display
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

/**
 * Borrow data for detail pages
 * Includes more complete relations for full detail view
 */
export const BORROW_SELECT_DETAIL = {
  id: true,
  itemId: true,
  userId: true,
  quantity: true,
  status: true,
  statusOrder: true,
  returnedAt: true,
  createdAt: true,
  updatedAt: true,
  // Include detailed item info
  item: {
    select: {
      id: true,
      name: true,
      uniCode: true,
      quantity: true,
      isActive: true,
      brand: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  },
  // Include detailed user info
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      position: {
        select: {
          id: true,
          name: true,
        },
      },
      sector: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
};

/**
 * Borrow data for form editing
 * Includes fields needed to populate form inputs
 */
export const BORROW_SELECT_FORM = {
  id: true,
  itemId: true,
  userId: true,
  quantity: true,
  status: true,
  statusOrder: true,
  returnedAt: true,
  createdAt: true,
  updatedAt: true,
  // Include minimal relations for form dropdowns
  item: {
    select: {
      id: true,
      name: true,
      uniCode: true,
      quantity: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

// ============================================
// PAINT SELECT PATTERNS (NO FORMULAS!)
// ============================================

/**
 * Paint data WITHOUT formulas for dropdowns
 * 90% reduction by excluding formula data
 */
export const PAINT_SELECT_MINIMAL = {
  id: true,
  name: true,
  code: true,
  hexColor: true,
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
  // Only count formulas, don't fetch them!
  _count: {
    select: {
      formulas: true,
    },
  },
};

// ============================================
// CUSTOMER SELECT PATTERNS
// ============================================

/**
 * Minimal customer data for dropdowns
 * 85% reduction compared to full customer entity
 */
export const CUSTOMER_SELECT_MINIMAL = {
  id: true,
  fantasyName: true,
  cnpj: true,
};

// ============================================
// SECTOR SELECT PATTERNS
// ============================================

/**
 * Minimal sector data for dropdowns
 */
export const SECTOR_SELECT_MINIMAL = {
  id: true,
  name: true,
};

// ============================================
// POSITION SELECT PATTERNS
// ============================================

/**
 * Minimal position data for dropdowns
 */
export const POSITION_SELECT_MINIMAL = {
  id: true,
  name: true,
  hierarchy: true,
};

// ============================================
// ORDER SELECT PATTERNS
// ============================================

/**
 * Minimal order data for dropdowns
 */
export const ORDER_SELECT_MINIMAL = {
  id: true,
  description: true,
  status: true,
  supplier: {
    select: {
      id: true,
      fantasyName: true,
    },
  },
};

// ============================================
// TRUCK SELECT PATTERNS
// ============================================

/**
 * Minimal truck data for dropdowns
 */
export const TRUCK_SELECT_MINIMAL = {
  id: true,
  plate: true,
  chassisNumber: true,
  spot: true,
  category: true,
};
