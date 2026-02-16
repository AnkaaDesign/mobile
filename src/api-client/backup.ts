import { apiClient } from "./axiosClient";
import { BACKUP_PATH_PRESETS } from "../config/backup-paths";

export interface BackupMetadata {
  id: string;
  name: string;
  type: "database" | "files" | "system" | "full";
  size: number;
  createdAt: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  description?: string;
  paths?: string[];
  error?: string;
  priority?: "low" | "medium" | "high" | "critical";
  raidAware?: boolean;
  compressionLevel?: number;
  encrypted?: boolean;
  progress?: number; // Progress percentage (0-100)
  duration?: number; // Duration in milliseconds
  autoDelete?: {
    enabled: boolean;
    retention: '1_day' | '3_days' | '1_week' | '2_weeks' | '1_month' | '3_months' | '6_months' | '1_year';
    deleteAfter?: string; // ISO date string when backup should be deleted
  };
  // Soft delete fields
  deletedAt?: string | null;
  deletedById?: string | null;
  // Google Drive integration
  gdriveFileId?: string | null;
  gdriveStatus?: "pending" | "syncing" | "synced" | "failed" | "deleted" | null;
  gdriveSyncedAt?: string | null;
}

export interface CreateBackupRequest {
  name: string;
  type: "database" | "files" | "system" | "full";
  description?: string;
  paths?: string[];
  priority?: "low" | "medium" | "high" | "critical";
  raidAware?: boolean;
  compressionLevel?: number;
  encrypted?: boolean;
  autoDelete?: {
    enabled: boolean;
    retention: '1_day' | '3_days' | '1_week' | '2_weeks' | '1_month' | '3_months' | '6_months' | '1_year';
  };
}

export interface ScheduleBackupRequest extends CreateBackupRequest {
  enabled: boolean;
  cron: string;
}

export interface BackupSystemHealth {
  totalBackups: number;
  completedBackups: number;
  failedBackups: number;
  inProgressBackups: number;
  totalSize: string;
  diskSpace: {
    available: string;
    used: string;
    total: string;
    usagePercent: number;
  };
  raidStatus: {
    healthy: boolean;
    details: string;
  };
  scheduledBackups: number;
  lastBackup: string | null;
  nextScheduledBackup: string | null;
}

export interface BackupVerification {
  backupId: string;
  fileExists: boolean;
  archiveIntegrity: boolean;
  sizeMatch: boolean;
  verificationTime: string;
  details: string;
}

export interface ScheduledBackupJob {
  id: string;
  name: string;
  cron: string;
  next: number;
  jobName?: string; // Full job name for internal use
  key?: string; // Job key for deletion
}

export interface BackupQueryParams {
  type?: "database" | "files" | "system" | "full";
  status?: "pending" | "in_progress" | "completed" | "failed";
  limit?: number;
  orderBy?: {
    createdAt?: "asc" | "desc";
  };
}

export interface SystemHealthSummary {
  raidStatus: { healthy: boolean; details: string; degraded: boolean };
  diskSpace: { available: string; used: string; total: string; usagePercent: number; availableBytes: number };
  backupStats: { total: number; completed: number; failed: number; inProgress: number; totalSize: number };
  recommendations: string[];
}

class BackupApiClient {
  private api = apiClient;

  // Get all backups with optional filtering
  async getBackups(params?: BackupQueryParams): Promise<BackupMetadata[]> {
    const response = await this.api.get<{ success: boolean; data: BackupMetadata[]; message: string }>("/backups", {
      params,
    });
    return response.data.data || [];
  }

  // Get backup by ID
  async getBackupById(id: string): Promise<BackupMetadata> {
    const response = await this.api.get<{ success: boolean; data: BackupMetadata; message: string }>(`/backups/${id}`);
    return response.data.data;
  }

  // Create a new backup
  async createBackup(data: CreateBackupRequest): Promise<{ id: string; message: string }> {
    const response = await this.api.post<{ success: boolean; data: { id: string }; message: string }>("/backups", data);
    return { id: response.data.data.id, message: response.data.message };
  }

  // Restore a backup
  async restoreBackup(id: string, targetPath?: string): Promise<{ message: string }> {
    const response = await this.api.post<{ message: string }>(`/backups/${id}/restore`, { targetPath });
    return response.data;
  }

  // Delete a backup
  async deleteBackup(id: string): Promise<null> {
    const response = await this.api.delete<null>(`/backups/${id}`);
    return response.data;
  }

