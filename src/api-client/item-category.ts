// packages/api-client/src/item-category.ts

import { apiClient } from "./axiosClient";
import { ITEM_CATEGORY_TYPE, ITEM_CATEGORY_LEVEL, ACCOUNTING_TYPE } from '../constants';
import type {
  // Schema types (for parameters)
  ItemCategoryGetManyFormData,
  ItemCategoryGetByIdFormData,
  ItemCategoryCreateFormData,
  ItemCategoryUpdateFormData,
  ItemCategoryBatchCreateFormData,
  ItemCategoryBatchUpdateFormData,
  ItemCategoryBatchDeleteFormData,
  ItemCategoryQueryFormData,
} from '../schemas';
import type {
  // Interface types (for responses)
  ItemCategory,
  ItemCategoryGetUniqueResponse,
  ItemCategoryGetManyResponse,
  ItemCategoryCreateResponse,
  ItemCategoryUpdateResponse,
  ItemCategoryDeleteResponse,
  ItemCategoryBatchCreateResponse,
  ItemCategoryBatchUpdateResponse,
  ItemCategoryBatchDeleteResponse,
} from '../types';

// =====================
// ItemCategory Service Class
// =====================

export class ItemCategoryService {
  private readonly basePath = "/items/categories";

  // =====================
  // Query Operations
  // =====================

  async getItemCategories(params?: ItemCategoryGetManyFormData): Promise<ItemCategoryGetManyResponse> {
    const response = await apiClient.get<ItemCategoryGetManyResponse>(this.basePath, {
      params,
    });
    return response.data;
  }

