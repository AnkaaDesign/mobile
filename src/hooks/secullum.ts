import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { secullumService } from '@/api-client';
import type { SecullumAuthCredentials } from '@/api-client';

// Query keys
export const secullumKeys = {
  all: ["secullum"] as const,
  auth: () => [...secullumKeys.all, "auth"] as const,
  authStatus: () => [...secullumKeys.auth(), "status"] as const,
  employees: () => [...secullumKeys.all, "employees"] as const,
  dailySummary: () => [...secullumKeys.all, "daily-summary"] as const,
  monthlySummary: () => [...secullumKeys.all, "monthly-summary"] as const,
  attendanceRecords: (params?: any) => [...secullumKeys.all, "attendance-records", params] as const,
  attendanceCalculations: (params?: any) => [...secullumKeys.all, "attendance-calculations", params] as const,
  calculations: (params?: any) => [...secullumKeys.all, "calculations", params] as const,
  departments: () => [...secullumKeys.all, "departments"] as const,
  positions: () => [...secullumKeys.all, "positions"] as const,
  pendingRequests: (params?: any) => [...secullumKeys.all, "pending-requests", params] as const,
  approvedRequests: (params?: any) => [...secullumKeys.all, "approved-requests", params] as const,
  pendencias: (userCpf?: string) => [...secullumKeys.all, "pendencias", userCpf] as const,
  timeEntries: (params?: any) => [...secullumKeys.all, "time-entries", params] as const,
};

// Authentication hooks
export const useSecullumAuth = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: SecullumAuthCredentials) => secullumService.authenticate(credentials),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: secullumKeys.authStatus() });
    },
    onError: (_error: any) => {
    },
  });
};

export const useSecullumAuthStatus = () => {
  return useQuery({
    queryKey: secullumKeys.authStatus(),
    queryFn: () => secullumService.getAuthStatus(),
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useSecullumLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email?: string) => secullumService.logout(email),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: secullumKeys.all });
    },
    onError: (_error: any) => {
    },
  });
};

// Employee hooks
export const useSecullumEmployees = () => {
  return useQuery({
    queryKey: [...secullumKeys.all, "employees"],
    queryFn: () => secullumService.getEmployees(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSecullumSyncEmployees = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => secullumService.syncEmployees(),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: secullumKeys.employees() });
    },
    onError: (_error: any) => {
    },
  });
};

