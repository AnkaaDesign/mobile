// packages/interfaces/src/user.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseMergeResponse, BaseBatchResponse } from "./common";
import type { ORDER_BY_DIRECTION, USER_STATUS } from '@/constants';
import type { PpeSize, PpeDelivery, PpeDeliverySchedule, PpeSizeIncludes, PpeDeliveryIncludes, PpeDeliveryScheduleIncludes } from "./ppe";
import type { SeenNotification, Notification, SeenNotificationIncludes, NotificationIncludes } from "./notification";
import type { Position, PositionIncludes, PositionOrderBy } from "./position";
import type { Preferences, PreferencesIncludes } from "./preferences";
import type { Warning, WarningIncludes } from "./warning";
import type { Sector, SectorIncludes, SectorOrderBy } from "./sector";
import type { Vacation, VacationIncludes } from "./vacation";
import type { Task, TaskIncludes } from "./task";
import type { Activity, ActivityIncludes } from "./activity";
import type { Borrow, BorrowIncludes } from "./borrow";
import type { ChangeLog, ChangeLogIncludes } from "./changelog";
import type { Bonus, BonusIncludes } from "./bonus";
import type { File } from "./file";

// =====================
// Main Entity Interface
// =====================

export interface User extends BaseEntity {
  email: string | null;
  name: string;
  avatarId: string | null;
  status: USER_STATUS;
  statusOrder: number; // 1=Ativo, 2=Inativo, 3=Suspenso
  isActive: boolean;
  phone: string | null;
  phoneNumber: string | null; // Alias for phone
  password?: string | null;
  positionId: string | null;
  preferenceId: string | null;
  pis: string | null;
  cpf: string | null;
  verified: boolean;
  birth: Date | null; // Date of birth (optional in database)
  admissional: Date | null;
  performanceLevel: number;
  sectorId: string | null;
  address: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  site: string | null;
  zipCode: string | null;
  verificationCode?: string | null;
  verificationExpiresAt?: Date | null;
  verificationType?: string | null | undefined;
  requirePasswordChange?: boolean;
  lastLoginAt?: Date | null;
  sessionToken: string | null;
  payrollNumber: number | null;
  profilePictureUrl: string | null; // Profile picture URL

  // Status timestamp tracking
  effectedAt: Date | null; // When user became permanently effected/hired
  contractedAt: Date | null;
  exp1StartAt: Date | null;
  exp1EndAt: Date | null;
  exp2StartAt: Date | null;
  exp2EndAt: Date | null;
  dismissedAt: Date | null;

  // Relations
  avatar?: File;
  ppeSize?: PpeSize;
  preference?: Preferences;
  position?: Position;
  sector?: Sector;
  managedSector?: Sector;
  activities?: Activity[];
  borrows?: Borrow[];
  notifications?: Notification[];
  tasks?: Task[];
  vacations?: Vacation[];
  bonuses?: Bonus[];
  warningsCollaborator?: Warning[];
  warningsSupervisor?: Warning[];
  warningsWitness?: Warning[];
  ppeDeliveries?: PpeDelivery[];
  ppeDeliveriesApproved?: PpeDelivery[];
  ppeSchedules?: PpeDeliverySchedule[];
  changeLogs?: ChangeLog[];
  seenNotification?: SeenNotification[];
  createdTasks?: Task[];

  // Count fields (when included)
  _count?: {
    activities?: number;
    vacations?: number;
    bonuses?: number;
    tasks?: number;
    createdTasks?: number; // Tasks created by this user
    workOrders?: number;
    orders?: number;
    suppliers?: number;
    items?: number;
    maintenances?: number;
    productionBatches?: number;
    parkingRecords?: number;
    files?: number;
    changeLogs?: number;
    seenNotification?: number;
    warnings?: number; // Warnings count
    ppeRequests?: number; // PPE requests count
  };
}

// =====================
// Include Types
// =====================

