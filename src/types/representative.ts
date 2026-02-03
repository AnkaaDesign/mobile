import type { Customer } from './customer';
import type { Task } from './task';

export enum RepresentativeRole {
  COMMERCIAL = 'COMMERCIAL',
  MARKETING = 'MARKETING',
  COORDINATOR = 'COORDINATOR',
  FINANCIAL = 'FINANCIAL',
  FLEET_MANAGER = 'FLEET_MANAGER',
}

export interface Representative {
  id: string;
  email?: string | null;
  phone: string;
  name: string;
  password?: string | null;
  customerId?: string | null; // Made optional to match web - representatives can be global or customer-specific
  role: RepresentativeRole;
  isActive: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  customer?: Customer | null;
  tasks?: Task[];
}

export interface RepresentativeCreateFormData {
  email?: string;
  phone: string;
  name: string;
  password?: string;
  customerId?: string | null; // Made optional to match web - can create global representatives
  role: RepresentativeRole;
  isActive?: boolean;
}

// For inline representative creation within task forms (matches web)
export interface RepresentativeCreateInline {
  email?: string;
  phone: string;
  name: string;
  password?: string;
  role: RepresentativeRole;
  isActive?: boolean;
}

export interface RepresentativeUpdateFormData {
  email?: string;
  phone?: string;
  name?: string;
  password?: string;
  role?: RepresentativeRole;
  isActive?: boolean;
}

export interface RepresentativeGetManyFormData {
  page?: number;
  pageSize?: number;
  search?: string;
  customerId?: string;
  role?: RepresentativeRole;
  isActive?: boolean;
  include?: string[];
}

export interface RepresentativeGetManyResponse {
  data: Representative[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
}

export interface RepresentativeLoginFormData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  representative: Representative;
}

// Formatted representative display
export interface RepresentativeDisplay {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  phone: string;
  email?: string;
  customerName: string;
  isActive: boolean;
  hasSystemAccess: boolean;
}

// Representative role labels for display
export const REPRESENTATIVE_ROLE_LABELS: Record<RepresentativeRole, string> = {
  [RepresentativeRole.COMMERCIAL]: 'Comercial',
  [RepresentativeRole.MARKETING]: 'Marketing',
  [RepresentativeRole.COORDINATOR]: 'Coordenador',
  [RepresentativeRole.FINANCIAL]: 'Financeiro',
  [RepresentativeRole.FLEET_MANAGER]: 'Gestor de Frota',
};

// Representative role colors for UI (React Native color names)
export const REPRESENTATIVE_ROLE_COLORS: Record<RepresentativeRole, string> = {
  [RepresentativeRole.COMMERCIAL]: '#2196F3', // Blue
  [RepresentativeRole.MARKETING]: '#9C27B0', // Purple
  [RepresentativeRole.COORDINATOR]: '#4CAF50', // Green
  [RepresentativeRole.FINANCIAL]: '#FF9800', // Orange
  [RepresentativeRole.FLEET_MANAGER]: '#757575', // Gray
};

// Row-based state management for representative form
export interface RepresentativeRowData {
  id: string;
  email?: string | null;
  phone: string;
  name: string;
  role: RepresentativeRole;
  isActive: boolean;
  isEditing?: boolean;
  isNew?: boolean;
  isSaving?: boolean;
  error?: string | null;
  customerId?: string | null; // Which customer this representative belongs to (for new representatives)
}