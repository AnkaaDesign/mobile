/**
 * Centralized Badge Color Configuration System
 *
 * This file defines a comprehensive, consistent color mapping for all badges
 * across the Ankaa application, ensuring no color duplication for different
 * statuses and maintaining semantic meaning.
 *
 * Color Philosophy:
 * - Green: Success, completed, positive actions (entry, approved, active)
 * - Red: Failure, cancelled, negative actions (exit, rejected, lost)
 * - Orange/Amber: Warning states (overdue, pending, partially complete)
 * - Blue: Information, in-progress, neutral active states
 * - Gray: Inactive, muted, disabled states
 */

import {
  ORDER_STATUS,
  TASK_STATUS,
  MAINTENANCE_STATUS,
  USER_STATUS,
  EXTERNAL_WITHDRAWAL_STATUS,
  EXTERNAL_WITHDRAWAL_TYPE,
  VACATION_STATUS,
  SERVICE_ORDER_STATUS,
  AIRBRUSHING_STATUS,
  CUT_STATUS,
  BORROW_STATUS,
  PPE_REQUEST_STATUS,
  PPE_DELIVERY_STATUS,
  MAINTENANCE_SCHEDULE_STATUS,
  SMS_VERIFICATION_STATUS,
  EMAIL_STATUS,
  VERIFICATION_STATUS,
  BATCH_OPERATION_STATUS,
  PRIORITY_TYPE,
  URGENCY_LEVEL,
  RISK_LEVEL,
  STOCK_LEVEL,
  HEALTH_STATUS,
  PERFORMANCE_LEVEL,
  NOTIFICATION_IMPORTANCE,
  WARNING_SEVERITY,
  WORKLOAD_LEVEL,
  EFFORT_LEVEL,
  CONFIDENCE_LEVEL,
  ACTIVITY_LEVEL,
  ACTIVITY_OPERATION,
  TREND_DIRECTION,
  TREND_TYPE,
  ABC_CATEGORY,
  XYZ_CATEGORY,
  VALIDATION_SEVERITY,
  VERIFICATION_ERROR_SEVERITY,
  SECTOR_PRIVILEGES,
  COMMISSION_STATUS,} from "./enums";

/**
 * Badge Variant Types
 * Semantic variants that clearly express status meaning
 */
export type BadgeVariant =
  // Neutral variants
  | "default"
  | "secondary"
  | "muted"
  | "outline"
  | "inactive"
  // Core semantic variants (common across entities)
  | "completed"
  | "cancelled"
  | "pending"
  | "created"
  | "active"
  | "inProgress"
  | "inProduction"
  | "processing"
  | "approved"
  | "rejected"
  | "received"
  | "delivered"
  | "sent"
  | "verified"
  | "expired"
  | "failed"
  | "onHold"
  | "blocked"
  | "suspended"
  | "returned"
  | "lost"
  | "bounced"
  | "partial"
  | "cutting"
  | "finished"
  | "charged"
  | "dismissed"
  | "effected"
  | "reproved"
  // Color utilities (for entity-specific or non-status use)
  | "red"
  | "purple"
  | "teal"
  | "indigo"
  | "pink"
  | "yellow"
  | "amber"
  | "blue"
  | "orange"
  | "green"
  | "gray"
  | "cyan"
  // Deprecated (keep for backward compatibility)
  | "success"
  | "destructive"
  | "primary"
  | "error"
  | "info"
  | "warning";

/**
 * Badge Color Definitions for React Native
 * Maps variants to color values for consistent styling
 */
export const BADGE_COLORS: Record<
  BadgeVariant,
  {
    bg: string;
    text: string;
    border?: string;
  }
