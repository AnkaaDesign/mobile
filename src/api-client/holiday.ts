// packages/api-client/src/holiday.ts
//
// Holidays are managed entirely through the Secullum integration. There is no
// standalone Holiday table/CRUD in the API — the only first-party read endpoint
// (GET /personal/my-holidays) is read-only and simply proxies Secullum.
//
// This service adapts the Secullum holiday shape ({ Id, Data, Descricao }) to
// the mobile Holiday type ({ id, name, date, type }) so the existing hooks,
// list config and feriados pages keep working unchanged. Secullum exposes only
// GET / POST / DELETE for /Feriados (no update), so updates are implemented as
// create-new-then-delete-old.

import { secullumService } from "./services/secullum";
import type {
  HolidayGetManyFormData,
  HolidayGetByIdFormData,
  HolidayCreateFormData,
  HolidayUpdateFormData,
  HolidayBatchCreateFormData,
  HolidayBatchUpdateFormData,
  HolidayBatchDeleteFormData,
  HolidayQueryFormData,
} from '../schemas';
import type {
  Holiday,
  HolidayGetUniqueResponse,
  HolidayGetManyResponse,
  HolidayCreateResponse,
  HolidayUpdateResponse,
  HolidayDeleteResponse,
  HolidayBatchCreateResponse,
  HolidayBatchUpdateResponse,
  HolidayBatchDeleteResponse,
} from '../types';

// =====================
// Secullum <-> Holiday mappers
// =====================

interface SecullumHoliday {
  Id: number;
  Data: string;
  Descricao: string;
}

// Mobile ids are prefixed so they stay stable/consistent with the API's
// /personal/my-holidays transform. The raw Secullum id is needed for DELETE.
const SECULLUM_ID_PREFIX = "secullum-";

const toHolidayId = (secullumId: number | string): string => `${SECULLUM_ID_PREFIX}${secullumId}`;

const toSecullumId = (holidayId: string | number): string =>
  String(holidayId).startsWith(SECULLUM_ID_PREFIX)
    ? String(holidayId).slice(SECULLUM_ID_PREFIX.length)
    : String(holidayId);

