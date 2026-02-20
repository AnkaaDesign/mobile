import type { Company } from './customer';
import type { Task } from './task';

export enum ResponsibleRole {
  COMMERCIAL = 'COMMERCIAL',
  OWNER = 'OWNER',
  SELLER = 'SELLER',
  REPRESENTATIVE = 'REPRESENTATIVE',
  COORDINATOR = 'COORDINATOR',
  MARKETING = 'MARKETING',
  FINANCIAL = 'FINANCIAL',
  FLEET_MANAGER = 'FLEET_MANAGER',
  DRIVER = 'DRIVER',
}

export interface Responsible {
  id: string;
  email?: string | null;
  phone: string;
  name: string;
  password?: string | null;
  companyId?: string | null; // Made optional to match web - responsibles can be global or company-specific
  role: ResponsibleRole;
  isActive: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  company?: Company | null;
  tasks?: Task[];
}

export interface ResponsibleCreateFormData {
  email?: string;
  phone: string;
  name: string;
  password?: string;
  companyId?: string | null; // Made optional to match web - can create global responsibles
  role: ResponsibleRole;
  isActive?: boolean;
}

// For inline responsible creation within task forms (matches web)
export interface ResponsibleCreateInline {
  email?: string;
  phone: string;
  name: string;
  password?: string;
  role: ResponsibleRole;
  isActive?: boolean;
}

export interface ResponsibleUpdateFormData {
  email?: string;
  phone?: string;
  name?: string;
  password?: string;
  role?: ResponsibleRole;
  isActive?: boolean;
}

export interface ResponsibleGetManyFormData {
  page?: number;
  pageSize?: number;
  search?: string;
  companyId?: string;
  role?: ResponsibleRole;
  isActive?: boolean;
  include?: string[];
}

export interface ResponsibleGetManyResponse {
  data: Responsible[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
    hasNextPage: boolean;
  };
}

export interface ResponsibleLoginFormData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  responsible: Responsible;
}

// Formatted responsible display
export interface ResponsibleDisplay {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  phone: string;
  email?: string;
  companyName: string;
  isActive: boolean;
  hasSystemAccess: boolean;
}

// Responsible role labels for display
export const RESPONSIBLE_ROLE_LABELS: Record<ResponsibleRole, string> = {
  [ResponsibleRole.COMMERCIAL]: 'Comercial',
  [ResponsibleRole.OWNER]: 'Proprietário',
  [ResponsibleRole.SELLER]: 'Vendedor',
  [ResponsibleRole.REPRESENTATIVE]: 'Representante',
  [ResponsibleRole.COORDINATOR]: 'Coordenador',
  [ResponsibleRole.MARKETING]: 'Marketing',
  [ResponsibleRole.FINANCIAL]: 'Financeiro',
  [ResponsibleRole.FLEET_MANAGER]: 'Gestor de Frota',
  [ResponsibleRole.DRIVER]: 'Motorista',
};

// Responsible role colors for UI (React Native color names)
export const RESPONSIBLE_ROLE_COLORS: Record<ResponsibleRole, string> = {
  [ResponsibleRole.COMMERCIAL]: '#2196F3', // Blue
  [ResponsibleRole.OWNER]: '#FF5722', // Deep Orange
  [ResponsibleRole.SELLER]: '#00BCD4', // Cyan
  [ResponsibleRole.REPRESENTATIVE]: '#607D8B', // Blue Grey
  [ResponsibleRole.COORDINATOR]: '#4CAF50', // Green
  [ResponsibleRole.MARKETING]: '#9C27B0', // Purple
  [ResponsibleRole.FINANCIAL]: '#FF9800', // Orange
  [ResponsibleRole.FLEET_MANAGER]: '#757575', // Gray
  [ResponsibleRole.DRIVER]: '#795548', // Brown
};

// Row-based state management for responsible form
export interface ResponsibleRowData {
  id: string;
  email?: string | null;
  phone: string;
  name: string;
  role: ResponsibleRole;
  isActive: boolean;
  isEditing?: boolean;
  isNew?: boolean;
  isSaving?: boolean;
  error?: string | null;
  companyId?: string | null; // Which company this responsible belongs to (for new responsibles)
}