  async getPpeCategories(): Promise<ItemCategoryGetManyResponse> {
    return this.getItemCategories({
      where: {
        type: {
          equals: ITEM_CATEGORY_TYPE.PPE,
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async getRegularCategories(): Promise<ItemCategoryGetManyResponse> {
    return this.getItemCategories({
      where: {
        type: {
          equals: ITEM_CATEGORY_TYPE.REGULAR,
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async getToolCategories(): Promise<ItemCategoryGetManyResponse> {
    return this.getItemCategories({
      where: {
        type: {
          equals: ITEM_CATEGORY_TYPE.TOOL,
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async getCategoriesByType(type: ITEM_CATEGORY_TYPE): Promise<ItemCategoryGetManyResponse> {
    return this.getItemCategories({
      where: {
        type: {
          equals: type,
        },
      },
      orderBy: {
        typeOrder: "asc",
        name: "asc",
      },
    });
  }

  async getItemCategoryById(id: string, params?: ItemCategoryGetByIdFormData): Promise<ItemCategoryGetUniqueResponse> {
    const response = await apiClient.get<ItemCategoryGetUniqueResponse>(`${this.basePath}/${id}`, {
      params,
    });
    return response.data;
  }

  /**
   * Fetch top-level Categorias (categoryLevel = 1) with their subcategory children.
   * Returns the category tree.
   */
  async getCategoryTree(params?: Partial<ItemCategoryGetManyFormData>): Promise<ItemCategoryGetManyResponse> {
    return this.getItemCategories({
      ...params,
      categoryLevel: ITEM_CATEGORY_LEVEL.CATEGORY,
      include: { children: true, ...(params?.include || {}) },
      orderBy: params?.orderBy ?? { name: "asc" },
    });
  }

  /**
   * Fetch only top-level Categorias (categoryLevel = 1).
   */
  async getRootCategories(params?: Partial<ItemCategoryGetManyFormData>): Promise<ItemCategoryGetManyResponse> {
    return this.getItemCategories({
      ...params,
      categoryLevel: ITEM_CATEGORY_LEVEL.CATEGORY,
      orderBy: params?.orderBy ?? { name: "asc" },
    });
  }

  /**
   * Fetch Subcategorias (categoryLevel = 2) belonging to a given parent Categoria.
   */
  async getSubcategories(parentId: string, params?: Partial<ItemCategoryGetManyFormData>): Promise<ItemCategoryGetManyResponse> {
    return this.getItemCategories({
      ...params,
      parentId,
      categoryLevel: ITEM_CATEGORY_LEVEL.SUBCATEGORY,
      orderBy: params?.orderBy ?? { name: "asc" },
    });
  }

  /**
   * Fetch categories by accounting rollup classification.
   */
  async getCategoriesByAccountingType(accountingType: ACCOUNTING_TYPE, params?: Partial<ItemCategoryGetManyFormData>): Promise<ItemCategoryGetManyResponse> {
    return this.getItemCategories({
      ...params,
      accountingType,
      orderBy: params?.orderBy ?? { name: "asc" },
    });
  }

  // =====================
  // Mutation Operations
  // =====================

  async createItemCategory(data: ItemCategoryCreateFormData, query?: ItemCategoryQueryFormData): Promise<ItemCategoryCreateResponse> {
    const response = await apiClient.post<ItemCategoryCreateResponse>(this.basePath, data, {
      params: query,
    });
    return response.data;
  }

  async updateItemCategory(id: string, data: ItemCategoryUpdateFormData, query?: ItemCategoryQueryFormData): Promise<ItemCategoryUpdateResponse> {
    const response = await apiClient.put<ItemCategoryUpdateResponse>(`${this.basePath}/${id}`, data, {
      params: query,
    });
    return response.data;
  }

  async deleteItemCategory(id: string): Promise<ItemCategoryDeleteResponse> {
    const response = await apiClient.delete<ItemCategoryDeleteResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  // =====================
  // Batch Operations
  // =====================

  async batchCreateItemCategories(data: ItemCategoryBatchCreateFormData, query?: ItemCategoryQueryFormData): Promise<ItemCategoryBatchCreateResponse<ItemCategory>> {
    const response = await apiClient.post<ItemCategoryBatchCreateResponse<ItemCategory>>(`${this.basePath}/batch`, data, {
      params: query,
    });
    return response.data;
  }

  async batchUpdateItemCategories(data: ItemCategoryBatchUpdateFormData, query?: ItemCategoryQueryFormData): Promise<ItemCategoryBatchUpdateResponse<ItemCategory>> {
    const response = await apiClient.put<ItemCategoryBatchUpdateResponse<ItemCategory>>(`${this.basePath}/batch`, data, {
      params: query,
    });
    return response.data;
  }

  async batchDeleteItemCategories(data: ItemCategoryBatchDeleteFormData, query?: ItemCategoryQueryFormData): Promise<ItemCategoryBatchDeleteResponse> {
    const response = await apiClient.delete<ItemCategoryBatchDeleteResponse>(`${this.basePath}/batch`, {
      data,
      params: query,
    });
    return response.data;
  }
}

// =====================
// Export service instance
// =====================

export const itemCategoryService = new ItemCategoryService();

// =====================
// Export individual functions
// =====================

// Query Operations
export const getItemCategories = (params?: ItemCategoryGetManyFormData) => itemCategoryService.getItemCategories(params);
export const getPpeCategories = () => itemCategoryService.getPpeCategories();
export const getRegularCategories = () => itemCategoryService.getRegularCategories();
export const getToolCategories = () => itemCategoryService.getToolCategories();
export const getCategoriesByType = (type: ITEM_CATEGORY_TYPE) => itemCategoryService.getCategoriesByType(type);
export const getCategoryTree = (params?: Partial<ItemCategoryGetManyFormData>) => itemCategoryService.getCategoryTree(params);
export const getRootCategories = (params?: Partial<ItemCategoryGetManyFormData>) => itemCategoryService.getRootCategories(params);
export const getSubcategories = (parentId: string, params?: Partial<ItemCategoryGetManyFormData>) => itemCategoryService.getSubcategories(parentId, params);
export const getCategoriesByAccountingType = (accountingType: ACCOUNTING_TYPE, params?: Partial<ItemCategoryGetManyFormData>) =>
  itemCategoryService.getCategoriesByAccountingType(accountingType, params);
export const getItemCategoryById = (id: string, params?: ItemCategoryGetByIdFormData) => itemCategoryService.getItemCategoryById(id, params);

// Mutation Operations
export const createItemCategory = (data: ItemCategoryCreateFormData, query?: ItemCategoryQueryFormData) => itemCategoryService.createItemCategory(data, query);
export const updateItemCategory = (id: string, data: ItemCategoryUpdateFormData, query?: ItemCategoryQueryFormData) => itemCategoryService.updateItemCategory(id, data, query);
export const deleteItemCategory = (id: string) => itemCategoryService.deleteItemCategory(id);

// Batch Operations
export const batchCreateItemCategories = (data: ItemCategoryBatchCreateFormData, query?: ItemCategoryQueryFormData) => itemCategoryService.batchCreateItemCategories(data, query);
export const batchUpdateItemCategories = (data: ItemCategoryBatchUpdateFormData, query?: ItemCategoryQueryFormData) => itemCategoryService.batchUpdateItemCategories(data, query);
export const batchDeleteItemCategories = (data: ItemCategoryBatchDeleteFormData, query?: ItemCategoryQueryFormData) => itemCategoryService.batchDeleteItemCategories(data, query);