export interface UserIncludes {
  avatar?: boolean;
  ppeSize?:
    | boolean
    | {
        include?: PpeSizeIncludes;
      };
  preference?:
    | boolean
    | {
        include?: PreferencesIncludes;
      };
  position?:
    | boolean
    | {
        include?: PositionIncludes;
      };
  sector?:
    | boolean
    | {
        include?: SectorIncludes;
      };
  managedSector?:
    | boolean
    | {
        include?: SectorIncludes;
      };
  activities?:
    | boolean
    | {
        include?: ActivityIncludes;
      };
  borrows?:
    | boolean
    | {
        include?: BorrowIncludes;
      };
  notifications?:
    | boolean
    | {
        include?: NotificationIncludes;
      };
  tasks?:
    | boolean
    | {
        include?: TaskIncludes;
      };
  vacations?:
    | boolean
    | {
        include?: VacationIncludes;
      };
  bonuses?:
    | boolean
    | {
        include?: BonusIncludes;
      };
  warningsCollaborator?:
    | boolean
    | {
        include?: WarningIncludes;
      };
  warningsSupervisor?:
    | boolean
    | {
        include?: WarningIncludes;
      };
  warningsWitness?:
    | boolean
    | {
        include?: WarningIncludes;
      };
  ppeDeliveries?:
    | boolean
    | {
        include?: PpeDeliveryIncludes;
      };
  ppeDeliveriesApproved?:
    | boolean
    | {
        include?: PpeDeliveryIncludes;
      };
  ppeSchedules?:
    | boolean
    | {
        include?: PpeDeliveryScheduleIncludes;
      };
  changeLogs?:
    | boolean
    | {
        include?: ChangeLogIncludes;
      };
  seenNotification?:
    | boolean
    | {
        include?: SeenNotificationIncludes;
      };
  createdTasks?:
    | boolean
    | {
        include?: TaskIncludes;
      };
}

// =====================
// Order By Types
// =====================

export interface UserOrderBy {
  id?: ORDER_BY_DIRECTION;
  email?: ORDER_BY_DIRECTION;
  name?: ORDER_BY_DIRECTION;
  avatarId?: ORDER_BY_DIRECTION;
  token?: ORDER_BY_DIRECTION;
  status?: ORDER_BY_DIRECTION;
  statusOrder?: ORDER_BY_DIRECTION;
  isActive?: ORDER_BY_DIRECTION;
  phone?: ORDER_BY_DIRECTION;
  password?: ORDER_BY_DIRECTION;
  pis?: ORDER_BY_DIRECTION;
  cpf?: ORDER_BY_DIRECTION;
  verified?: ORDER_BY_DIRECTION;
  payrollNumber?: ORDER_BY_DIRECTION;
  birth?: ORDER_BY_DIRECTION;
  admissional?: ORDER_BY_DIRECTION;
  effectedAt?: ORDER_BY_DIRECTION;
  contractedAt?: ORDER_BY_DIRECTION;
  exp1StartAt?: ORDER_BY_DIRECTION;
  exp1EndAt?: ORDER_BY_DIRECTION;
  exp2StartAt?: ORDER_BY_DIRECTION;
  exp2EndAt?: ORDER_BY_DIRECTION;
  dismissedAt?: ORDER_BY_DIRECTION;
  performanceLevel?: ORDER_BY_DIRECTION;
  address?: ORDER_BY_DIRECTION;
  addressNumber?: ORDER_BY_DIRECTION;
  addressComplement?: ORDER_BY_DIRECTION;
  neighborhood?: ORDER_BY_DIRECTION;
  city?: ORDER_BY_DIRECTION;
  state?: ORDER_BY_DIRECTION;
  zipCode?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  position?: PositionOrderBy;
  sector?: SectorOrderBy;
  managedSector?: SectorOrderBy;
}

// =====================
// Response Interfaces
// =====================

export type UserGetUniqueResponse = BaseGetUniqueResponse<User>;
export type UserGetManyResponse = BaseGetManyResponse<User>;
export type UserCreateResponse = BaseCreateResponse<User>;
export type UserUpdateResponse = BaseUpdateResponse<User>;
export type UserDeleteResponse = BaseDeleteResponse;
export type UserMergeResponse = BaseMergeResponse<User>;

// =====================
// Batch Operation Responses
// =====================

export type UserBatchCreateResponse<T> = BaseBatchResponse<User, T>;
export type UserBatchUpdateResponse<T> = BaseBatchResponse<User, T & { id: string }>;
export type UserBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
