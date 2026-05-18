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
  timeEntriesByDay: (date?: string) => [...secullumKeys.all, "time-entries-by-day", date] as const,
  horarios: (params?: any) => [...secullumKeys.all, "horarios", params] as const,
  horarioDetail: (id: number | string) => [...secullumKeys.all, "horarios", "detail", id] as const,
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
    refetchIntervalInBackground: false,
  });
};

// Per-day, per-user time-entries — used by the HR daily-ponto widget. Each
// row is { user, entry } where `entry` is the Secullum row for that day or
// null when the employee has no punches yet.
export const useSecullumTimeEntriesByDay = (date?: string) => {
  return useQuery({
    queryKey: secullumKeys.timeEntriesByDay(date),
    queryFn: () => secullumService.getTimeEntriesByDay(date as string),
    enabled: !!date,
    staleTime: 60 * 1000,
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
    queryFn: async () => {
      try {
        return await secullumService.getMyCalculations(params);
      } catch (error: any) {
        // Check if user is not registered in Secullum - return special response instead of throwing
        const errorMessage = error?.response?.data?.message || error?.message || '';
        const isNotRegistered = errorMessage.toLowerCase().includes('secullum employee id')
          || errorMessage.toLowerCase().includes('secullum account')
          || errorMessage.toLowerCase().includes('não possui cadastro');

        if (isNotRegistered) {
          // Return a special response that indicates user is not registered
          return { data: { success: false, notRegistered: true, message: errorMessage } };
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!params?.startDate && !!params?.endDate,
    retry: false, // Don't retry for this endpoint
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

// Justifications dropdown source for the time-card cell context menu.
// Cached for 1 hour — codes change rarely.
export const useSecullumJustifications = () => {
  return useQuery({
    queryKey: [...secullumKeys.all, "justifications"],
    queryFn: () => secullumService.getJustifications(),
    staleTime: 60 * 60 * 1000,
  });
};

// Sync Management hooks
export const useSecullumSyncStatus = () => {
  return useQuery({
    queryKey: [...secullumKeys.all, "sync-status"],
    queryFn: () => secullumService.getSyncStatus(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 10 * 1000, // Refetch every 10s — was 5s, but UI didn't need that resolution
    refetchIntervalInBackground: false,
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
    refetchInterval: 5 * 1000, // Refetch every 5s — was 2s, which thrashed the JS thread
    refetchIntervalInBackground: false,
  });
};

export const useSecullumSystemMetrics = () => {
  return useQuery({
    queryKey: [...secullumKeys.all, "system-metrics"],
    queryFn: () => secullumService.getSystemMetrics(),
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 15 * 1000, // Refetch every 15s — was 5s
    refetchIntervalInBackground: false,
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

// Schedules (Horarios) hooks
export const useSecullumHorarios = (params?: { incluirDesativados?: boolean }) => {
  return useQuery({
    queryKey: secullumKeys.horarios(params),
    queryFn: () => secullumService.getHorarios(params),
    staleTime: 10 * 60 * 1000, // 10 minutes - schedules don't change often
  });
};

export const useSecullumHorarioById = (id: number | string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: secullumKeys.horarioDetail(id),
    queryFn: () => secullumService.getHorarioById(id),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled !== false && !!id,
  });
};

// =====================
// Justificar Ausência (Solicitação de Ausência)
// =====================

const myAbsenceKeys = {
  missingDays: (params: { startDate: string; endDate: string }) =>
    [...secullumKeys.all, "my-missing-days", params] as const,
  justificativas: () => [...secullumKeys.all, "my-justificativas"] as const,
  existing: (date: string) => [...secullumKeys.all, "my-solicitacao", date] as const,
  batidasForDate: (date: string) => [...secullumKeys.all, "my-batidas", date] as const,
};

export const useMyMissingDays = (
  params: { startDate: string; endDate: string },
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: myAbsenceKeys.missingDays(params),
    queryFn: () => secullumService.getMyMissingDays(params),
    enabled: options?.enabled !== false && !!params.startDate && !!params.endDate,
    staleTime: 60 * 1000, // 1 minute — batidas can change frequently
  });
};

export const useMyJustificativas = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: myAbsenceKeys.justificativas(),
    queryFn: () => secullumService.getMyJustificativas(),
    enabled: options?.enabled !== false,
    staleTime: 30 * 60 * 1000, // 30 minutes — justification list barely changes
  });
};

export const useMyExistingSolicitacao = (date: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: myAbsenceKeys.existing(date),
    queryFn: () => secullumService.getMySolicitacaoByDate(date),
    enabled: options?.enabled !== false && !!date,
    staleTime: 30 * 1000,
  });
};

export const useCreateMyJustifyAbsence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      date: string;
      justificativaId: number;
      observacoes?: string;
      photoBase64?: string;
      tipoAusencia?: 0 | 1 | 2 | 3 | 4;
      dataInicioAfastamento?: string;
      dataFimAfastamento?: string;
    }) => secullumService.createMyJustifyAbsence(body),
    onSuccess: (_data, variables) => {
      // Refresh missing-days list, the just-submitted date, and any calculations cache.
      queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "my-missing-days"] });
      queryClient.invalidateQueries({ queryKey: myAbsenceKeys.existing(variables.date) });
      queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "my-calculations"] });
    },
  });
};

export const useMyBatidasForDate = (date: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: myAbsenceKeys.batidasForDate(date),
    queryFn: () => secullumService.getMyBatidasForDate(date),
    enabled: options?.enabled !== false && !!date,
    staleTime: 30 * 1000,
  });
};