> = {
  // ===== NEUTRAL VARIANTS =====
  default: {
    bg: "#737373", // neutral-500 (matching web)
    text: "#ffffff",
  },
  secondary: {
    bg: "#e5e5e5", // neutral-200
    text: "#171717", // neutral-900
  },
  muted: {
    bg: "#6b7280", // gray-500
    text: "#ffffff",
  },
  outline: {
    bg: "transparent",
    text: "#171717", // neutral-900
    border: "#d4d4d4", // neutral-300
  },
  inactive: {
    bg: "#6b7280", // gray-500
    text: "#ffffff",
  },

  // ===== CORE SEMANTIC VARIANTS =====
  // Green status variants (use green-700)
  completed: {
    bg: "#15803d", // green-700
    text: "#ffffff",
  },
  received: {
    bg: "#15803d", // green-700
    text: "#ffffff",
  },
  approved: {
    bg: "#15803d", // green-700
    text: "#ffffff",
  },
  returned: {
    bg: "#15803d", // green-700
    text: "#ffffff",
  },
  delivered: {
    bg: "#15803d", // green-700
    text: "#ffffff",
  },
  active: {
    bg: "#15803d", // green-700
    text: "#ffffff",
  },
  verified: {
    bg: "#15803d", // green-700
    text: "#ffffff",
  },
  sent: {
    bg: "#15803d", // green-700
    text: "#ffffff",
  },

  // Red status variants (use red-700)
  cancelled: {
    bg: "#b91c1c", // red-700
    text: "#ffffff",
  },
  rejected: {
    bg: "#b91c1c", // red-700
    text: "#ffffff",
  },
  lost: {
    bg: "#b91c1c", // red-700
    text: "#ffffff",
  },
  failed: {
    bg: "#b91c1c", // red-700
    text: "#ffffff",
  },
  bounced: {
    bg: "#b91c1c", // red-700
    text: "#ffffff",
  },
  blocked: {
    bg: "#b91c1c", // red-700
    text: "#ffffff",
  },
  suspended: {
    bg: "#b91c1c", // red-700
    text: "#ffffff",
  },

  // Blue status variants (use blue-700)
  created: {
    bg: "#1d4ed8", // blue-700
    text: "#ffffff",
  },
  inProgress: {
    bg: "#1d4ed8", // blue-700
    text: "#ffffff",
  },
  processing: {
    bg: "#1d4ed8", // blue-700
    text: "#ffffff",
  },

  // Amber status variants (use amber-600)
  pending: {
    bg: "#d97706", // amber-600
    text: "#ffffff",
  },
  expired: {
    bg: "#d97706", // amber-600
    text: "#ffffff",
  },

  // Orange status variants (use orange-600)
  onHold: {
    bg: "#ea580c", // orange-600
    text: "#ffffff",
  },

  // ===== COLOR UTILITIES =====
  purple: {
    bg: "#9333ea", // purple-600
    text: "#ffffff",
  },
  teal: {
    bg: "#14b8a6", // teal-500
    text: "#ffffff",
  },
  indigo: {
    bg: "#4f46e5", // indigo-600
    text: "#ffffff",
  },
  pink: {
    bg: "#db2777", // pink-600
    text: "#ffffff",
  },
  yellow: {
    bg: "#eab308", // yellow-500
    text: "#ffffff",
  },
  amber: {
    bg: "#f59e0b", // amber-500
    text: "#ffffff",
  },
  blue: {
    bg: "#2563eb", // blue-600
    text: "#ffffff",
  },
  orange: {
    bg: "#f97316", // orange-500
    text: "#ffffff",
  },
  green: {
    bg: "#15803d", // green-700
    text: "#ffffff",
  },
  gray: {
    bg: "#737373", // neutral-500 (matching web)
    text: "#ffffff",
  },
  cyan: {
    bg: "#06b6d4", // cyan-500
    text: "#ffffff",
  },
  red: {
    bg: "#b91c1c", // red-700
    text: "#ffffff",
  },

  // ===== ADDITIONAL SEMANTIC VARIANTS =====
  inProduction: {
    bg: "#2563eb", // blue-600
    text: "#ffffff",
  },
  partial: {
    bg: "#f59e0b", // amber-500
    text: "#ffffff",
  },
  cutting: {
    bg: "#8b5cf6", // violet-500
    text: "#ffffff",
  },
  finished: {
    bg: "#15803d", // green-700
    text: "#ffffff",
  },
  charged: {
    bg: "#0891b2", // cyan-600
    text: "#ffffff",
  },
  dismissed: {
    bg: "#b91c1c", // red-700
    text: "#ffffff",
  },
  effected: {
    bg: "#15803d", // green-700
    text: "#ffffff",
  },
  reproved: {
    bg: "#b91c1c", // red-700
    text: "#ffffff",
  },

  // ===== DEPRECATED - Keep for backward compatibility =====
  success: {
    bg: "#15803d", // Standardized to green-700
    text: "#ffffff",
  },
  destructive: {
    bg: "#b91c1c", // Standardized to red-700
    text: "#ffffff",
  },
  primary: {
    bg: "#1d4ed8", // Standardized to blue-700
    text: "#ffffff",
  },
  error: {
    bg: "#b91c1c", // Standardized to red-700
    text: "#ffffff",
  },
  info: {
    bg: "#1d4ed8", // Standardized to blue-700
    text: "#ffffff",
  },
  warning: {
    bg: "#ea580c", // Standardized to orange-600
    text: "#ffffff",
  },
};

