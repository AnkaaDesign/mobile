import { apiClient } from "../axiosClient";

export interface SecullumAuthCredentials {
  email: string;
  password: string;
}

export interface SecullumAuthResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    userName: string;
    expiresAt: string;
    isAuthenticated: boolean;
  };
}

export interface SecullumEmployee {
  Id: number;
  Nome: string;
  NumeroFolha: string;
  NumeroIdentificador: string;
  NumeroPis: string;
  Cpf: string;
  DepartamentoDescricao: string;
  EmpresaId: number;
  DepartamentoId: number;
  FuncaoId: number;
  HorarioId: number;
}

export interface SecullumDailySummary {
  resumoDiario: {
    Funcionarios: Array<{
      Id: number;
      Nome: string;
      NumeroFolha: string;
      Celular?: string;
    }>;
    Dados: Array<{
      Titulo: string;
      FuncionariosIds: number[];
      Atual: number;
      Total: number;
      ExibirProgressBar: boolean;
      Tipo: number;
    }>;
  };
}

export const secullumService = {
  // Authentication
  authenticate: (credentials: SecullumAuthCredentials) => apiClient.post<SecullumAuthResponse>("/integrations/secullum/auth", credentials),

  getAuthStatus: () =>
    apiClient.get<{ success: boolean; isAuthenticated: boolean; tokenExpiresAt?: string; tokenValid?: boolean }>("/integrations/secullum/auth/status"),

  getHealth: () =>
    apiClient.get<{
      success: boolean;
      status: "healthy" | "degraded" | "down";
      timestamp: string;
      version?: string;
      database?: { status: "connected" | "disconnected"; responseTime?: number };
    }>("/integrations/secullum/health"),

  logout: (email?: string) => apiClient.post<{ success: boolean; message: string }>("/integrations/secullum/auth/logout", { email }),

  // Employees
  getEmployees: () => apiClient.get<{ success: boolean; data: SecullumEmployee[] }>("/integrations/secullum/employees"),

  syncEmployees: () => apiClient.post<{ success: boolean; message: string; data: any }>("/integrations/secullum/sync/employees"),

  // Attendance
  getDailySummary: () => apiClient.get<{ success: boolean; data: SecullumDailySummary }>("/integrations/secullum/attendance/daily-summary"),

  getMonthlySummary: () => apiClient.get<{ success: boolean; data: any }>("/integrations/secullum/attendance/monthly-summary"),

  getAttendanceRecords: (params?: { cpf?: string; dataInicio?: string; dataFim?: string }) =>
    apiClient.get<{ success: boolean; data: any }>("/integrations/secullum/attendance/records", { params }),

  getAttendanceCalculations: (params?: { cpf?: string; dataInicio?: string; dataFim?: string }) =>
    apiClient.get<{ success: boolean; data: any }>("/integrations/secullum/attendance/calculations", { params }),

  getCalculations: (params?: { userId?: string; cpf?: string; dataInicio?: string; dataFim?: string; startDate?: string; endDate?: string; page?: number; take?: number; status?: string; funcionarioId?: number }) =>
    apiClient.get<{ success: boolean; data: any; meta?: any }>("/integrations/secullum/calculations", {
      params: {
        userId: params?.userId,
        cpf: params?.cpf,
        startDate: params?.startDate || params?.dataInicio,
        endDate: params?.endDate || params?.dataFim,
        page: params?.page,
        take: params?.take,
        status: params?.status,
        funcionarioId: params?.funcionarioId
      }
    }),

  // Personal calculations - automatically filtered by current user
  getMyCalculations: (params?: { startDate?: string; endDate?: string; page?: number; take?: number }) =>
    apiClient.get<{ success: boolean; data: any; meta?: any }>("/personal/my-secullum-calculations", {
      params: {
        startDate: params?.startDate,
        endDate: params?.endDate,
        page: params?.page,
        take: params?.take,
      }
    }),

  // Departments & Positions
  getDepartments: () => apiClient.get<{ success: boolean; data: any }>("/integrations/secullum/departments"),

  getPositions: () => apiClient.get<{ success: boolean; data: any }>("/integrations/secullum/positions"),

  // Requests
  getPendingRequests: (params?: {
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
  }) => apiClient.post<{ success: boolean; data: any }>("/integrations/secullum/requests/pending", params || {}),

  // One row per active user for a single day — powers the daily-ponto
  // dashboard widget so HR/admin can see every employee's punches at a glance.
  getTimeEntriesByDay: (date: string) =>
    apiClient.get<{
      success: boolean;
      message: string;
      data: Array<{
        user: {
          id: string;
          name: string;
          positionName: string | null;
          sectorName: string | null;
        };
        entry: any | null;
      }>;
    }>("/integrations/secullum/time-entries/by-day", { params: { date } }),

  // Pendencias (simple requests endpoint)
  getPendencias: (userCpf?: string) =>
    apiClient.get<{ success: boolean; data: any[]; meta: any }>("/integrations/secullum/pendencias", {
      params: userCpf ? { userCpf } : {},
    }),

  // New Requests Management
  getRequests: (pending?: boolean) =>
    apiClient.get<{ success: boolean; data: any[]; message: string }>("/integrations/secullum/requests", {
      params: pending !== undefined ? { pending: pending.toString() } : {},
    }),

  approveRequest: (requestId: string, data: any) => apiClient.post<{ success: boolean; message: string; data: any }>(`/integrations/secullum/requests/${requestId}/approve`, data),

  rejectRequest: (requestId: string, data: any) => apiClient.post<{ success: boolean; message: string; data: any }>(`/integrations/secullum/requests/${requestId}/reject`, data),

  getApprovedRequests: (params?: {
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
  }) => apiClient.post<{ success: boolean; data: any }>("/integrations/secullum/requests/approved", params || {}),

  // Sync Management
  getSyncHistory: (params?: { page?: number; limit?: number; status?: string; entityType?: string; dateFrom?: Date; dateTo?: Date }) =>
    apiClient.get<{ success: boolean; data: any; meta?: any }>("/integrations/secullum/sync/history", { params }),

  // Conflict Resolution
  getConflicts: (params?: { status?: "pending" | "resolved" | "all"; entityType?: string; page?: number; limit?: number }) =>
    apiClient.get<{ success: boolean; data: any; meta?: any }>("/integrations/secullum/conflicts", { params }),

  resolveConflict: (params: { conflictId: string; resolution: "use_ankaa" | "use_secullum" | "merge" | "ignore"; notes?: string }) =>
    apiClient.post<{ success: boolean; message: string; data: any }>(`/integrations/secullum/conflicts/${params.conflictId}/resolve`, {
      resolution: params.resolution,
      notes: params.notes,
    }),

  bulkResolveConflicts: (params: { resolution: "use_ankaa" | "use_secullum" | "merge" | "ignore"; conflictIds?: string[]; filters?: any }) =>
    apiClient.post<{ success: boolean; message: string; data: any }>("/integrations/secullum/conflicts/bulk-resolve", params),

  // Entity Mappings
  getEntityMappings: () => apiClient.get<{ success: boolean; data: any }>("/integrations/secullum/mappings"),

  updateEntityMapping: (params: { entityType: string; mappingConfig: any }) =>
    apiClient.put<{ success: boolean; message: string; data: any }>(`/integrations/secullum/mappings/${params.entityType}`, {
      mappingConfig: params.mappingConfig,
    }),

  validateEntityMapping: (entityType: string) => apiClient.post<{ success: boolean; data: any }>(`/integrations/secullum/mappings/${entityType}/validate`),

  // Configuration
  getSyncConfig: () => apiClient.get<{ success: boolean; data: any }>("/integrations/secullum/config"),

  updateSyncConfig: (config: any) => apiClient.put<{ success: boolean; message: string; data: any }>("/integrations/secullum/config", config),

  testConnection: () => apiClient.post<{ success: boolean; message: string; data: any }>("/integrations/secullum/test-connection"),

  // Real-time Monitoring
  getSyncJobs: () => apiClient.get<{ success: boolean; data: any }>("/integrations/secullum/sync/jobs"),

  // Job Control
  pauseJob: (jobId: string) => apiClient.post<{ success: boolean; message: string }>(`/integrations/secullum/sync/jobs/${jobId}/pause`),

  resumeJob: (jobId: string) => apiClient.post<{ success: boolean; message: string }>(`/integrations/secullum/sync/jobs/${jobId}/resume`),

  cancelJob: (jobId: string) => apiClient.post<{ success: boolean; message: string }>(`/integrations/secullum/sync/jobs/${jobId}/cancel`),

  // Data Preview
  previewSync: (params: { entityType: string; limit?: number; filters?: any }) => apiClient.post<{ success: boolean; data: any }>("/integrations/secullum/sync/preview", params),

  // Export/Import
  exportSyncData: (params: { entityType?: string; dateFrom?: Date; dateTo?: Date; format?: "csv" | "excel" | "json" }) =>
    apiClient.post<Blob>("/integrations/secullum/export", params, {
      responseType: "blob",
    }),

  importSyncData: (file: any, entityType: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", entityType);

    return apiClient.post<{ success: boolean; message: string; data: any }>("/integrations/secullum/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Webhook Management
  getWebhookConfig: () => apiClient.get<{ success: boolean; data: any }>("/integrations/secullum/webhooks"),

  updateWebhookConfig: (config: { url?: string; events?: string[]; secret?: string; enabled?: boolean }) =>
    apiClient.put<{ success: boolean; message: string; data: any }>("/integrations/secullum/webhooks", config),

  testWebhook: () => apiClient.post<{ success: boolean; message: string }>("/integrations/secullum/webhooks/test"),

  // Holidays
  getHolidays: (params?: { year?: number; month?: number }) => apiClient.get<{ success: boolean; data: any }>("/integrations/secullum/holidays", { params }),

  createHoliday: (data: { Data: string; Descricao: string }) => apiClient.post<{ success: boolean; message: string; data?: any }>("/integrations/secullum/holidays", data),

  deleteHoliday: (holidayId: string | number) => apiClient.delete<{ success: boolean; message: string }>(`/integrations/secullum/holidays/${holidayId}`),

  // Schedules (Horarios)
  getHorarios: (params?: { incluirDesativados?: boolean }) =>
    apiClient.get<{ success: boolean; data: any[]; message: string }>("/integrations/secullum/horarios", {
      params: { incluirDesativados: params?.incluirDesativados ?? true },
    }),

  getHorarioById: (id: number | string) =>
    apiClient.get<{ success: boolean; data: any; message: string }>(`/integrations/secullum/horarios/${id}`),

  // Configuration
  getConfiguration: () => apiClient.get<{ success: boolean; data: any[] }>("/integrations/secullum/configuration"),

  // Time Clock Entries (Batidas)
  getTimeEntries: (params?: { userId?: string | number; funcionarioId?: number; cpf?: string; startDate?: string; endDate?: string; dataInicio?: string; dataFim?: string }) => {
    // Always use the time-entries endpoint with query parameters
    return apiClient.get<{ success: boolean; data: any; message?: string }>("/integrations/secullum/time-entries", {
      params: {
        userId: params?.userId,
        startDate: params?.startDate || params?.dataInicio,
        endDate: params?.endDate || params?.dataFim,
      },
    });
  },

  // Justifications
  getJustifications: () => apiClient.get<{ success: boolean; data: any[] }>("/integrations/secullum/justifications"),

  // Time Entry Photo
  getTimeEntryPhoto: (userId: number, fonteDadosId: number) =>
    apiClient.get<{ success: boolean; data: { FotoBatida: string } }>(`/integrations/secullum/batidas/foto/${userId}/${fonteDadosId}`),

  // Update Time Entry
  updateTimeEntry: (entryId: number, data: any) => apiClient.put<{ success: boolean; message: string; data: any }>(`/integrations/secullum/time-entries/${entryId}`, data),

  // Batch Update Time Entries
  batchUpdateTimeEntries: (entries: any[]) =>
    apiClient.post<{ success: boolean; message: string; updated: number }>("/integrations/secullum/time-entries/batch-update", { entries }),

  // User mapping sync
  syncUserMapping: (params?: { dryRun?: boolean }) => apiClient.post<{ success: boolean; summary: any; details: any }>("/integrations/secullum/sync-user-mapping", params),

  // =====================
  // Solicitação de Ausência (employee self-service)
  // Routes live under /personal because they're scoped to the authenticated user.
  // =====================

  getMyMissingDays: (params: { startDate: string; endDate: string }) =>
    apiClient.get<{
      success: boolean;
      message: string;
      data?: Array<{
        date: string;
        weekdayPt: string;
        saldo?: string | null;
        totalFaltas?: string | null;
        existePeriodoEncerrado: boolean;
      }>;
    }>("/personal/my-missing-days", { params }),

  getMyJustificativas: () =>
    apiClient.get<{
      success: boolean;
      message: string;
      data: Array<{
        id: number;
        nomeCompleto: string;
        exigirFotoAtestado: boolean;
        naoPermitirFuncionariosUtilizar: boolean;
      }>;
    }>("/personal/my-secullum-justificativas"),

  getMySolicitacaoByDate: (date: string) =>
    apiClient.get<{
      success: boolean;
      message: string;
      data?: {
        data: string;
        funcionarioId: number;
        justificativaId: number | null;
        tipo: number;
        observacoes: string | null;
        temFoto: boolean;
        registroPendente: boolean;
        existePeriodoEncerrado: boolean;
        tipoAusencia: number;
        dataSolicitacao: string | null;
        // Pending ajuste-de-ponto solicitations carry the user's proposed
        // entrada/saida values on these fields. The Ajustar Ponto screen
        // pre-fills from THESE when present (matches native Secullum), so
        // the user sees their own pending edits rather than the canonical
        // batidas underneath.
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
        // Período de Afastamento range — present when this is a multi-day
        // justificativa request (Justificar Ausência período mode).
        dataInicioAfastamento?: string | null;
        dataFimAfastamento?: string | null;
      } | null;
    }>(`/personal/my-secullum-solicitacoes/${date}`),

  createMyJustifyAbsence: (body: {
    date: string;
    justificativaId: number;
    observacoes?: string;
    photoBase64?: string;
    /** 0 = Dia inteiro, 1/2/3 = Período N, 4 = Período Específico. Ignored when dataInicio/FimAfastamento are set. */
    tipoAusencia?: 0 | 1 | 2 | 3 | 4;
    /** YYYY-MM-DD; set together with dataFimAfastamento for Período de Afastamento (multi-day) mode. */
    dataInicioAfastamento?: string;
    /** YYYY-MM-DD; see dataInicioAfastamento. */
    dataFimAfastamento?: string;
  }) =>
    apiClient.post<{
      success: boolean;
      message: string;
      validationErrors?: Array<{ property: string; message: string; data: unknown }>;
    }>("/personal/my-secullum-solicitacoes/ausencia", body),

  getMyBatidasForDate: (date: string) =>
    apiClient.get<{
      success: boolean;
      message: string;
      data?: {
        entrada1: string | null;
        saida1: string | null;
        entrada2: string | null;
        saida2: string | null;
        entrada3: string | null;
        saida3: string | null;
        entrada4: string | null;
        saida4: string | null;
        entrada5: string | null;
        saida5: string | null;
        existePeriodoEncerrado: boolean;
      };
    }>(`/personal/my-batidas/${date}`),

  createMyAjustePonto: (body: {
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
  }) =>
    apiClient.post<{
      success: boolean;
      message: string;
      validationErrors?: Array<{ property: string; message: string; data: unknown }>;
    }>("/personal/my-secullum-solicitacoes/ajuste-ponto", body),

  // ==========================================================================
  // Inclusão de Ponto (mobile self-service)
  // ==========================================================================

  getMyInclusaoPontoConfig: () =>
    apiClient.get<{
      success: boolean;
      message: string;
      data?: {
        horaServidor: string;
        origemHorario: string;
        justificativaAutomatica: boolean;
        funcionarioAfastado: boolean;
        exigirCapturaFotoPonto: boolean;
        reconhecerFace: boolean;
        tipoCameraCapturaFotoPonto: 0 | 1 | 2;
        somentePerimetrosAutorizados: boolean;
        perimetrosAutorizados: Array<{
          id?: number;
          nome?: string;
          latitude?: number;
          longitude?: number;
          raio?: number;
          [k: string]: unknown;
        }>;
        atividades: Array<{
          id: number;
          descricao: string;
          descricaoAbreviada: string;
        }>;
      };
    }>("/personal/my-inclusao-ponto/config"),

  getMyInclusaoPontoPendencias: () =>
    apiClient.get<{
      success: boolean;
      message: string;
      data?: Array<{
        id: number;
        dataHora: string;
        latitude: number;
        longitude: number;
        precisao: number;
        endereco: string;
        status: 0 | 1 | 2;
        motivoRejeicao: string | null;
        foraDoPerimetro: boolean;
        atividadeId: number | null;
        fonteDadosId: number | null;
      }>;
    }>("/personal/my-inclusao-ponto/pendencias"),

  createMyInclusaoPonto: (body: {
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
  }) =>
    apiClient.post<{
      success: boolean;
      message: string;
      validationErrors?: Array<{ property: string; message: string; data: unknown }>;
      data?: { id?: number };
    }>("/personal/my-inclusao-ponto", body),

  reverseGeocode: (latitude: number, longitude: number) =>
    apiClient.get<{
      success: boolean;
      message: string;
      data?: { endereco: string };
    }>("/personal/my-inclusao-ponto/reverse-geocode", {
      params: { latitude, longitude },
    }),

  /**
   * Returns the absolute URL the mobile app should hand to a WebView to render
   * the signed comprovante PDF. The backend streams the PDF authenticated as
   * the funcionário, so the URL itself doesn't need to carry credentials.
   */
  getInclusaoPontoComprovanteUrl: (registroPendenciaId: number): string => {
    const base = (apiClient.defaults.baseURL ?? "").replace(/\/$/, "");
    return `${base}/personal/my-inclusao-ponto/comprovante/${registroPendenciaId}`;
  },

  /**
   * Mints a one-shot Secullum-hosted comprovante URL (with the embedded `axpw`
   * Basic-auth token) so the mobile app can open the rendered receipt in the
   * system in-app browser, exactly like native Secullum mobile does.
   */
  getMyInclusaoPontoComprovanteUrl: (registroPendenciaId: number) =>
    apiClient.get<{
      success: boolean;
      message: string;
      data?: { url: string };
    }>(`/personal/my-inclusao-ponto/comprovante-url/${registroPendenciaId}`),
};