export const useCreateMyAjustePonto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      date: string;
      entrada1?: string | null;
      saida1?: string | null;
      entrada2?: string | null;
      saida2?: string | null;
      entrada3?: string | null;
      saida3?: string | null;
      entrada4?: string | null;
      saida4?: string | null;
      entrada5?: string | null;
      saida5?: string | null;
      observacoes?: string;
    }) => secullumService.createMyAjustePonto(body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "my-missing-days"] });
      queryClient.invalidateQueries({ queryKey: myAbsenceKeys.existing(variables.date) });
      queryClient.invalidateQueries({ queryKey: myAbsenceKeys.batidasForDate(variables.date) });
      queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "my-calculations"] });
    },
  });
};

// ============================================================================
// Inclusão de Ponto
// ============================================================================

export const inclusaoPontoKeys = {
  all: [...secullumKeys.all, "inclusao-ponto"] as const,
  config: () => [...inclusaoPontoKeys.all, "config"] as const,
  pendencias: () => [...inclusaoPontoKeys.all, "pendencias"] as const,
};

/**
 * Loads the IncluirPonto configuration (server time, perimeters, photo rules,
 * activities). Cached for 30s so opening the screen and immediately tapping
 * "Nova Inclusão" doesn't re-hit the network.
 */
export const useInclusaoPontoConfig = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: inclusaoPontoKeys.config(),
    queryFn: async () => {
      const res = await secullumService.getMyInclusaoPontoConfig();
      return res.data;
    },
    enabled: options?.enabled !== false,
    staleTime: 30 * 1000,
  });
};

/**
 * Loads the user's last 10 inclusão pendências. When `pollWhilePending` is
 * true, refetches every 4 seconds so long as any record has status=0
 * (Em processamento) — used right after a submission so the UI transitions
 * to Aceita/Rejeitada without a manual refresh.
 */
export const useInclusaoPontoPendencias = (options?: {
  enabled?: boolean;
  pollWhilePending?: boolean;
}) => {
  return useQuery({
    queryKey: inclusaoPontoKeys.pendencias(),
    queryFn: async () => {
      const res = await secullumService.getMyInclusaoPontoPendencias();
      return res.data;
    },
    enabled: options?.enabled !== false,
    // Drop staleTime so each poll surfaces the freshest state immediately and
    // the next interval tick isn't held off as "still fresh".
    staleTime: 0,
    // Poll every 2.5s while ANY entry is Em processamento (status=0). 4s felt
    // too sluggish given face-recognition usually finishes in 5-15s. Keep
    // polling in the background so a brief app-switch doesn't pause it.
    refetchInterval: (query) => {
      if (!options?.pollWhilePending) return false;
      const data = query.state.data;
      const list = data?.data ?? [];
      const hasPending = list.some((p) => p.status === 0);
      return hasPending ? 2500 : false;
    },
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

export const useCreateMyInclusaoPonto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      latitude?: number | null;
      longitude?: number | null;
      precisao?: number | null;
      endereco?: string | null;
      photoBase64?: string | null;
      justificativa?: string | null;
      atividadeId?: number | null;
      foraDoPerimetro?: boolean;
      identificacaoDispositivo?: string;
      utilizaLocalizacaoFicticia?: boolean;
    }) => secullumService.createMyInclusaoPonto(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inclusaoPontoKeys.pendencias() });
      // The user's batidas may show the new entry after acceptance — invalidate
      // calculations and missing-days so the rest of the app picks it up too.
      queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "my-missing-days"] });
      queryClient.invalidateQueries({ queryKey: [...secullumKeys.all, "my-calculations"] });
    },
  });
};

export const useReverseGeocode = () => {
  return useMutation({
    mutationFn: ({ latitude, longitude }: { latitude: number; longitude: number }) =>
      secullumService.reverseGeocode(latitude, longitude),
  });
};

/**
 * Opens the comprovante in the system in-app browser, matching native Secullum
 * mobile UX (Safari opens pontowebapp.secullum.com.br/{db}/Batidas/Comprovante
 * with a one-shot `axpw` Basic-auth token in the query string).
 *
 * Two phases:
 *  1. POST to the backend to mint a short-lived comprovante URL (the backend
 *     wraps the funcionário's Secullum credentials so we never embed them in
 *     the mobile bundle).
 *  2. Open that URL in expo-web-browser so the user sees the rendered receipt
 *     exactly like the native Secullum mobile app does.
 *
 * Previously we proxied the PDF through the backend and shared it via
 * expo-sharing — but the dynamic `await import("expo-file-system")` didn't
 * preserve `EncodingType`, producing the "Cannot read property Base64 of
 * undefined" error users were seeing. Routing through the URL also matches
 * the screenshots the user provided of native Secullum.
 */
export const useOpenInclusaoPontoComprovante = () => {
  return useMutation({
    mutationFn: async (registroPendenciaId: number) => {
      const WebBrowser = await import("expo-web-browser");

      const urlRes = await secullumService.getMyInclusaoPontoComprovanteUrl(
        registroPendenciaId,
      );
      const url = urlRes?.data?.data?.url;
      if (!url) {
        throw new Error(
          urlRes?.data?.message || "Não foi possível abrir o comprovante.",
        );
      }
      await WebBrowser.openBrowserAsync(url, {
        dismissButtonStyle: "close",
        readerMode: false,
        showTitle: true,
        toolbarColor: undefined,
      });
      return url;
    },
  });
};