/**
 * Entity-specific badge configurations
 * Maps specific entity status enums to badge variants
 */
export const ENTITY_BADGE_CONFIG = {
  // Order Status
  ORDER: {
    [ORDER_STATUS.CREATED]: "gray" as BadgeVariant,                // Gray - initial state
    [ORDER_STATUS.PARTIALLY_FULFILLED]: "cyan" as BadgeVariant,    // Cyan - partially done
    [ORDER_STATUS.FULFILLED]: "blue" as BadgeVariant,              // Blue - done/fulfilled
    [ORDER_STATUS.OVERDUE]: "purple" as BadgeVariant,              // Purple - overdue
    [ORDER_STATUS.PARTIALLY_RECEIVED]: "teal" as BadgeVariant,     // Teal - partially received
    [ORDER_STATUS.RECEIVED]: "received" as BadgeVariant,           // Green - received
    [ORDER_STATUS.CANCELLED]: "cancelled" as BadgeVariant,         // Red - cancelled
  },

  // Task Status
  TASK: {
    [TASK_STATUS.PENDING]: "gray" as BadgeVariant,           // Gray - not started yet
    [TASK_STATUS.IN_PRODUCTION]: "blue" as BadgeVariant,     // Blue - in progress
    [TASK_STATUS.ON_HOLD]: "orange" as BadgeVariant,         // Orange - paused
    [TASK_STATUS.COMPLETED]: "green" as BadgeVariant,        // Green - finished
    [TASK_STATUS.CANCELLED]: "red" as BadgeVariant,          // Red - cancelled
    [TASK_STATUS.INVOICED]: "purple" as BadgeVariant,        // Purple - invoiced (financial)
    [TASK_STATUS.SETTLED]: "teal" as BadgeVariant,           // Teal - settled/finalized
  },

  // Maintenance Status
  MAINTENANCE: {
    [MAINTENANCE_STATUS.PENDING]: "pending" as BadgeVariant,
    [MAINTENANCE_STATUS.IN_PROGRESS]: "inProgress" as BadgeVariant,
    [MAINTENANCE_STATUS.COMPLETED]: "completed" as BadgeVariant,
    [MAINTENANCE_STATUS.CANCELLED]: "cancelled" as BadgeVariant,
    [MAINTENANCE_STATUS.OVERDUE]: "purple" as BadgeVariant,
  },

  // User Status
  USER: {
    [USER_STATUS.EXPERIENCE_PERIOD_1]: "pending" as BadgeVariant,  // Amber - first trial period
    [USER_STATUS.EXPERIENCE_PERIOD_2]: "created" as BadgeVariant,  // Blue - second trial period
    [USER_STATUS.EFFECTED]: "green" as BadgeVariant,               // Entity-specific: use green
    [USER_STATUS.DISMISSED]: "red" as BadgeVariant,                // Entity-specific: use red
  },

  // External Withdrawal Status
  EXTERNAL_WITHDRAWAL: {
    [EXTERNAL_WITHDRAWAL_STATUS.PENDING]: "pending" as BadgeVariant,
    [EXTERNAL_WITHDRAWAL_STATUS.PARTIALLY_RETURNED]: "orange" as BadgeVariant,  // Entity-specific: use orange
    [EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED]: "green" as BadgeVariant,       // Entity-specific: use green
    [EXTERNAL_WITHDRAWAL_STATUS.CHARGED]: "blue" as BadgeVariant,               // Entity-specific: use blue
    [EXTERNAL_WITHDRAWAL_STATUS.CANCELLED]: "cancelled" as BadgeVariant,
  },

  // External Withdrawal Type
  EXTERNAL_WITHDRAWAL_TYPE: {
    [EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE]: "default" as BadgeVariant, // Neutral - returnable
    [EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE]: "red" as BadgeVariant,     // Entity-specific: use red
  },

  // Vacation Status
  VACATION: {
    [VACATION_STATUS.PENDING]: "pending" as BadgeVariant,
    [VACATION_STATUS.APPROVED]: "approved" as BadgeVariant,
    [VACATION_STATUS.REJECTED]: "rejected" as BadgeVariant,
    [VACATION_STATUS.CANCELLED]: "cancelled" as BadgeVariant,
    [VACATION_STATUS.IN_PROGRESS]: "inProgress" as BadgeVariant,
    [VACATION_STATUS.COMPLETED]: "completed" as BadgeVariant,
  },


  // Service Order Status
  SERVICE_ORDER: {
    [SERVICE_ORDER_STATUS.PENDING]: "gray" as BadgeVariant,      // Gray - not started
    [SERVICE_ORDER_STATUS.IN_PROGRESS]: "blue" as BadgeVariant,  // Blue - in progress
    [SERVICE_ORDER_STATUS.COMPLETED]: "green" as BadgeVariant,   // Green - completed
    [SERVICE_ORDER_STATUS.CANCELLED]: "red" as BadgeVariant,     // Red - cancelled
  },

  // Airbrushing Status
  AIRBRUSHING: {
    [AIRBRUSHING_STATUS.PENDING]: "gray" as BadgeVariant,          // Gray - not started (consistent with other entities)
    [AIRBRUSHING_STATUS.IN_PRODUCTION]: "blue" as BadgeVariant,    // Blue - in progress
    [AIRBRUSHING_STATUS.COMPLETED]: "completed" as BadgeVariant,   // Green - completed
    [AIRBRUSHING_STATUS.CANCELLED]: "cancelled" as BadgeVariant,   // Red - cancelled
  },

  // Cut Status
  CUT: {
    [CUT_STATUS.PENDING]: "gray" as BadgeVariant,
    [CUT_STATUS.CUTTING]: "blue" as BadgeVariant,
    [CUT_STATUS.COMPLETED]: "green" as BadgeVariant,
  },

  // Borrow Status
  BORROW: {
    [BORROW_STATUS.ACTIVE]: "blue" as BadgeVariant,    // Blue for active borrows
    [BORROW_STATUS.RETURNED]: "green" as BadgeVariant, // Green for returned
    [BORROW_STATUS.LOST]: "red" as BadgeVariant,       // Red for lost
  },


  // PPE Request Status
  PPE_REQUEST: {
    [PPE_REQUEST_STATUS.PENDING]: "pending" as BadgeVariant,
    [PPE_REQUEST_STATUS.APPROVED]: "approved" as BadgeVariant,
    [PPE_REQUEST_STATUS.REJECTED]: "rejected" as BadgeVariant,
    [PPE_REQUEST_STATUS.DELIVERED]: "delivered" as BadgeVariant,
    [PPE_REQUEST_STATUS.CANCELLED]: "cancelled" as BadgeVariant,
  },

  // PPE Delivery Status
  PPE_DELIVERY: {
    [PPE_DELIVERY_STATUS.PENDING]: "pending" as BadgeVariant,
    [PPE_DELIVERY_STATUS.APPROVED]: "approved" as BadgeVariant,
    [PPE_DELIVERY_STATUS.DELIVERED]: "delivered" as BadgeVariant,
    [PPE_DELIVERY_STATUS.REPROVED]: "red" as BadgeVariant,
    [PPE_DELIVERY_STATUS.CANCELLED]: "cancelled" as BadgeVariant,
  },

  // Maintenance Schedule Status
  MAINTENANCE_SCHEDULE: {
    [MAINTENANCE_SCHEDULE_STATUS.PENDING]: "pending" as BadgeVariant,
    [MAINTENANCE_SCHEDULE_STATUS.FINISHED]: "green" as BadgeVariant,
    [MAINTENANCE_SCHEDULE_STATUS.CANCELLED]: "cancelled" as BadgeVariant,
  },

  // Activity Operation (Entrada/Saída)
  ACTIVITY: {
    [ACTIVITY_OPERATION.INBOUND]: "received" as BadgeVariant, // Green for entry
    [ACTIVITY_OPERATION.OUTBOUND]: "cancelled" as BadgeVariant, // Red for exit
  },

  // Priority Type
  PRIORITY: {
    [PRIORITY_TYPE.LOW]: "muted" as BadgeVariant,
    [PRIORITY_TYPE.MEDIUM]: "pending" as BadgeVariant,
    [PRIORITY_TYPE.HIGH]: "warning" as BadgeVariant,
    [PRIORITY_TYPE.CRITICAL]: "destructive" as BadgeVariant,
  },

  // Urgency Level
  URGENCY: {
    [URGENCY_LEVEL.LOW]: "muted" as BadgeVariant,
    [URGENCY_LEVEL.MEDIUM]: "pending" as BadgeVariant,
    [URGENCY_LEVEL.HIGH]: "warning" as BadgeVariant,
    [URGENCY_LEVEL.CRITICAL]: "destructive" as BadgeVariant,
  },

  // Risk Level
  RISK: {
    [RISK_LEVEL.LOW]: "success" as BadgeVariant,
    [RISK_LEVEL.MEDIUM]: "pending" as BadgeVariant,
    [RISK_LEVEL.HIGH]: "warning" as BadgeVariant,
    [RISK_LEVEL.CRITICAL]: "destructive" as BadgeVariant,
  },

  // Stock Level
  STOCK: {
    [STOCK_LEVEL.NEGATIVE_STOCK]: "destructive" as BadgeVariant,
    [STOCK_LEVEL.OUT_OF_STOCK]: "error" as BadgeVariant,
    [STOCK_LEVEL.CRITICAL]: "warning" as BadgeVariant,
    [STOCK_LEVEL.LOW]: "pending" as BadgeVariant,
    [STOCK_LEVEL.OPTIMAL]: "success" as BadgeVariant,
    [STOCK_LEVEL.OVERSTOCKED]: "info" as BadgeVariant,
  },

  // Health Status
  HEALTH: {
    [HEALTH_STATUS.EXCELLENT]: "success" as BadgeVariant,
    [HEALTH_STATUS.GOOD]: "active" as BadgeVariant,
    [HEALTH_STATUS.FAIR]: "pending" as BadgeVariant,
    [HEALTH_STATUS.POOR]: "warning" as BadgeVariant,
    [HEALTH_STATUS.CRITICAL]: "destructive" as BadgeVariant,
  },

  // Performance Level
  PERFORMANCE: {
    [PERFORMANCE_LEVEL.EXCELLENT]: "success" as BadgeVariant,
    [PERFORMANCE_LEVEL.GOOD]: "active" as BadgeVariant,
    [PERFORMANCE_LEVEL.FAIR]: "pending" as BadgeVariant,
    [PERFORMANCE_LEVEL.POOR]: "warning" as BadgeVariant,
  },

  // Notification Importance
  NOTIFICATION: {
    [NOTIFICATION_IMPORTANCE.LOW]: "muted" as BadgeVariant,
    [NOTIFICATION_IMPORTANCE.NORMAL]: "default" as BadgeVariant,
    [NOTIFICATION_IMPORTANCE.HIGH]: "warning" as BadgeVariant,
    [NOTIFICATION_IMPORTANCE.URGENT]: "destructive" as BadgeVariant,
  },

  // Warning Severity
  WARNING: {
    [WARNING_SEVERITY.VERBAL]: "info" as BadgeVariant,
    [WARNING_SEVERITY.WRITTEN]: "pending" as BadgeVariant,
    [WARNING_SEVERITY.SUSPENSION]: "warning" as BadgeVariant,
    [WARNING_SEVERITY.FINAL_WARNING]: "destructive" as BadgeVariant,
  },

  // SMS Verification Status
  SMS_VERIFICATION: {
    [SMS_VERIFICATION_STATUS.PENDING]: "pending" as BadgeVariant,
    [SMS_VERIFICATION_STATUS.SENT]: "sent" as BadgeVariant,
    [SMS_VERIFICATION_STATUS.VERIFIED]: "verified" as BadgeVariant,
    [SMS_VERIFICATION_STATUS.EXPIRED]: "expired" as BadgeVariant,
    [SMS_VERIFICATION_STATUS.FAILED]: "failed" as BadgeVariant,
    [SMS_VERIFICATION_STATUS.CANCELLED]: "cancelled" as BadgeVariant,
    [SMS_VERIFICATION_STATUS.RATE_LIMITED]: "onHold" as BadgeVariant,
    [SMS_VERIFICATION_STATUS.BLOCKED]: "blocked" as BadgeVariant,
  },

  // Email Status
  EMAIL: {
    [EMAIL_STATUS.PENDING]: "pending" as BadgeVariant,
    [EMAIL_STATUS.SENT]: "sent" as BadgeVariant,
    [EMAIL_STATUS.DELIVERED]: "delivered" as BadgeVariant,
    [EMAIL_STATUS.FAILED]: "failed" as BadgeVariant,
    [EMAIL_STATUS.BOUNCED]: "bounced" as BadgeVariant,
    [EMAIL_STATUS.CANCELLED]: "cancelled" as BadgeVariant,
  },

  // Verification Status
  VERIFICATION: {
    [VERIFICATION_STATUS.PENDING]: "pending" as BadgeVariant,
    [VERIFICATION_STATUS.SENT]: "sent" as BadgeVariant,
    [VERIFICATION_STATUS.VERIFIED]: "verified" as BadgeVariant,
    [VERIFICATION_STATUS.EXPIRED]: "expired" as BadgeVariant,
    [VERIFICATION_STATUS.FAILED]: "failed" as BadgeVariant,
    [VERIFICATION_STATUS.CANCELLED]: "cancelled" as BadgeVariant,
  },

  // Batch Operation Status
  BATCH_OPERATION: {
    [BATCH_OPERATION_STATUS.PENDING]: "pending" as BadgeVariant,
    [BATCH_OPERATION_STATUS.PROCESSING]: "processing" as BadgeVariant,
    [BATCH_OPERATION_STATUS.COMPLETED]: "completed" as BadgeVariant,
    [BATCH_OPERATION_STATUS.FAILED]: "failed" as BadgeVariant,
    [BATCH_OPERATION_STATUS.PARTIAL]: "partial" as BadgeVariant,
  },

  // Workload Level
  WORKLOAD: {
    [WORKLOAD_LEVEL.LOW]: "success" as BadgeVariant,
    [WORKLOAD_LEVEL.NORMAL]: "default" as BadgeVariant,
    [WORKLOAD_LEVEL.HIGH]: "warning" as BadgeVariant,
    [WORKLOAD_LEVEL.CRITICAL]: "destructive" as BadgeVariant,
  },

  // Effort Level
  EFFORT: {
    [EFFORT_LEVEL.LOW]: "success" as BadgeVariant,
    [EFFORT_LEVEL.MEDIUM]: "pending" as BadgeVariant,
    [EFFORT_LEVEL.HIGH]: "warning" as BadgeVariant,
  },

  // Confidence Level
  CONFIDENCE: {
    [CONFIDENCE_LEVEL.LOW]: "warning" as BadgeVariant,
    [CONFIDENCE_LEVEL.MEDIUM]: "pending" as BadgeVariant,
    [CONFIDENCE_LEVEL.HIGH]: "success" as BadgeVariant,
  },

  // Activity Level
  ACTIVITY_LEVEL: {
    [ACTIVITY_LEVEL.VERY_ACTIVE]: "active" as BadgeVariant,
    [ACTIVITY_LEVEL.ACTIVE]: "active" as BadgeVariant,
    [ACTIVITY_LEVEL.OCCASIONAL]: "pending" as BadgeVariant,
    [ACTIVITY_LEVEL.DORMANT]: "inactive" as BadgeVariant,
    [ACTIVITY_LEVEL.LOST]: "lost" as BadgeVariant,
  },

  // Trend Direction
  TREND: {
    [TREND_DIRECTION.UP]: "success" as BadgeVariant,
    [TREND_DIRECTION.DOWN]: "error" as BadgeVariant,
    [TREND_DIRECTION.STABLE]: "default" as BadgeVariant,
  },

  // Trend Type
  TREND_TYPE: {
    [TREND_TYPE.POSITIVE]: "success" as BadgeVariant,
    [TREND_TYPE.NEGATIVE]: "error" as BadgeVariant,
    [TREND_TYPE.NEUTRAL]: "default" as BadgeVariant,
    [TREND_TYPE.VOLATILE]: "warning" as BadgeVariant,
    [TREND_TYPE.SEASONAL]: "info" as BadgeVariant,
  },

  // Validation Severity
  VALIDATION: {
    [VALIDATION_SEVERITY.ERROR]: "error" as BadgeVariant,
    [VALIDATION_SEVERITY.WARNING]: "warning" as BadgeVariant,
    [VALIDATION_SEVERITY.INFO]: "info" as BadgeVariant,
  },

  // Verification Error Severity
  VERIFICATION_ERROR: {
    [VERIFICATION_ERROR_SEVERITY.LOW]: "info" as BadgeVariant,
    [VERIFICATION_ERROR_SEVERITY.MEDIUM]: "pending" as BadgeVariant,
    [VERIFICATION_ERROR_SEVERITY.HIGH]: "warning" as BadgeVariant,
    [VERIFICATION_ERROR_SEVERITY.CRITICAL]: "destructive" as BadgeVariant,
  },

  // Sector Privileges
  SECTOR_PRIVILEGES: {
    [SECTOR_PRIVILEGES.ADMIN]: "red" as BadgeVariant,              // Red - admin privileges
    [SECTOR_PRIVILEGES.PRODUCTION]: "blue" as BadgeVariant,        // Blue - production role
    [SECTOR_PRIVILEGES.HUMAN_RESOURCES]: "purple" as BadgeVariant, // Purple - HR specific
    [SECTOR_PRIVILEGES.FINANCIAL]: "purple" as BadgeVariant,       // Purple - financial role (same as HR)
    [SECTOR_PRIVILEGES.DESIGNER]: "purple" as BadgeVariant,        // Purple - designer role (same as HR)
    [SECTOR_PRIVILEGES.LOGISTIC]: "purple" as BadgeVariant,        // Purple - logistics role (same as HR)
    [SECTOR_PRIVILEGES.MAINTENANCE]: "orange" as BadgeVariant,     // Orange - maintenance role (keep current)
    [SECTOR_PRIVILEGES.BASIC]: "gray" as BadgeVariant,             // Gray - basic access
    [SECTOR_PRIVILEGES.EXTERNAL]: "gray" as BadgeVariant,          // Gray - external access
    [SECTOR_PRIVILEGES.WAREHOUSE]: "green" as BadgeVariant,        // Green - warehouse role
  },

  // Commission Status
  COMMISSION_STATUS: {
    [COMMISSION_STATUS.FULL_COMMISSION]: "green" as BadgeVariant,     // Green - full commission earned
    [COMMISSION_STATUS.PARTIAL_COMMISSION]: "blue" as BadgeVariant,   // Blue - partial commission
    [COMMISSION_STATUS.NO_COMMISSION]: "orange" as BadgeVariant,      // Orange - no commission (warning)
    [COMMISSION_STATUS.SUSPENDED_COMMISSION]: "red" as BadgeVariant,  // Red - commission suspended (critical)
  },
};