  // Get scheduled backups
  async getScheduledBackups(): Promise<ScheduledBackupJob[]> {
    const response = await this.api.get<{ success: boolean; data: ScheduledBackupJob[]; message: string }>("/backups/scheduled/list");
    return response.data.data || [];
  }

  // Schedule a new backup
  async scheduleBackup(data: ScheduleBackupRequest): Promise<{ message: string }> {
    const response = await this.api.post<{ message: string }>("/backups/scheduled", data);
    return response.data;
  }

  // Remove a scheduled backup
  async removeScheduledBackup(id: string): Promise<null> {
    const response = await this.api.delete<null>(`/backups/scheduled/${id}`);
    return response.data;
  }

  // Get system health status
  async getSystemHealth(): Promise<BackupSystemHealth> {
    const response = await this.api.get<{ success: boolean; data: BackupSystemHealth; message: string }>("/backups/system/health");
    return response.data.data;
  }

  // Verify backup integrity
  async verifyBackup(id: string): Promise<BackupVerification> {
    const response = await this.api.post<BackupVerification>(`/backups/system/verify/${id}`);
    return response.data;
  }

  // Get comprehensive system health summary
  async getSystemHealthSummary(): Promise<SystemHealthSummary> {
    const response = await this.api.get<{ success: boolean; data: SystemHealthSummary; message: string }>("/backups/system/health/summary");
    return response.data.data;
  }

  // Get backup priority paths
  async getPathsByPriority(priority: "low" | "medium" | "high" | "critical" = "medium"): Promise<string[]> {
    // This could be an API call in the future, for now return sensible defaults
    // Paths are centralized in config/backup-paths.ts
    switch (priority) {
      case "critical":
        return [...BACKUP_PATH_PRESETS.critical];
      case "high":
        return [...BACKUP_PATH_PRESETS.critical, ...BACKUP_PATH_PRESETS.high];
      case "medium":
        return [...BACKUP_PATH_PRESETS.critical, ...BACKUP_PATH_PRESETS.high, ...BACKUP_PATH_PRESETS.medium];
      case "low":
        return [...BACKUP_PATH_PRESETS.critical, ...BACKUP_PATH_PRESETS.high, ...BACKUP_PATH_PRESETS.medium, ...BACKUP_PATH_PRESETS.low];
      default:
        return [...BACKUP_PATH_PRESETS.high];
    }
  }

  // Format bytes utility
  formatBytes(bytes: number): string {
    // Handle null, undefined, or non-numeric values
    if (bytes === null || bytes === undefined || isNaN(bytes) || bytes < 0) {
      return "0 B";
    }

    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Generate cron expression helpers
  generateCronExpression(frequency: "daily" | "weekly" | "monthly", time: string): string {
    const [hours, minutes] = time.split(":").map(Number);

    switch (frequency) {
      case "daily":
        return `${minutes} ${hours} * * *`;
      case "weekly":
        return `${minutes} ${hours} * * 0`; // Every Sunday
      case "monthly":
        return `${minutes} ${hours} 1 * *`; // First day of month
      default:
        return `${minutes} ${hours} * * *`;
    }
  }

  // Parse cron expression to human readable
  parseCronToHuman(cron: string): string {
    const parts = cron.split(" ");
    if (parts.length < 5) return "Expressão cron inválida";

    const [minutes, hours, dayOfMonth, month, dayOfWeek] = parts;

    if (dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
      return `Diariamente às ${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
    }

    if (dayOfMonth === "*" && month === "*" && dayOfWeek !== "*") {
      const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
      const dayName = days[parseInt(dayOfWeek)] || `Dia ${dayOfWeek}`;
      return `Semanalmente às ${dayName} às ${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
    }

    if (dayOfMonth !== "*" && month === "*") {
      return `Mensalmente no dia ${dayOfMonth} às ${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
    }

    return `Às ${hours.padStart(2, "0")}:${minutes.padStart(2, "0")} (${cron})`;
  }

  // Get list of storage folders available for backup
  async getStorageFolders(): Promise<string[]> {
    const response = await this.api.get<{ success: boolean; data: string[]; message: string }>("/backups/storage-folders");
    return response.data.data || [];
  }

  // Get backup history (deleted backups)
  async getBackupHistory(): Promise<BackupMetadata[]> {
    const response = await this.api.get<{ success: boolean; data: BackupMetadata[]; message: string }>("/backups/history");
    return response.data.data || [];
  }

  // Permanently delete a backup (hard delete)
  async hardDeleteBackup(id: string): Promise<void> {
    await this.api.delete<{ success: boolean; message: string }>(`/backups/${id}/hard`);
  }
}

export const backupApi = new BackupApiClient();
