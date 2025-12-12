// packages/api-client/src/team-staff.ts

import { apiClient } from "./axiosClient";

// =====================
// Team Staff Service Class
// =====================

export class TeamStaffService {
  private readonly basePath = "/team-staff";

  // =====================
  // Query Operations
  // =====================

  async getTeamStaffUsers(params?: any): Promise<any> {
    const response = await apiClient.get<any>(`${this.basePath}/users`, {
      params,
    });
    return response.data;
  }

  async getTeamStaffCalculations(params?: any): Promise<any> {
    const response = await apiClient.get<any>(`${this.basePath}/calculations`, {
      params,
    });
    return response.data;
  }

  async getTeamStaffBorrows(params?: any): Promise<any> {
    const response = await apiClient.get<any>(`${this.basePath}/borrows`, {
      params,
    });
    return response.data;
  }

  async getTeamStaffVacations(params?: any): Promise<any> {
    const response = await apiClient.get<any>(`${this.basePath}/vacations`, {
      params,
    });
    return response.data;
  }

  async getTeamStaffEpis(params?: any): Promise<any> {
    const response = await apiClient.get<any>(`${this.basePath}/epis`, {
      params,
    });
    return response.data;
  }

  async getTeamStaffActivities(params?: any): Promise<any> {
    const response = await apiClient.get<any>(`${this.basePath}/activities`, {
      params,
    });
    return response.data;
  }

  async getTeamStaffWarnings(params?: any): Promise<any> {
    const response = await apiClient.get<any>(`${this.basePath}/warnings`, {
      params,
    });
    return response.data;
  }
}

// =====================
// Export service instance
// =====================

export const teamStaffService = new TeamStaffService();

// =====================
// Export individual functions
// =====================

export const getTeamStaffUsers = (params?: any) => teamStaffService.getTeamStaffUsers(params);
export const getTeamStaffCalculations = (params?: any) => teamStaffService.getTeamStaffCalculations(params);
export const getTeamStaffBorrows = (params?: any) => teamStaffService.getTeamStaffBorrows(params);
export const getTeamStaffVacations = (params?: any) => teamStaffService.getTeamStaffVacations(params);
export const getTeamStaffEpis = (params?: any) => teamStaffService.getTeamStaffEpis(params);
export const getTeamStaffActivities = (params?: any) => teamStaffService.getTeamStaffActivities(params);
export const getTeamStaffWarnings = (params?: any) => teamStaffService.getTeamStaffWarnings(params);
