import { useQuery } from "@tanstack/react-query";
import { getItemCategoryById, getItemBrandById, getSupplierById, getUserById } from '@/api-client';

interface EntityDetails {
  categories: Map<string, string>;
  brands: Map<string, string>;
  suppliers: Map<string, string>;
  users: Map<string, string>;
}

export function useEntityDetails(entityIds: { categoryIds?: string[]; brandIds?: string[]; supplierIds?: string[]; userIds?: string[] }) {
  const uniqueCategoryIds = [...new Set(entityIds.categoryIds || [])].filter(Boolean);
  const uniqueBrandIds = [...new Set(entityIds.brandIds || [])].filter(Boolean);
  const uniqueSupplierIds = [...new Set(entityIds.supplierIds || [])].filter(Boolean);
  const uniqueUserIds = [...new Set(entityIds.userIds || [])].filter(Boolean);

  return useQuery({
    queryKey: ["entity-details", uniqueCategoryIds, uniqueBrandIds, uniqueSupplierIds, uniqueUserIds],
    queryFn: async () => {
      const details: EntityDetails = {
        categories: new Map(),
        brands: new Map(),
        suppliers: new Map(),
        users: new Map(),
      };

      // Fetch all categories
      const categoryPromises = uniqueCategoryIds.map(async (id) => {
        try {
          const response = await getItemCategoryById(id);
          if (response?.success && response.data) {
            details.categories.set(id, response.data.name);
          }
        } catch (error) {
          console.error(`Failed to fetch category ${id}:`, error);
        }
      });

      // Fetch all brands
      const brandPromises = uniqueBrandIds.map(async (id) => {
        try {
          const response = await getItemBrandById(id);
          if (response?.success && response.data) {
            details.brands.set(id, response.data.name);
          }
        } catch (error) {
          console.error(`Failed to fetch brand ${id}:`, error);
        }
      });

      // Fetch all suppliers
      const supplierPromises = uniqueSupplierIds.map(async (id) => {
        try {
          const response = await getSupplierById(id);
          if (response?.success && response.data) {
            details.suppliers.set(id, response.data.fantasyName || response.data.name);
          }
        } catch (error) {
          console.error(`Failed to fetch supplier ${id}:`, error);
        }
      });

      // Fetch all users
      const userPromises = uniqueUserIds.map(async (id) => {
        try {
          const response = await getUserById(id);
          if (response?.success && response.data) {
            details.users.set(id, response.data.name);
          }
        } catch (error) {
          console.error(`Failed to fetch user ${id}:`, error);
        }
      });

      await Promise.all([...categoryPromises, ...brandPromises, ...supplierPromises, ...userPromises]);

      // Ensure Maps are properly returned
      return {
        categories: details.categories,
        brands: details.brands,
        suppliers: details.suppliers,
        users: details.users,
      };
    },
    enabled: uniqueCategoryIds.length > 0 || uniqueBrandIds.length > 0 || uniqueSupplierIds.length > 0 || uniqueUserIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    structuralSharing: false, // Prevent React Query from serializing Maps
  });
}