/**
 * Generic status mapping for common patterns
 * These are fallbacks when entity-specific mapping is not found
 */
export const GENERIC_STATUS_CONFIG: Record<string, BadgeVariant> = {
  // Common status values
  PENDING: "pending",
  IN_PROGRESS: "inProgress",
  IN_PRODUCTION: "inProduction",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  ACTIVE: "active",
  INACTIVE: "inactive",
  APPROVED: "approved",
  REJECTED: "rejected",
  DELIVERED: "delivered",
  FAILED: "failed",
  EXPIRED: "expired",
  VERIFIED: "verified",
  RETURNED: "returned",
  LOST: "lost",
  OVERDUE: "purple",
  CREATED: "created",
  FULFILLED: "amber",
  RECEIVED: "received",
  SENT: "sent",
  ON_HOLD: "onHold",
  SUSPENDED: "suspended",
  BLOCKED: "blocked",
  PROCESSING: "processing",
  PARTIAL: "partial",
  CUTTING: "cutting",
  FINISHED: "finished",
  CHARGED: "charged",
  RATE_LIMITED: "onHold",
  BOUNCED: "bounced",
  DISMISSED: "dismissed",
  EFFECTED: "effected",
  REPROVED: "reproved",

  // Operations
  INBOUND: "active", // Green for entry
  OUTBOUND: "cancelled", // Red for exit
  "1": "active", // Numeric inbound
  "-1": "cancelled", // Numeric outbound

  // Performance/Health levels
  EXCELLENT: "green",
  GOOD: "active",
  FAIR: "pending",
  POOR: "onHold",
  CRITICAL: "failed",

  // Priority/Urgency levels
  LOW: "muted",
  MEDIUM: "pending",
  HIGH: "onHold",
  NORMAL: "default",
  URGENT: "failed",

  // Trends
  UP: "active",
  DOWN: "failed",
  STABLE: "default",
  POSITIVE: "active",
  NEGATIVE: "failed",
  NEUTRAL: "default",
  VOLATILE: "onHold",
  SEASONAL: "created",

  // Activity levels
  VERY_ACTIVE: "active",
  OCCASIONAL: "pending",
  DORMANT: "inactive",

  // Validation
  ERROR: "failed",
  WARNING: "onHold",
  INFO: "created",

  // Special
  VERBAL: "created",
  WRITTEN: "pending",
  SUSPENSION: "onHold",
  FINAL_WARNING: "failed",
  PENDING_JUSTIFICATION: "pending",
  JUSTIFICATION_SUBMITTED: "sent",
  PARTIALLY_FULFILLED: "yellow",
  PARTIALLY_RECEIVED: "teal",
  PARTIALLY_RETURNED: "orange",
  FULLY_RETURNED: "green",

  // Commission Status fallback
  FULL_COMMISSION: "green",
  PARTIAL_COMMISSION: "blue",
  NO_COMMISSION: "orange",
  SUSPENDED_COMMISSION: "red",
};

