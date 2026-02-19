// api-client/notification-admin.ts

import { apiClient } from "./axiosClient";
import type { Notification } from "@/types";
import type { Meta } from "@/types/common";

// =====================
// Types
// =====================

export interface AdminNotificationListFilters {
  type?: string;
  channel?: string;
  status?: "sent" | "scheduled" | "pending";
  deliveryStatus?: "delivered" | "failed" | "pending";
  userId?: string;
  sectorId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: "asc" | "desc";
  searchingFor?: string;
}

export interface AdminNotificationListResponse {
  success: boolean;
  data: Notification[];
  meta: Meta;
  message: string;
}

// =====================
// Service
// =====================

class NotificationAdminService {
  private readonly basePath = "/admin/notifications";

  async getNotifications(
    params: AdminNotificationListFilters = {}
  ): Promise<AdminNotificationListResponse> {
    const response = await apiClient.get<{
      success: boolean;
      data: Notification[];
      meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
      message: string;
    }>(this.basePath, { params });

    // Transform meta to match the mobile system's expected format
    const { total, page, limit, totalPages, hasNextPage, hasPreviousPage } =
      response.data.meta;

    return {
      ...response.data,
      meta: {
        totalRecords: total,
        page,
        take: limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }
}

// =====================
// Exports
// =====================

export const notificationAdminService = new NotificationAdminService();

export const getAdminNotifications = (params?: AdminNotificationListFilters) =>
  notificationAdminService.getNotifications(params);