// Attendance hooks
export const useSecullumDailySummary = () => {
  return useQuery({
    queryKey: secullumKeys.dailySummary(),
    queryFn: () => secullumService.getDailySummary(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useSecullumMonthlySummary = () => {
  return useQuery({
    queryKey: secullumKeys.monthlySummary(),
    queryFn: () => secullumService.getMonthlySummary(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSecullumAttendanceRecords = (params?: { cpf?: string; dataInicio?: string; dataFim?: string }) => {
  return useQuery({
    queryKey: secullumKeys.attendanceRecords(params),
    queryFn: () => secullumService.getAttendanceRecords(params),
    enabled: !!params?.cpf,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSecullumAttendanceCalculations = (params?: { cpf?: string; dataInicio?: string; dataFim?: string }) => {
  return useQuery({
    queryKey: secullumKeys.attendanceCalculations(params),
    queryFn: () => secullumService.getAttendanceCalculations(params),
    enabled: !!params?.cpf,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSecullumCalculations = (params?: {
  cpf?: string;
  dataInicio?: string;
  dataFim?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  take?: number;
  status?: string;
  funcionarioId?: number;
  userId?: string;
}) => {
  return useQuery({
    queryKey: secullumKeys.calculations(params),
    queryFn: () => secullumService.getCalculations(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!params && !!(params.userId || params.cpf || params.funcionarioId) && !!(params.startDate || params.dataInicio) && !!(params.endDate || params.dataFim),
  });
};

// Personal calculations - automatically filtered by current user (no elevated privileges required)
export const useMySecullumCalculations = (params?: {
  startDate?: string;
  endDate?: string;
  page?: number;
  take?: number;
}) => {
  return useQuery({
    queryKey: [...secullumKeys.all, "my-calculations", params],
    queryFn: () => secullumService.getMyCalculations(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!params?.startDate && !!params?.endDate,
  });
};

// Time Entries hook (removed duplicate - see line 421)

// Department & Position hooks
export const useSecullumDepartments = () => {
  return useQuery({
    queryKey: secullumKeys.departments(),
    queryFn: () => secullumService.getDepartments(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSecullumPositions = () => {
  return useQuery({
    queryKey: secullumKeys.positions(),
    queryFn: () => secullumService.getPositions(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Request hooks
export const useSecullumPendingRequests = (params?: {
  dataInicio?: Date | null;
  dataFim?: Date | null;
  funcionariosIds?: number[];
  empresaId?: number;
  departamentoId?: number;
  funcaoId?: number;
  estruturaId?: number;
  tipo?: number | null;
  ordem?: number;
  decrescente?: boolean;
  quantidade?: number;
}) => {
  return useQuery({
    queryKey: secullumKeys.pendingRequests(params),
    queryFn: () => secullumService.getPendingRequests(params),
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useSecullumApprovedRequests = (params?: {
  dataInicio?: Date | null;
  dataFim?: Date | null;
  funcionariosIds?: number[];
  empresaId?: number;
  departamentoId?: number;
  funcaoId?: number;
  estruturaId?: number;
  tipo?: number | null;
  ordem?: number;
  decrescente?: boolean;
  quantidade?: number;
}) => {
  return useQuery({
    queryKey: secullumKeys.approvedRequests(params),
    queryFn: () => secullumService.getApprovedRequests(params),
    staleTime: 60 * 1000, // 1 minute
  });
};

// Pendencias hook
export const useSecullumPendencias = (userCpf?: string) => {
  return useQuery({
    queryKey: secullumKeys.pendencias(userCpf),
    queryFn: () => secullumService.getPendencias(userCpf),
    staleTime: 60 * 1000, // 1 minute
  });
};

// New Requests Management hooks
export const useSecullumRequests = (pending?: boolean) => {
  return useQuery({
    queryKey: [...secullumKeys.all, "requests", pending],
    queryFn: () => secullumService.getRequests(pending),
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useSecullumApproveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: any }) => secullumService.approveRequest(requestId, data),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "requests"] });
      queryClient.invalidateQueries({ queryKey: secullumKeys.pendencias() });
    },
    onError: (_error: any) => {
    },
  });
};

export const useSecullumRejectRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: any }) => secullumService.rejectRequest(requestId, data),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "requests"] });
      queryClient.invalidateQueries({ queryKey: secullumKeys.pendencias() });
    },
    onError: (_error: any) => {
    },
  });
};

// Sync Management hooks
export const useSecullumSyncStatus = () => {
  return useQuery({
    queryKey: [...secullumKeys.all, "sync-status"],
    queryFn: () => secullumService.getSyncStatus(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 5 * 1000, // Refetch every 5 seconds for real-time updates
  });
};

export const useSecullumSyncTrigger = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (_params: { type: "full" | "partial" | "pause" | "resume" | "stop"; entityTypes?: string[] }) => secullumService.triggerSync(_params),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "sync-status"] });
      queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "sync-history"] });
    },
    onError: (_error: any) => {
    },
  });
};

export const useSecullumSyncHistory = (params?: { page?: number; limit?: number; status?: string; entityType?: string; dateFrom?: Date; dateTo?: Date }) => {
  return useQuery({
    queryKey: [...secullumKeys.all, "sync-history", params],
    queryFn: () => secullumService.getSyncHistory(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useSecullumConflicts = (params?: { status?: "pending" | "resolved" | "all"; entityType?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...secullumKeys.all, "conflicts", params],
    queryFn: () => secullumService.getConflicts(params),
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useSecullumResolveConflict = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (_params: { conflictId: string; resolution: "use_ankaa" | "use_secullum" | "merge" | "ignore"; notes?: string }) => secullumService.resolveConflict(_params),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "conflicts"] });
    },
    onError: (_error: any) => {
    },
  });
};

export const useSecullumBulkResolveConflicts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (_params: { resolution: "use_ankaa" | "use_secullum" | "merge" | "ignore"; conflictIds?: string[]; filters?: any }) =>
      secullumService.bulkResolveConflicts(_params),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "conflicts"] });
    },
    onError: (_error: any) => {
    },
  });
};

export const useSecullumEntityMappings = () => {
  return useQuery({
    queryKey: [...secullumKeys.all, "entity-mappings"],
    queryFn: () => secullumService.getEntityMappings(),
    staleTime: 10 * 60 * 1000, // 10 minutes - mappings change rarely
  });
};

export const useSecullumUpdateEntityMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (_params: { entityType: string; mappingConfig: any }) => secullumService.updateEntityMapping(_params),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "entity-mappings"] });
    },
    onError: (_error: any) => {
    },
  });
};

export const useSecullumSyncConfig = () => {
  return useQuery({
    queryKey: [...secullumKeys.all, "sync-config"],
    queryFn: () => secullumService.getSyncConfig(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSecullumUpdateSyncConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: any) => secullumService.updateSyncConfig(config),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "sync-config"] });
      queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "sync-status"] });
    },
    onError: (_error: any) => {
    },
  });
};

export const useSecullumTestConnection = () => {
  return useMutation({
    mutationFn: () => secullumService.testConnection(),
    onSuccess: (_data) => {
    },
    onError: (_error: any) => {
    },
  });
};

export const useSecullumSyncJobs = () => {
  return useQuery({
    queryKey: [...secullumKeys.all, "sync-jobs"],
    queryFn: () => secullumService.getSyncJobs(),
    staleTime: 10 * 1000, // 10 seconds for real-time monitoring
    refetchInterval: 2 * 1000, // Refetch every 2 seconds for live updates
  });
};

export const useSecullumSystemMetrics = () => {
  return useQuery({
    queryKey: [...secullumKeys.all, "system-metrics"],
    queryFn: () => secullumService.getSystemMetrics(),
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 5 * 1000, // Refetch every 5 seconds
  });
};

// Time Entries hooks
export const useSecullumTimeEntries = (params?: {
  cpf?: string;
  dataInicio?: string;
  dataFim?: string;
  funcionarioId?: number;
  userId?: string; // Add userId parameter
  startDate?: string; // Add startDate parameter
  endDate?: string; // Add endDate parameter
  page?: number;
  take?: number;
}) => {
  return useQuery({
    queryKey: secullumKeys.timeEntries(params),
    queryFn: () => secullumService.getTimeEntries(params),
    staleTime: 60 * 1000, // 1 minute
    enabled: !!(params?.cpf || params?.funcionarioId || params?.userId), // Enable when userId is provided
  });
};

export const useSecullumUpdateTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (_params: { entryId: string; field: string; value: string | null; justification?: string }) =>
      secullumService.updateTimeEntry(parseInt(_params.entryId), {
        [_params.field]: _params.value,
        justification: _params.justification,
      }),
    onSuccess: (_data, _variables) => {
      // Invalidate time entries queries to refresh the data
      queryClient.invalidateQueries({ queryKey: secullumKeys.timeEntries() });
    },
    onError: (_error: any) => {
    },
  });
};

// Compatibility hook for batch updates
export const useTimeClockEntryBatchUpdateWithJustification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_params: { entries: any[] }) => {
      // For now, just show a message that updates are not implemented
      return Promise.resolve({ success: true, message: "Funcionalidade em desenvolvimento" });
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: secullumKeys.timeEntries() });
    },
    onError: (_error: any) => {
    },
  });
};

// Holiday hooks
export const useSecullumHolidays = (params?: { year?: number; month?: number }) => {
  return useQuery({
    queryKey: [...secullumKeys.all, "holidays", params],
    queryFn: () => secullumService.getHolidays(params),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - holidays don't change often
  });
};

export const useSecullumCreateHoliday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (_data: { Data: string; Descricao: string }) => secullumService.createHoliday(_data),
    onSuccess: (_response) => {
      // Invalidate holidays queries to refresh the list
      queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "holidays"] });
    },
    onError: (_error: any) => {
    },
  });
};

export const useSecullumDeleteHoliday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (holidayId: string | number) => secullumService.deleteHoliday(holidayId),
    onSuccess: (_response) => {
      // Invalidate holidays queries to refresh the list
      queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "holidays"] });
    },
    onError: (_error: any) => {
    },
  });
};

// Configuration hook
export const useSecullumConfiguration = () => {
  return useQuery({
    queryKey: [...secullumKeys.all, "configuration"],
    queryFn: () => secullumService.getConfiguration(),
    staleTime: 60 * 60 * 1000, // 1 hour - configuration doesn't change often
  });
};

// User mapping sync hook
export const useSecullumSyncUserMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params?: { dryRun?: boolean }) => secullumService.syncUserMapping(params),
    onSuccess: (response, _variables) => {
      const data = response.data;
      if (data && !_variables?.dryRun) {
        queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "employees"] });
      }
    },
    onError: (_error: any) => {
    },
  });
};