/**
 * ABC Category Badge Colors for React Native
 * Special color scheme for inventory analysis badges
 */
export const ABC_BADGE_COLORS: Record<
  ABC_CATEGORY,
  {
    bg: string;
    text: string;
  }
> = {
  [ABC_CATEGORY.A]: {
    bg: "#fee2e2", // red-100
    text: "#b91c1c", // red-700
  },
  [ABC_CATEGORY.B]: {
    bg: "#fef3c7", // yellow-100
    text: "#a16207", // yellow-700
  },
  [ABC_CATEGORY.C]: {
    bg: "#dcfce7", // green-100
    text: "#15803d", // green-700
  },
};

/**
 * XYZ Category Badge Colors for React Native
 * Special color scheme for inventory analysis badges
 */
export const XYZ_BADGE_COLORS: Record<
  XYZ_CATEGORY,
  {
    bg: string;
    text: string;
  }
> = {
  [XYZ_CATEGORY.X]: {
    bg: "#dbeafe", // blue-100
    text: "#1e40af", // blue-700
  },
  [XYZ_CATEGORY.Y]: {
    bg: "#f3e8ff", // purple-100
    text: "#6b21a8", // purple-700
  },
  [XYZ_CATEGORY.Z]: {
    bg: "#fed7aa", // orange-100
    text: "#9a3412", // orange-700
  },
};

