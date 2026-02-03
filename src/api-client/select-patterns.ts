/**
 * Optimized select patterns for API queries
 * These patterns reduce data transfer by 40-60% compared to full includes
 */

// ============================================
// TASK SELECT PATTERNS
// ============================================

export const TASK_SELECT_MINIMAL = {
  id: true,
  name: true,
  status: true,
  statusOrder: true,
  serialNumber: true,
  term: true,
  forecastDate: true,
  entryDate: true,
  startedAt: true,
  finishedAt: true,
  createdAt: true,
  updatedAt: true,
  sector: {
    select: {
      id: true,
      name: true,
    },
  },
  customer: {
    select: {
      id: true,
      fantasyName: true, // Only fantasy name for lists
    },
  },
  truck: {
    select: {
      id: true,
      plate: true,
      spot: true,
    },
  },
} as const;

export const TASK_SELECT_CARD = {
  ...TASK_SELECT_MINIMAL,
  details: true,
  commission: true,
  createdById: true,
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  serviceOrders: {
    select: {
      id: true,
      type: true,
      status: true,
      description: true,
    },
  },
  _count: {
    select: {
      artworks: true,
      logoPaints: true,
      serviceOrders: true,
    },
  },
} as const;

export const TASK_SELECT_SCHEDULE = {
  ...TASK_SELECT_MINIMAL,
  serviceOrders: {
    select: {
      id: true,
      type: true,
      status: true,
      startedAt: true,
      finishedAt: true,
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  truck: {
    select: {
      id: true,
      plate: true,
      spot: true,
      category: true,
    },
  },
} as const;

export const TASK_SELECT_PREPARATION = {
  ...TASK_SELECT_MINIMAL,
  serviceOrders: {
    select: {
      id: true,
      type: true,
      status: true,
      description: true,
      position: true,
    },
  },
  generalPainting: {
    select: {
      id: true,
      name: true,
      code: true,
      hexColor: true,
      finish: true,
      // NO formulas - major performance gain
    },
  },
  _count: {
    select: {
      artworks: true,
      logoPaints: true,
    },
  },
} as const;

export const TASK_SELECT_DETAIL = {
  id: true,
  name: true,
  status: true,
  statusOrder: true,
  serialNumber: true,
  details: true,
  entryDate: true,
  term: true,
  startedAt: true,
  finishedAt: true,
  forecastDate: true,
  commission: true,
  createdAt: true,
  updatedAt: true,
  customerId: true,
  invoiceToId: true,
  sectorId: true,
  createdById: true,
  paintId: true,
  sector: {
    select: {
      id: true,
      name: true,
    },
  },
  customer: {
    select: {
      id: true,
      fantasyName: true,
      corporateName: true,
      cnpj: true,
      phones: true,
      emails: true,
    },
  },
  invoiceTo: {
    select: {
      id: true,
      fantasyName: true,
      cnpj: true,
    },
  },
  generalPainting: {
    select: {
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
      // NO formulas unless explicitly needed
    },
  },
  logoPaints: {
    select: {
      id: true,
      name: true,
      code: true,
      hexColor: true,
      finish: true,
      // NO formulas
    },
  },
  serviceOrders: true, // Full data for detail view
  truck: true, // Full truck data for detail view
  artworks: {
    select: {
      id: true,
      fileId: true,
      status: true,
      file: {
        select: {
          id: true,
          filename: true,
          path: true,
          mimetype: true,
          size: true,
          thumbnailUrl: true,
        },
      },
    },
  },
  budgets: {
    select: {
      id: true,
      filename: true,
      path: true,
      mimetype: true,
      size: true,
      thumbnailUrl: true,
    },
  },
  invoices: {
    select: {
      id: true,
      filename: true,
      path: true,
      mimetype: true,
      size: true,
      thumbnailUrl: true,
    },
  },
  receipts: {
    select: {
      id: true,
      filename: true,
      path: true,
      mimetype: true,
      size: true,
      thumbnailUrl: true,
    },
  },
  pricing: {
    select: {
      id: true,
      subtotal: true,
      discount: true,
      total: true,
      items: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  representatives: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
    },
  },
  _count: {
    select: {
      artworks: true,
      logoPaints: true,
      serviceOrders: true,
      airbrushings: true,
      cuts: true,
    },
  },
} as const;

// ============================================
// CUSTOMER SELECT PATTERNS
// ============================================

/**
 * Minimal customer select - for lists and references where only name is needed
 */
export const CUSTOMER_SELECT_MINIMAL = {
  id: true,
  fantasyName: true,
} as const;

/**
 * Customer select for combobox/selector components
 */
export const CUSTOMER_SELECT_COMBOBOX = {
  id: true,
  fantasyName: true,
  corporateName: true,
  cnpj: true,
  cpf: true,
  logoId: true,
  logo: {
    select: {
      id: true,
      url: true,
    },
  },
} as const;

/**
 * Customer select for list views - includes essential display fields
 */
export const CUSTOMER_SELECT_LIST = {
  id: true,
  fantasyName: true,
  corporateName: true,
  cnpj: true,
  cpf: true,
  email: true,
  phones: true,
  city: true,
  state: true,
  registrationStatus: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
  logoId: true,
  economicActivityId: true,
  logo: {
    select: {
      id: true,
      url: true,
      name: true,
    },
  },
  economicActivity: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  _count: {
    select: {
      tasks: true,
    },
  },
} as const;

/**
 * Customer select for task context - when customer is referenced by tasks
 */
export const CUSTOMER_SELECT_FOR_TASK = {
  id: true,
  fantasyName: true,
  corporateName: true,
  cnpj: true,
  cpf: true,
  phones: true,
  email: true,
} as const;

/**
 * Customer select for card display in task/service context
 */
export const CUSTOMER_SELECT_CARD = {
  id: true,
  fantasyName: true,
  corporateName: true,
  cnpj: true,
  cpf: true,
  email: true,
  phones: true,
  address: true,
  addressNumber: true,
  neighborhood: true,
  city: true,
  state: true,
  zipCode: true,
} as const;

/**
 * Customer select for form editing
 */
export const CUSTOMER_SELECT_FORM = {
  id: true,
  fantasyName: true,
  corporateName: true,
  cnpj: true,
  cpf: true,
  email: true,
  phones: true,
  site: true,
  address: true,
  addressNumber: true,
  addressComplement: true,
  neighborhood: true,
  city: true,
  state: true,
  zipCode: true,
  registrationStatus: true,
  tags: true,
  economicActivityId: true,
  logoId: true,
  logo: {
    select: {
      id: true,
      url: true,
      name: true,
      mimeType: true,
    },
  },
  economicActivity: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
} as const;

/**
 * Customer select for detail view - includes most fields needed for display
 */
export const CUSTOMER_SELECT_DETAIL = {
  id: true,
  fantasyName: true,
  corporateName: true,
  cnpj: true,
  cpf: true,
  email: true,
  phones: true,
  site: true,
  address: true,
  addressNumber: true,
  addressComplement: true,
  neighborhood: true,
  city: true,
  state: true,
  zipCode: true,
  registrationStatus: true,
  tags: true,
  createdAt: true,
  logoId: true,
  logo: {
    select: {
      id: true,
      url: true,
      name: true,
      mimeType: true,
    },
  },
  _count: {
    select: {
      tasks: true,
      serviceOrders: true,
      services: true,
    },
  },
} as const;

// ============================================
// USER SELECT PATTERNS
// ============================================

export const USER_SELECT_MINIMAL = {
  id: true,
  name: true,
} as const;

export const USER_SELECT_COMBOBOX = {
  id: true,
  name: true,
  email: true,
  status: true,
  isActive: true,
} as const;

export const USER_SELECT_WITH_SECTOR = {
  id: true,
  name: true,
  email: true,
  sector: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

export const USER_SELECT_WITH_POSITION = {
  id: true,
  name: true,
  email: true,
  position: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

export const USER_SELECT_WITH_EMPLOYMENT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  isActive: true,
  payrollNumber: true,
  sector: {
    select: {
      id: true,
      name: true,
    },
  },
  position: {
    select: {
      id: true,
      name: true,
      hierarchy: true,
    },
  },
} as const;

export const USER_SELECT_LIST = {
  id: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  isActive: true,
  avatarId: true,
  payrollNumber: true,
  verified: true,
  lastLoginAt: true,
  createdAt: true,
  sector: {
    select: {
      id: true,
      name: true,
    },
  },
  position: {
    select: {
      id: true,
      name: true,
    },
  },
  managedSector: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

export const USER_SELECT_DETAIL = {
  id: true,
  name: true,
  email: true,
  phone: true,
  cpf: true,
  pis: true,
  birth: true,
  status: true,
  statusOrder: true,
  isActive: true,
  verified: true,
  avatarId: true,
  payrollNumber: true,
  performanceLevel: true,
  address: true,
  addressNumber: true,
  addressComplement: true,
  neighborhood: true,
  city: true,
  state: true,
  zipCode: true,
  effectedAt: true,
  exp1StartAt: true,
  exp1EndAt: true,
  exp2StartAt: true,
  exp2EndAt: true,
  dismissedAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  avatar: {
    select: {
      id: true,
      filename: true,
      path: true,
      thumbnailUrl: true,
    },
  },
  sector: {
    select: {
      id: true,
      name: true,
    },
  },
  position: {
    select: {
      id: true,
      name: true,
      hierarchy: true,
    },
  },
  managedSector: {
    select: {
      id: true,
      name: true,
    },
  },
  ppeSize: true,
  preference: {
    select: {
      notifications: true,
    },
  },
  _count: {
    select: {
      tasks: true,
      activities: true,
      borrows: true,
      vacations: true,
      commissions: true,
    },
  },
} as const;

// ============================================
// ITEM SELECT PATTERNS
// ============================================

export const ITEM_SELECT_MINIMAL = {
  id: true,
  name: true,
  uniCode: true,
  quantity: true,
  isActive: true,
} as const;

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
} as const;

export const ITEM_SELECT_LIST = {
  id: true,
  name: true,
  uniCode: true,
  quantity: true,
  maxQuantity: true,
  reorderPoint: true,
  monthlyConsumption: true,
  isActive: true,
  abcCategory: true,
  xyzCategory: true,
  brandId: true,
  categoryId: true,
  supplierId: true,
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
  prices: {
    take: 1,
    orderBy: {
      updatedAt: 'desc',
    },
    select: {
      id: true,
      value: true,
      updatedAt: true,
    },
  },
} as const;

export const ITEM_SELECT_FORM = {
  id: true,
  name: true,
  uniCode: true,
  quantity: true,
  maxQuantity: true,
  reorderPoint: true,
  reorderQuantity: true,
  boxQuantity: true,
  monthlyConsumption: true,
  monthlyConsumptionTrendPercent: true,
  barcodes: true,
  shouldAssignToUser: true,
  abcCategory: true,
  xyzCategory: true,
  ppeType: true,
  ppeCA: true,
  ppeDeliveryMode: true,
  ppeStandardQuantity: true,
  icms: true,
  ipi: true,
  isActive: true,
  brandId: true,
  categoryId: true,
  supplierId: true,
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
      corporateName: true,
    },
  },
  prices: {
    take: 5,
    orderBy: {
      updatedAt: 'desc',
    },
  },
  measures: true,
} as const;

export const ITEM_SELECT_DETAIL = {
  ...ITEM_SELECT_FORM,
  prices: {
    take: 10,
    orderBy: {
      updatedAt: 'desc',
    },
  },
  _count: {
    select: {
      activities: true,
      borrows: true,
      orderItems: true,
      ppeDelivery: true,
    },
  },
} as const;

// ============================================
// ACTIVITY SELECT PATTERNS
// ============================================

export const ACTIVITY_SELECT_TABLE = {
  id: true,
  quantity: true,
  operation: true,
  reason: true,
  reasonOrder: true,
  createdAt: true,
  userId: true,
  itemId: true,
  orderId: true,
  item: {
    select: {
      id: true,
      name: true,
      uniCode: true,
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
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

export const ACTIVITY_SELECT_FORM = {
  id: true,
  quantity: true,
  operation: true,
  reason: true,
  reasonOrder: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  itemId: true,
  orderId: true,
  orderItemId: true,
  item: {
    select: {
      id: true,
      name: true,
      uniCode: true,
      quantity: true, // Current stock
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

export const ACTIVITY_SELECT_DETAIL = {
  id: true,
  quantity: true,
  operation: true,
  reason: true,
  reasonOrder: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  itemId: true,
  orderId: true,
  orderItemId: true,
  item: {
    select: {
      id: true,
      name: true,
      uniCode: true,
      quantity: true,
      maxQuantity: true,
      reorderPoint: true,
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
      supplier: {
        select: {
          id: true,
          fantasyName: true,
        },
      },
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
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
  order: {
    select: {
      id: true,
      description: true,
      status: true,
      forecast: true,
      supplier: {
        select: {
          id: true,
          fantasyName: true,
        },
      },
    },
  },
  orderItem: {
    select: {
      id: true,
      orderedQuantity: true,
      receivedQuantity: true,
      unitPrice: true,
    },
  },
} as const;

// ============================================
// BORROW SELECT PATTERNS
// ============================================

export const BORROW_SELECT_TABLE = {
  id: true,
  quantity: true,
  status: true,
  statusOrder: true,
  returnedAt: true,
  createdAt: true,
  item: {
    select: {
      id: true,
      name: true,
      uniCode: true,
      quantity: true, // Available quantity
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
    },
  },
  user: {
    select: {
      id: true,
      name: true,
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
} as const;

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
  item: {
    select: {
      id: true,
      name: true,
      uniCode: true,
      quantity: true,
      isPpe: true,
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
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      sectorId: true,
      positionId: true,
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
} as const;

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
  item: {
    select: {
      id: true,
      name: true,
      uniCode: true,
      quantity: true,
      isActive: true,
      brandId: true,
      categoryId: true,
      supplierId: true,
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
          corporateName: true, // Fallback for display
        },
      },
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      cpf: true, // Used in personal borrow detail
      status: true,
      isActive: true,
      sectorId: true,
      positionId: true,
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
} as const;

// ============================================
// HELPER FUNCTION TO GET SELECT BY CONTEXT
// ============================================

export type EntityType = 'task' | 'user' | 'item' | 'activity' | 'borrow' | 'customer';
export type ViewType = 'minimal' | 'combobox' | 'list' | 'table' | 'card' | 'form' | 'detail' | 'schedule' | 'preparation';

export function getSelectPattern(entity: EntityType, view: ViewType): any {
  const patterns: Record<EntityType, Record<string, any>> = {
    task: {
      minimal: TASK_SELECT_MINIMAL,
      list: TASK_SELECT_MINIMAL,
      table: TASK_SELECT_MINIMAL,
      card: TASK_SELECT_CARD,
      schedule: TASK_SELECT_SCHEDULE,
      preparation: TASK_SELECT_PREPARATION,
      form: TASK_SELECT_DETAIL,
      detail: TASK_SELECT_DETAIL,
    },
    customer: {
      minimal: CUSTOMER_SELECT_MINIMAL,
      combobox: CUSTOMER_SELECT_COMBOBOX,
      list: CUSTOMER_SELECT_LIST,
      table: CUSTOMER_SELECT_LIST,
      card: CUSTOMER_SELECT_CARD,
      form: CUSTOMER_SELECT_FORM,
      detail: CUSTOMER_SELECT_DETAIL,
    },
    user: {
      minimal: USER_SELECT_MINIMAL,
      combobox: USER_SELECT_COMBOBOX,
      list: USER_SELECT_LIST,
      table: USER_SELECT_LIST,
      form: USER_SELECT_DETAIL,
      detail: USER_SELECT_DETAIL,
    },
    item: {
      minimal: ITEM_SELECT_MINIMAL,
      combobox: ITEM_SELECT_COMBOBOX,
      list: ITEM_SELECT_LIST,
      table: ITEM_SELECT_LIST,
      form: ITEM_SELECT_FORM,
      detail: ITEM_SELECT_DETAIL,
    },
    activity: {
      table: ACTIVITY_SELECT_TABLE,
      list: ACTIVITY_SELECT_TABLE,
      form: ACTIVITY_SELECT_FORM,
      detail: ACTIVITY_SELECT_DETAIL,
    },
    borrow: {
      table: BORROW_SELECT_TABLE,
      list: BORROW_SELECT_TABLE,
      form: BORROW_SELECT_FORM,
      detail: BORROW_SELECT_DETAIL,
    },
  };

  return patterns[entity]?.[view] || null;
}

// Export type for TypeScript support
export type SelectPattern = ReturnType<typeof getSelectPattern>;