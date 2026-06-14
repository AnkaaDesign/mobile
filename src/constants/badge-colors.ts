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
  ORDER_PAYMENT_STATUS,
  TASK_STATUS,
  MAINTENANCE_STATUS,
  CONTRACT_TYPE,
  CONTRACT_STATUS,
  EMPLOYEE_TYPE,
  EXTERNAL_OPERATION_STATUS,
  EXTERNAL_OPERATION_TYPE,
  SERVICE_ORDER_STATUS,
  AIRBRUSHING_STATUS,
  AIRBRUSHING_PAYMENT_STATUS,
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
  ACCOUNTING_TYPE,
  VALIDATION_SEVERITY,
  VERIFICATION_ERROR_SEVERITY,
  SECTOR_PRIVILEGES,
  BONIFICATION_STATUS,
  TASK_QUOTE_STATUS,
  ADMISSION_STATUS,
  TERMINATION_STATUS,
  MEDICAL_EXAM_STATUS,
  MEDICAL_EXAM_RESULT,
  LEAVE_STATUS,
  BENEFIT_ENROLLMENT_STATUS,} from "./enums";

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
    bg: "#eab308", // yellow-500 (matching web: bg-yellow-500)
    text: "#ffffff", // White text (matching web: text-white)
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

  // Order Payment Status (Contas a Pagar)
  ORDER_PAYMENT: {
    [ORDER_PAYMENT_STATUS.NOT_REQUESTED]: "gray" as BadgeVariant,      // Gray - not requested yet
    [ORDER_PAYMENT_STATUS.REQUESTED]: "pending" as BadgeVariant,       // Amber - payment requested
    [ORDER_PAYMENT_STATUS.AWAITING_PAYMENT]: "orange" as BadgeVariant, // Orange - awaiting payment
    [ORDER_PAYMENT_STATUS.PAID]: "green" as BadgeVariant,              // Green - paid
  },

  // Task Status
  TASK: {
    [TASK_STATUS.PREPARATION]: "orange" as BadgeVariant,            // Orange - in preparation
    [TASK_STATUS.WAITING_PRODUCTION]: "gray" as BadgeVariant,       // Gray - waiting for production
    [TASK_STATUS.IN_PRODUCTION]: "blue" as BadgeVariant,            // Blue - in progress
    [TASK_STATUS.COMPLETED]: "green" as BadgeVariant,               // Green - finished
    [TASK_STATUS.CANCELLED]: "red" as BadgeVariant,                 // Red - cancelled
  },

  // Task Quote Status (mirrors web/quote-status-badge.tsx)
  TASK_QUOTE: {
    [TASK_QUOTE_STATUS.PENDING]: "secondary" as BadgeVariant,              // Neutral - awaiting action
    [TASK_QUOTE_STATUS.BUDGET_APPROVED]: "approved" as BadgeVariant,       // Green - budget approved
    [TASK_QUOTE_STATUS.COMMERCIAL_APPROVED]: "processing" as BadgeVariant, // Blue - commercial approved
    [TASK_QUOTE_STATUS.BILLING_APPROVED]: "approved" as BadgeVariant,      // Green - billing approved
    [TASK_QUOTE_STATUS.UPCOMING]: "pending" as BadgeVariant,               // Amber - payment upcoming
    [TASK_QUOTE_STATUS.DUE]: "destructive" as BadgeVariant,                // Red - payment overdue
    [TASK_QUOTE_STATUS.PARTIAL]: "inProgress" as BadgeVariant,             // Blue - partial payment
    [TASK_QUOTE_STATUS.SETTLED]: "completed" as BadgeVariant,              // Green - fully paid
  },

  // Maintenance Status
  MAINTENANCE: {
    [MAINTENANCE_STATUS.PENDING]: "pending" as BadgeVariant,
    [MAINTENANCE_STATUS.IN_PROGRESS]: "inProgress" as BadgeVariant,
    [MAINTENANCE_STATUS.COMPLETED]: "completed" as BadgeVariant,
    [MAINTENANCE_STATUS.CANCELLED]: "cancelled" as BadgeVariant,
    [MAINTENANCE_STATUS.OVERDUE]: "purple" as BadgeVariant,
  },

  // User Contract Type (the legal MODALITY of the current vínculo)
  USER: {
    [CONTRACT_TYPE.INDETERMINATE]: "green" as BadgeVariant,          // Entity-specific: use green (efetivo)
    [CONTRACT_TYPE.FIXED_TERM]: "created" as BadgeVariant,           // Blue - fixed term
    [CONTRACT_TYPE.INTERMITTENT]: "purple" as BadgeVariant,          // Purple - intermittent contract
    [CONTRACT_TYPE.APPRENTICE]: "blue" as BadgeVariant,              // Blue - apprentice contract
    [CONTRACT_TYPE.TEMPORARY]: "orange" as BadgeVariant,             // Orange - temporary
  },

  // Employment contract lifecycle status
  CONTRACT_STATUS: {
    [CONTRACT_STATUS.EXPERIENCE]: "pending" as BadgeVariant,         // Amber - em experiência
    [CONTRACT_STATUS.ACTIVE]: "green" as BadgeVariant,
    [CONTRACT_STATUS.NOTICE_PERIOD]: "orange" as BadgeVariant,       // Aviso prévio
    [CONTRACT_STATUS.ON_LEAVE]: "purple" as BadgeVariant,            // Afastado
    [CONTRACT_STATUS.TERMINATED]: "red" as BadgeVariant,
  },

  // Worker category (on-folha vs off-folha)
  EMPLOYEE_TYPE: {
    [EMPLOYEE_TYPE.CLT]: "green" as BadgeVariant,
    [EMPLOYEE_TYPE.INTERN]: "blue" as BadgeVariant,
    [EMPLOYEE_TYPE.TERCEIRIZADO]: "purple" as BadgeVariant,
    [EMPLOYEE_TYPE.PJ]: "orange" as BadgeVariant,
    [EMPLOYEE_TYPE.AUTONOMOUS]: "created" as BadgeVariant,
  },

  // External Withdrawal Status
  EXTERNAL_OPERATION: {
    [EXTERNAL_OPERATION_STATUS.PENDING]: "pending" as BadgeVariant,
    [EXTERNAL_OPERATION_STATUS.PARTIALLY_RETURNED]: "orange" as BadgeVariant,  // Entity-specific: use orange
    [EXTERNAL_OPERATION_STATUS.FULLY_RETURNED]: "green" as BadgeVariant,       // Entity-specific: use green
    [EXTERNAL_OPERATION_STATUS.CHARGED]: "blue" as BadgeVariant,               // Entity-specific: use blue
    [EXTERNAL_OPERATION_STATUS.CANCELLED]: "cancelled" as BadgeVariant,
  },

  // External Withdrawal Type
  EXTERNAL_OPERATION_TYPE: {
    [EXTERNAL_OPERATION_TYPE.RETURNABLE]: "default" as BadgeVariant, // Neutral - returnable
    [EXTERNAL_OPERATION_TYPE.CHARGEABLE]: "red" as BadgeVariant,     // Entity-specific: use red
  },

  // Service Order Status
  SERVICE_ORDER: {
    [SERVICE_ORDER_STATUS.PENDING]: "gray" as BadgeVariant,            // Gray - not started
    [SERVICE_ORDER_STATUS.IN_PROGRESS]: "blue" as BadgeVariant,        // Blue - in progress
    [SERVICE_ORDER_STATUS.WAITING_ARTWORK]: "purple" as BadgeVariant,  // Purple - commercial blocked waiting for artwork
    [SERVICE_ORDER_STATUS.WAITING_APPROVE]: "purple" as BadgeVariant,  // Purple - awaiting approval
    [SERVICE_ORDER_STATUS.PAUSED]: "yellow" as BadgeVariant,           // Yellow - paused
    [SERVICE_ORDER_STATUS.COMPLETED]: "green" as BadgeVariant,         // Green - completed
    [SERVICE_ORDER_STATUS.CANCELLED]: "red" as BadgeVariant,           // Red - cancelled
  },

  // Airbrushing Status
  AIRBRUSHING: {
    [AIRBRUSHING_STATUS.PENDING]: "gray" as BadgeVariant,          // Gray - not started (consistent with other entities)
    [AIRBRUSHING_STATUS.IN_PRODUCTION]: "blue" as BadgeVariant,    // Blue - in progress
    [AIRBRUSHING_STATUS.COMPLETED]: "completed" as BadgeVariant,   // Green - completed
    [AIRBRUSHING_STATUS.CANCELLED]: "cancelled" as BadgeVariant,   // Red - cancelled
  },

  // Airbrushing Payment Status
  AIRBRUSHING_PAYMENT_STATUS: {
    [AIRBRUSHING_PAYMENT_STATUS.PENDING]: "gray" as BadgeVariant,          // Gray - awaiting payment
    [AIRBRUSHING_PAYMENT_STATUS.PARTIALLY_PAID]: "yellow" as BadgeVariant, // Yellow - partially paid
    [AIRBRUSHING_PAYMENT_STATUS.PAID]: "green" as BadgeVariant,            // Green - fully paid
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

  // PPE Delivery Status (matching web version)
  PPE_DELIVERY: {
    [PPE_DELIVERY_STATUS.PENDING]: "gray" as BadgeVariant,
    [PPE_DELIVERY_STATUS.APPROVED]: "blue" as BadgeVariant,
    [PPE_DELIVERY_STATUS.DELIVERED]: "delivered" as BadgeVariant,
    [PPE_DELIVERY_STATUS.WAITING_SIGNATURE]: "amber" as BadgeVariant,
    [PPE_DELIVERY_STATUS.COMPLETED]: "green" as BadgeVariant,
    [PPE_DELIVERY_STATUS.SIGNATURE_REJECTED]: "red" as BadgeVariant,
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

  // Message Status (Prisma enum: DRAFT, SCHEDULED, ACTIVE, EXPIRED, ARCHIVED)
  MESSAGE: {
    DRAFT: "secondary" as BadgeVariant,
    SCHEDULED: "pending" as BadgeVariant,
    ACTIVE: "active" as BadgeVariant,
    EXPIRED: "expired" as BadgeVariant,
    ARCHIVED: "muted" as BadgeVariant,
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
    [SECTOR_PRIVILEGES.PRODUCTION_MANAGER]: "purple" as BadgeVariant, // Purple - production manager (same as logistic)
    [SECTOR_PRIVILEGES.AIRBRUSHING]: "orange" as BadgeVariant,        // Orange - airbrushing (third-party painters)
    [SECTOR_PRIVILEGES.ACCOUNTING]: "purple" as BadgeVariant,         // Purple - accounting role (same family as FINANCIAL)
  },

  // Bonification Status
  BONIFICATION_STATUS: {
    [BONIFICATION_STATUS.FULL_BONIFICATION]: "green" as BadgeVariant,     // Green - full bonification earned
    [BONIFICATION_STATUS.PARTIAL_BONIFICATION]: "blue" as BadgeVariant,   // Blue - partial bonification
    [BONIFICATION_STATUS.NO_BONIFICATION]: "orange" as BadgeVariant,      // Orange - no bonification (warning)
    [BONIFICATION_STATUS.SUSPENDED_BONIFICATION]: "red" as BadgeVariant,  // Red - bonification suspended (critical)
  },

  // Admission Status (Departamento Pessoal)
  ADMISSION: {
    [ADMISSION_STATUS.DOCS_PENDING]: "pending" as BadgeVariant,    // Amber - documents pending
    [ADMISSION_STATUS.MEDICAL_EXAM]: "blue" as BadgeVariant,       // Blue - admission exam phase
    [ADMISSION_STATUS.CONTRACT]: "purple" as BadgeVariant,         // Purple - contract phase
    [ADMISSION_STATUS.REGISTRATION]: "cyan" as BadgeVariant,       // Cyan - registration phase
    [ADMISSION_STATUS.COMPLETED]: "completed" as BadgeVariant,     // Green - completed
    [ADMISSION_STATUS.CANCELLED]: "cancelled" as BadgeVariant,     // Red - cancelled
  },

  // Termination Status (Departamento Pessoal)
  TERMINATION: {
    [TERMINATION_STATUS.INITIATED]: "gray" as BadgeVariant,        // Gray - just initiated
    [TERMINATION_STATUS.NOTICE_PERIOD]: "pending" as BadgeVariant, // Amber - notice period running
    [TERMINATION_STATUS.DOCUMENTS]: "blue" as BadgeVariant,        // Blue - documents phase
    [TERMINATION_STATUS.MEDICAL_EXAM]: "purple" as BadgeVariant,   // Purple - dismissal exam phase
    [TERMINATION_STATUS.CALCULATION]: "cyan" as BadgeVariant,      // Cyan - calculation phase
    [TERMINATION_STATUS.PAYMENT]: "orange" as BadgeVariant,        // Orange - awaiting payment
    [TERMINATION_STATUS.HOMOLOGATION]: "blue" as BadgeVariant,     // Blue - homologation phase
    [TERMINATION_STATUS.COMPLETED]: "completed" as BadgeVariant,   // Green - completed
    [TERMINATION_STATUS.CANCELLED]: "cancelled" as BadgeVariant,   // Red - cancelled
  },

  // Medical Exam Status (Medicina do Trabalho)
  MEDICAL_EXAM: {
    [MEDICAL_EXAM_STATUS.SCHEDULED]: "blue" as BadgeVariant,       // Blue - scheduled
    [MEDICAL_EXAM_STATUS.COMPLETED]: "completed" as BadgeVariant,  // Green - completed
    [MEDICAL_EXAM_STATUS.EXPIRED]: "expired" as BadgeVariant,      // Expired styling
    [MEDICAL_EXAM_STATUS.CANCELLED]: "cancelled" as BadgeVariant,  // Red - cancelled
  },

  // Medical Exam Result (Medicina do Trabalho)
  MEDICAL_EXAM_RESULT: {
    [MEDICAL_EXAM_RESULT.PENDING]: "pending" as BadgeVariant,                  // Amber - awaiting result
    [MEDICAL_EXAM_RESULT.FIT]: "green" as BadgeVariant,                        // Green - fit (apto)
    [MEDICAL_EXAM_RESULT.FIT_WITH_RESTRICTIONS]: "orange" as BadgeVariant,     // Orange - apto com restrições
    [MEDICAL_EXAM_RESULT.UNFIT]: "red" as BadgeVariant,                        // Red - unfit (inapto)
  },

  // Leave Status (Medicina do Trabalho)
  LEAVE: {
    [LEAVE_STATUS.SCHEDULED]: "gray" as BadgeVariant,              // Gray - scheduled
    [LEAVE_STATUS.ACTIVE]: "blue" as BadgeVariant,                 // Blue - ongoing leave
    [LEAVE_STATUS.COMPLETED]: "completed" as BadgeVariant,         // Green - completed
    [LEAVE_STATUS.CANCELLED]: "cancelled" as BadgeVariant,         // Red - cancelled
  },

  // Benefit Enrollment Status (Departamento Pessoal)
  BENEFIT_ENROLLMENT: {
    [BENEFIT_ENROLLMENT_STATUS.ACTIVE]: "green" as BadgeVariant,       // Green - active enrollment
    [BENEFIT_ENROLLMENT_STATUS.SUSPENDED]: "suspended" as BadgeVariant, // Suspended styling
    [BENEFIT_ENROLLMENT_STATUS.OPTED_OUT]: "gray" as BadgeVariant,     // Gray - opted out
    [BENEFIT_ENROLLMENT_STATUS.TERMINATED]: "red" as BadgeVariant,     // Red - terminated
  },

  // Backup Status / Type / Priority (lowercase values from API)
  BACKUP: {
    // Status
    completed: "completed" as BadgeVariant,    // Green
    in_progress: "inProgress" as BadgeVariant, // Blue
    pending: "pending" as BadgeVariant,        // Amber
    failed: "failed" as BadgeVariant,          // Red
    // Type
    database: "blue" as BadgeVariant,
    files: "purple" as BadgeVariant,
    system: "teal" as BadgeVariant,
    full: "indigo" as BadgeVariant,
    // Priority
    low: "muted" as BadgeVariant,
    medium: "pending" as BadgeVariant,
    high: "warning" as BadgeVariant,
    critical: "destructive" as BadgeVariant,
    // Enabled/disabled (schedule)
    true: "active" as BadgeVariant,            // Green
    false: "inactive" as BadgeVariant,         // Gray
    // Fallback display labels (when rawValue is undefined)
    Ativo: "active" as BadgeVariant,
    Inativo: "inactive" as BadgeVariant,
    Sim: "active" as BadgeVariant,
    "Não": "inactive" as BadgeVariant,
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
  Enviada: "sent",
  Pendente: "pending",
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
  // Contract statuses (EmploymentContract redesign — replaced legacy DISMISSED/EFFECTED)
  EXPERIENCE: "pending",
  NOTICE_PERIOD: "orange",
  ON_LEAVE: "purple",
  TERMINATED: "red",
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

  // Bonification Status fallback
  FULL_BONIFICATION: "green",
  PARTIAL_BONIFICATION: "blue",
  NO_BONIFICATION: "orange",
  SUSPENDED_BONIFICATION: "red",
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
 * Accounting Type (DRE bucket) Badge Colors for React Native
 * Distinct color per accounting classification for charts/badges.
 */
export const ACCOUNTING_TYPE_COLORS: Record<
  ACCOUNTING_TYPE,
  {
    bg: string;
    text: string;
  }
> = {
  [ACCOUNTING_TYPE.SALARIOS]: {
    bg: "#dbeafe", // blue-100
    text: "#1d4ed8", // blue-700
  },
  [ACCOUNTING_TYPE.DESPESAS_FIXAS]: {
    bg: "#f1f5f9", // slate-100
    text: "#334155", // slate-700
  },
  [ACCOUNTING_TYPE.PRODUTIVO]: {
    bg: "#dcfce7", // green-100
    text: "#15803d", // green-700
  },
  [ACCOUNTING_TYPE.IMPOSTO_TARIFAS]: {
    bg: "#fee2e2", // red-100
    text: "#b91c1c", // red-700
  },
  [ACCOUNTING_TYPE.MATERIA_PRIMA]: {
    bg: "#fef3c7", // amber-100
    text: "#b45309", // amber-700
  },
  [ACCOUNTING_TYPE.INVESTIMENTO]: {
    bg: "#e0e7ff", // indigo-100
    text: "#4338ca", // indigo-700
  },
  [ACCOUNTING_TYPE.MANUTENCAO]: {
    bg: "#ffedd5", // orange-100
    text: "#c2410c", // orange-700
  },
  [ACCOUNTING_TYPE.COZINHA_ALIMENTACAO]: {
    bg: "#fef9c3", // yellow-100
    text: "#a16207", // yellow-700
  },
  [ACCOUNTING_TYPE.EPI]: {
    bg: "#cffafe", // cyan-100
    text: "#0e7490", // cyan-700
  },
  [ACCOUNTING_TYPE.ESCRITORIO]: {
    bg: "#ede9fe", // violet-100
    text: "#6d28d9", // violet-700
  },
  [ACCOUNTING_TYPE.APLICACAO_FINANCEIRA]: {
    bg: "#d1fae5", // emerald-100
    text: "#047857", // emerald-700
  },
  [ACCOUNTING_TYPE.ESTORNO]: {
    bg: "#fce7f3", // pink-100
    text: "#be185d", // pink-700
  },
  [ACCOUNTING_TYPE.LUCRO_DISTRIBUIDO]: {
    bg: "#ccfbf1", // teal-100
    text: "#0f766e", // teal-700
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
 * Helper function to get accounting type badge colors
 */
export function getAccountingTypeColors(accountingType: ACCOUNTING_TYPE) {
  return ACCOUNTING_TYPE_COLORS[accountingType];
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
  ACCOUNTING_TYPE_COLORS,
  BOOLEAN_BADGE_CONFIG,
  getBadgeVariant,
  getBadgeColors,
  getBooleanBadgeVariant,
  getABCBadgeColors,
  getXYZBadgeColors,
  getAccountingTypeColors,
};