/**
 * Boolean Badge Configurations
 * For fields like type, isActive, etc.
 */
export const BOOLEAN_BADGE_CONFIG = {
  willReturn: {
    true: "green" as BadgeVariant,     // Green - will return items (positive)
    false: "cancelled" as BadgeVariant, // Red - won't return items (negative)
  },
  isActive: {
    true: "active" as BadgeVariant,
    false: "inactive" as BadgeVariant,
  },
  isUrgent: {
    true: "failed" as BadgeVariant,
    false: "default" as BadgeVariant,
  },
  isCompleted: {
    true: "completed" as BadgeVariant,
    false: "pending" as BadgeVariant,
  },
  isApproved: {
    true: "approved" as BadgeVariant,
    false: "pending" as BadgeVariant,
  },
  isVerified: {
    true: "verified" as BadgeVariant,
    false: "pending" as BadgeVariant,
  },
  isDelivered: {
    true: "delivered" as BadgeVariant,
    false: "pending" as BadgeVariant,
  },
  isOverdue: {
    true: "expired" as BadgeVariant,
    false: "default" as BadgeVariant,
  },
};

/**
 * Helper function to get badge variant from any enum value
 * First checks entity-specific mappings, then falls back to generic mappings
 */
export function getBadgeVariant(value: string, entity?: keyof typeof ENTITY_BADGE_CONFIG | string): BadgeVariant {
  // If entity is specified, check entity-specific config first (case-insensitive)
  if (entity) {
    const entityKey = entity.toUpperCase() as keyof typeof ENTITY_BADGE_CONFIG;
    if (ENTITY_BADGE_CONFIG[entityKey]) {
      const entityConfig = ENTITY_BADGE_CONFIG[entityKey] as Record<string, BadgeVariant>;
      if (entityConfig[value]) {
        return entityConfig[value];
      }
    }
  }

  // Fall back to generic status config
  return GENERIC_STATUS_CONFIG[value] || "default";
}

