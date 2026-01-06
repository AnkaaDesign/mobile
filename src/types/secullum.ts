/**
 * Secullum Integration API Types
 *
 * Type definitions for Secullum attendance and employee synchronization system.
 */

// Base Response Types
export interface SecullumBaseResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Employee Types
export interface SecullumEmployee {
  id: string;
  pis: string;
  name: string;
  cpf?: string;
  admissionDate?: Date;
  dismissalDate?: Date;
  isActive: boolean;
  // Add more fields as needed
}

export interface EmployeeSyncResult {
  totalProcessed: number;
  created: number;
  updated: number;
  failed: number;
  errors?: Array<{
    pis: string;
    error: string;
  }>;
}

// Attendance Types
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  pis: string;
  date: string; // ISO date string
  clockIn?: string; // HH:mm format
  clockOut?: string; // HH:mm format
  totalHours?: number;
  status: "PRESENT" | "ABSENT" | "LATE" | "PARTIAL";
}

export interface MonthlySummary {
  month: number;
  year: number;
  totalDays: number;
  workDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalHoursWorked: number;
  employees: Array<{
    employeeId: string;
    employeeName: string;
    pis: string;
    daysPresent: number;
    daysAbsent: number;
    totalHours: number;
  }>;
}

// Clock Records
export interface ClockRecord {
  id: string;
  employeeId: string;
  pis: string;
  timestamp: string; // ISO datetime
  type: "IN" | "OUT" | "BREAK_START" | "BREAK_END";
  location?: string;
  deviceId?: string;
}

export interface ClockRecordCreate {
  pis: string;
  timestamp: Date | string;
  type: "IN" | "OUT";
}

// Daily Summary
export interface DailySummary {
  date: string;
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  onBreak: number;
  records: AttendanceRecord[];
}

// Response Types for Specific Endpoints
export type EmployeeSyncResponse = SecullumBaseResponse<EmployeeSyncResult>;
export type MonthlySummaryResponse = SecullumBaseResponse<MonthlySummary>;
export type DailySummaryResponse = SecullumBaseResponse<DailySummary>;
export type ClockRecordsResponse = SecullumBaseResponse<ClockRecord[]>;
export type ClockRecordCreateResponse = SecullumBaseResponse<ClockRecord>;
export type AttendanceRecordsResponse = SecullumBaseResponse<{
  records: AttendanceRecord[];
  total: number;
  page: number;
  pageSize: number;
}>;

// Calculation/Time Clock Types
export interface CalculationRow {
  id: string;
  date: string;
  entrada1?: string;
  saida1?: string;
  entrada2?: string;
  saida2?: string;
  entrada3?: string;
  saida3?: string;
  normais?: string;
  faltas?: string;
  ex50?: string;
  ex100?: string;
  ex150?: string;
  dsr?: string;
  dsrDeb?: string;
  not?: string;
  exNot?: string;
  ajuste?: string;
  abono2?: string;
  abono3?: string;
  abono4?: string;
  atras?: string;
  adian?: string;
  folga?: string;
  carga?: string;
  justPa?: string;
  tPlusMinus?: string;
  exInt?: string;
  notTot?: string;
  refeicao?: string;
  [key: string]: string | undefined;
}