const mapSecullumToHoliday = (h: SecullumHoliday): Holiday => ({
  id: toHolidayId(h.Id),
  name: h.Descricao,
  date: new Date(h.Data),
  type: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Secullum expects an ISO date string (YYYY-MM-DD).
const toSecullumDate = (date: unknown): string => {
  if (date instanceof Date) return date.toISOString().split("T")[0];
  if (typeof date === "string") return date.split("T")[0];
  return new Date().toISOString().split("T")[0];
};

// =====================
// Holiday Service Class
// =====================

export class HolidayService {
  // =====================
  // Query Operations
  // =====================

  async getHolidays(params?: HolidayGetManyFormData): Promise<HolidayGetManyResponse> {
    // Only `year` is honoured by Secullum; everything else is filtered client-side.
    const year = (params as any)?.year as number | undefined;
    const month = (params as any)?.month as number | undefined;
    const response = await secullumService.getHolidays(year ? { year } : undefined);
    const raw = (response.data?.data || []) as SecullumHoliday[];
    let holidays = raw.map(mapSecullumToHoliday);

    // Secullum only filters by year — apply month client-side.
    if (typeof month === "number") {
      holidays = holidays.filter((h) => h.date.getMonth() + 1 === month);
    }

    // Client-side ordering parity with the previous list behaviour.
    const orderBy = (params as any)?.orderBy;
    const dir = orderBy?.date === "desc" ? -1 : 1;
    if (orderBy?.date) {
      holidays = holidays.sort((a, b) => (a.date.getTime() - b.date.getTime()) * dir);
    }

    // Client-side "upcoming" convenience filter.
    if ((params as any)?.isUpcoming) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      holidays = holidays.filter((h) => h.date >= now);
    }

    return {
      success: true,
      message: "Feriados carregados com sucesso",
      data: holidays,
      meta: {
        totalRecords: holidays.length,
        page: 1,
        take: holidays.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    } as HolidayGetManyResponse;
  }

  async getHolidayById(id: string, _params?: Omit<HolidayGetByIdFormData, "id">): Promise<HolidayGetUniqueResponse> {
    // Secullum has no get-by-id; fetch the full list and find it client-side.
    const response = await secullumService.getHolidays();
    const raw = (response.data?.data || []) as SecullumHoliday[];
    const match = raw.map(mapSecullumToHoliday).find((h) => h.id === id);

    return {
      success: !!match,
      message: match ? "Feriado encontrado" : "Feriado não encontrado",
      data: match as Holiday,
    } as HolidayGetUniqueResponse;
  }

  // =====================
  // Mutation Operations
  // =====================

  async createHoliday(data: HolidayCreateFormData, _query?: HolidayQueryFormData): Promise<HolidayCreateResponse> {
    const response = await secullumService.createHoliday({
      Data: toSecullumDate((data as any).date),
      Descricao: (data as any).name,
    });
    const created = response.data?.data as SecullumHoliday | undefined;

    return {
      success: response.data?.success ?? true,
      message: response.data?.message ?? "Feriado criado com sucesso",
      data: created ? mapSecullumToHoliday(created) : ({} as Holiday),
    } as HolidayCreateResponse;
  }

  async updateHoliday(id: string, data: HolidayUpdateFormData, _query?: HolidayQueryFormData): Promise<HolidayUpdateResponse> {
    // Secullum has no update route. Create the new holiday first, then delete the
    // old one only after the create succeeds (so we never lose data on failure).
    const response = await secullumService.createHoliday({
      Data: toSecullumDate((data as any).date),
      Descricao: (data as any).name,
    });
    const created = response.data?.data as SecullumHoliday | undefined;

    await secullumService.deleteHoliday(toSecullumId(id));

    return {
      success: response.data?.success ?? true,
      message: response.data?.message ?? "Feriado atualizado com sucesso",
      data: created ? mapSecullumToHoliday(created) : ({} as Holiday),
    } as HolidayUpdateResponse;
  }

  async deleteHoliday(id: string): Promise<HolidayDeleteResponse> {
    const response = await secullumService.deleteHoliday(toSecullumId(id));
    return {
      success: response.data?.success ?? true,
      message: response.data?.message ?? "Feriado removido com sucesso",
    } as HolidayDeleteResponse;
  }

  // =====================
  // Batch Operations
  // =====================

  async batchCreateHolidays(data: HolidayBatchCreateFormData, _query?: HolidayQueryFormData): Promise<HolidayBatchCreateResponse<Holiday>> {
    const items = ((data as any)?.holidays || []) as HolidayCreateFormData[];
    const success: Holiday[] = [];
    const failed: any[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const r = await this.createHoliday(items[i]);
        if (r.data) success.push(r.data);
      } catch (error: any) {
        failed.push({ index: i, error: error?.message ?? "Erro ao criar feriado", data: items[i] });
      }
    }

    return {
      success: failed.length === 0,
      message: `${success.length} feriado(s) criado(s)`,
      data: {
        success,
        failed,
        totalProcessed: items.length,
        totalSuccess: success.length,
        totalFailed: failed.length,
      },
    } as HolidayBatchCreateResponse<Holiday>;
  }

  async batchUpdateHolidays(data: HolidayBatchUpdateFormData, _query?: HolidayQueryFormData): Promise<HolidayBatchUpdateResponse<Holiday>> {
    const items = ((data as any)?.holidays || []) as Array<{ id: string; data: HolidayUpdateFormData }>;
    const success: Holiday[] = [];
    const failed: any[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const r = await this.updateHoliday(items[i].id, items[i].data);
        if (r.data) success.push(r.data);
      } catch (error: any) {
        failed.push({ index: i, error: error?.message ?? "Erro ao atualizar feriado", data: items[i] });
      }
    }

    return {
      success: failed.length === 0,
      message: `${success.length} feriado(s) atualizado(s)`,
      data: {
        success,
        failed,
        totalProcessed: items.length,
        totalSuccess: success.length,
        totalFailed: failed.length,
      },
    } as HolidayBatchUpdateResponse<Holiday>;
  }

  async batchDeleteHolidays(data: HolidayBatchDeleteFormData, _query?: HolidayQueryFormData): Promise<HolidayBatchDeleteResponse> {
    const ids = ((data as any)?.holidayIds || []) as string[];
    let totalSuccess = 0;
    let totalFailed = 0;

    for (let i = 0; i < ids.length; i++) {
      try {
        await this.deleteHoliday(ids[i]);
        totalSuccess++;
      } catch {
        totalFailed++;
      }
    }

    return {
      success: totalFailed === 0,
      message: `${totalSuccess} feriado(s) removido(s)`,
    } as HolidayBatchDeleteResponse;
  }
}

// =====================
// Export service instance
// =====================

export const holidayService = new HolidayService();

// =====================
// Export individual functions
// =====================

// Query Operations
export const getHolidays = (params?: HolidayGetManyFormData) => holidayService.getHolidays(params);
export const getHolidayById = (id: string, params?: Omit<HolidayGetByIdFormData, "id">) => holidayService.getHolidayById(id, params);

// Mutation Operations
export const createHoliday = (data: HolidayCreateFormData, query?: HolidayQueryFormData) => holidayService.createHoliday(data, query);
export const updateHoliday = (id: string, data: HolidayUpdateFormData, query?: HolidayQueryFormData) => holidayService.updateHoliday(id, data, query);
export const deleteHoliday = (id: string) => holidayService.deleteHoliday(id);

// Batch Operations
export const batchCreateHolidays = (data: HolidayBatchCreateFormData, query?: HolidayQueryFormData) => holidayService.batchCreateHolidays(data, query);
export const batchUpdateHolidays = (data: HolidayBatchUpdateFormData, query?: HolidayQueryFormData) => holidayService.batchUpdateHolidays(data, query);
export const batchDeleteHolidays = (data: HolidayBatchDeleteFormData, query?: HolidayQueryFormData) => holidayService.batchDeleteHolidays(data, query);