/**
 * Helper function to get badge colors from variant
 */
export function getBadgeColors(variant: BadgeVariant) {
  return BADGE_COLORS[variant];
}

/**
 * Helper function to get badge variant for boolean fields
 */
export function getBooleanBadgeVariant(field: keyof typeof BOOLEAN_BADGE_CONFIG, value: boolean): BadgeVariant {
  return BOOLEAN_BADGE_CONFIG[field]?.[String(value) as "true" | "false"] || "default";
}

/**
 * Helper function to get ABC category badge colors
 */
export function getABCBadgeColors(category: ABC_CATEGORY) {
  return ABC_BADGE_COLORS[category];
}

/**
 * Helper function to get XYZ category badge colors
 */
export function getXYZBadgeColors(category: XYZ_CATEGORY) {
  return XYZ_BADGE_COLORS[category];
}

/**
 * Export all badge configurations for use across the application
 */
export default {
  BADGE_COLORS,
  ENTITY_BADGE_CONFIG,
  GENERIC_STATUS_CONFIG,
  ABC_BADGE_COLORS,
  XYZ_BADGE_COLORS,
  BOOLEAN_BADGE_CONFIG,
  getBadgeVariant,
  getBadgeColors,
  getBooleanBadgeVariant,
  getABCBadgeColors,
  getXYZBadgeColors,
};
