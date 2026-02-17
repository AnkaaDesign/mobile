import { useQuery } from "@tanstack/react-query";
import {
  getItemCategories,
  getItemBrands,
  getSuppliers,
  getUsers,
  getCustomers,
  getSectors,
  getPaints,
  getPaintFormulas,
  getItems,
  getFiles,
  getObservations,
  getTrucks,
} from "@/api-client";

interface EntityDetails {
  categories: Map<string, string>;
  brands: Map<string, string>;
  suppliers: Map<string, string>;
  users: Map<string, string>;
  customers: Map<string, string>;
  sectors: Map<string, string>;
  paints: Map<string, any>; // Store full paint objects with hex, finish, brand, etc.
  formulas: Map<string, string>;
  items: Map<string, string>;
  files: Map<string, string>;
  observations: Map<string, string>;
  trucks: Map<string, string>;
}

export function useEntityDetails(entityIds: {
  categoryIds?: string[];
  brandIds?: string[];
  supplierIds?: string[];
  userIds?: string[];
  customerIds?: string[];
  sectorIds?: string[];
  paintIds?: string[];
  formulaIds?: string[];
  itemIds?: string[];
  fileIds?: string[];
  observationIds?: string[];
  truckIds?: string[];
}) {
  const uniqueCategoryIds = [...new Set(entityIds.categoryIds || [])].filter(Boolean);
  const uniqueBrandIds = [...new Set(entityIds.brandIds || [])].filter(Boolean);
  const uniqueSupplierIds = [...new Set(entityIds.supplierIds || [])].filter(Boolean);
  const uniqueUserIds = [...new Set(entityIds.userIds || [])].filter(Boolean);
  const uniqueCustomerIds = [...new Set(entityIds.customerIds || [])].filter(Boolean);
  const uniqueSectorIds = [...new Set(entityIds.sectorIds || [])].filter(Boolean);
  const uniquePaintIds = [...new Set(entityIds.paintIds || [])].filter(Boolean);
  const uniqueFormulaIds = [...new Set(entityIds.formulaIds || [])].filter(Boolean);
  const uniqueItemIds = [...new Set(entityIds.itemIds || [])].filter(Boolean);
  const uniqueFileIds = [...new Set(entityIds.fileIds || [])].filter(Boolean);
  const uniqueObservationIds = [...new Set(entityIds.observationIds || [])].filter(Boolean);
  const uniqueTruckIds = [...new Set(entityIds.truckIds || [])].filter(Boolean);

  return useQuery({
    queryKey: [
      "entity-details",
      uniqueCategoryIds,
      uniqueBrandIds,
      uniqueSupplierIds,
      uniqueUserIds,
      uniqueCustomerIds,
      uniqueSectorIds,
      uniquePaintIds,
      uniqueFormulaIds,
      uniqueItemIds,
      uniqueFileIds,
      uniqueObservationIds,
      uniqueTruckIds,
    ],
    queryFn: async () => {
      const details: EntityDetails = {
        categories: new Map(),
        brands: new Map(),
        suppliers: new Map(),
        users: new Map(),
        customers: new Map(),
        sectors: new Map(),
        paints: new Map(),
        formulas: new Map(),
        items: new Map(),
        files: new Map(),
        observations: new Map(),
        trucks: new Map(),
      };

      const promises: Promise<void>[] = [];

      // Batch fetch categories
      if (uniqueCategoryIds.length > 0) {
        promises.push(
          (async () => {
            try {
              const response = await getItemCategories({
                where: { id: { in: uniqueCategoryIds } },
                select: { id: true, name: true },
                limit: uniqueCategoryIds.length,
              } as any);
              if (response?.data) {
                response.data.forEach((cat: any) => {
                  details.categories.set(cat.id, cat.name);
                });
              }
            } catch (error) {
              console.error("Failed to fetch categories batch:", error);
            }
          })()
        );
      }

      // Batch fetch brands
      if (uniqueBrandIds.length > 0) {
        promises.push(
          (async () => {
            try {
              const response = await getItemBrands({
                where: { id: { in: uniqueBrandIds } },
                select: { id: true, name: true },
                limit: uniqueBrandIds.length,
              } as any);
              if (response?.data) {
                response.data.forEach((brand: any) => {
                  details.brands.set(brand.id, brand.name);
                });
              }
            } catch (error) {
              console.error("Failed to fetch brands batch:", error);
            }
          })()
        );
      }

      // Batch fetch suppliers
      if (uniqueSupplierIds.length > 0) {
        promises.push(
          (async () => {
            try {
              const response = await getSuppliers({
                where: { id: { in: uniqueSupplierIds } },
                select: { id: true, fantasyName: true },
                limit: uniqueSupplierIds.length,
              } as any);
              if (response?.data) {
                response.data.forEach((supplier: any) => {
                  details.suppliers.set(supplier.id, supplier.fantasyName || "");
                });
              }
            } catch (error) {
              console.error("Failed to fetch suppliers batch:", error);
            }
          })()
        );
      }

      // Batch fetch users
      if (uniqueUserIds.length > 0) {
        promises.push(
          (async () => {
            try {
              const response = await getUsers({
                where: { id: { in: uniqueUserIds } },
                select: { id: true, name: true },
                limit: uniqueUserIds.length,
              } as any);
              if (response?.data) {
                response.data.forEach((user: any) => {
                  details.users.set(user.id, user.name);
                });
              }
            } catch (error) {
              console.error("Failed to fetch users batch:", error);
            }
          })()
        );
      }

      // Batch fetch customers
      if (uniqueCustomerIds.length > 0) {
        promises.push(
          (async () => {
            try {
              const response = await getCustomers({
                where: { id: { in: uniqueCustomerIds } },
                select: { id: true, fantasyName: true, name: true },
                limit: uniqueCustomerIds.length,
              } as any);
              if (response?.data) {
                response.data.forEach((c: any) => {
                  details.customers.set(c.id, c.fantasyName || c.name || `Cliente ${c.id.slice(0, 8)}`);
                });
              }
            } catch (error) {
              console.error("Failed to fetch customers batch:", error);
            }
          })()
        );
      }

      // Batch fetch sectors
      if (uniqueSectorIds.length > 0) {
        promises.push(
          (async () => {
            try {
              const response = await getSectors({
                where: { id: { in: uniqueSectorIds } },
                select: { id: true, name: true },
                limit: uniqueSectorIds.length,
              } as any);
              if (response?.data) {
                response.data.forEach((sector: any) => {
                  details.sectors.set(sector.id, sector.name || "");
                });
              }
            } catch (error) {
              console.error("Failed to fetch sectors batch:", error);
            }
          })()
        );
      }

      // Batch fetch paints with full details (hex, finish, brand, type)
      if (uniquePaintIds.length > 0) {
        promises.push(
          (async () => {
            try {
              const response = await getPaints({
                where: { id: { in: uniquePaintIds } },
                select: {
                  id: true,
                  name: true,
                  code: true,
                  hexColor: true,
                  finish: true,
                  paintBrand: { select: { id: true, name: true } },
                  paintType: { select: { id: true, name: true } },
                },
                limit: uniquePaintIds.length,
              } as any);
              if (response?.data) {
                response.data.forEach((paint: any) => {
                  details.paints.set(paint.id, paint);
                });
              }
            } catch (error) {
              console.error("Failed to fetch paints batch:", error);
            }
          })()
        );
      }

      // Batch fetch formulas
      if (uniqueFormulaIds.length > 0) {
        promises.push(
          (async () => {
            try {
              const response = await getPaintFormulas({
                where: { id: { in: uniqueFormulaIds } },
                select: { id: true, description: true, code: true },
                limit: uniqueFormulaIds.length,
              } as any);
              if (response?.data) {
                response.data.forEach((formula: any) => {
                  details.formulas.set(formula.id, formula.description || formula.code || `Fórmula ${formula.id.slice(0, 8)}`);
                });
              }
            } catch (error) {
              console.error("Failed to fetch formulas batch:", error);
            }
          })()
        );
      }

      // Batch fetch items
      if (uniqueItemIds.length > 0) {
        promises.push(
          (async () => {
            try {
              const response = await getItems({
                where: { id: { in: uniqueItemIds } },
                select: { id: true, name: true },
                limit: uniqueItemIds.length,
              } as any);
              if (response?.data) {
                response.data.forEach((item: any) => {
                  details.items.set(item.id, item.name || "");
                });
              }
            } catch (error) {
              console.error("Failed to fetch items batch:", error);
            }
          })()
        );
      }

      // Batch fetch files
      if (uniqueFileIds.length > 0) {
        promises.push(
          (async () => {
            try {
              const response = await getFiles({
                where: { id: { in: uniqueFileIds } },
                limit: uniqueFileIds.length,
              } as any);
              if (response?.data) {
                response.data.forEach((file: any) => {
                  details.files.set(file.id, file.filename || "");
                });
              }
            } catch (error) {
              console.error("Failed to fetch files batch:", error);
            }
          })()
        );
      }

      // Batch fetch observations
      if (uniqueObservationIds.length > 0) {
        promises.push(
          (async () => {
            try {
              const response = await getObservations({
                where: { id: { in: uniqueObservationIds } },
                limit: uniqueObservationIds.length,
              } as any);
              if (response?.data) {
                response.data.forEach((obs: any) => {
                  details.observations.set(obs.id, obs.content || obs.description || `Observação ${obs.id.slice(0, 8)}`);
                });
              }
            } catch (error) {
              console.error("Failed to fetch observations batch:", error);
            }
          })()
        );
      }

      // Batch fetch trucks
      if (uniqueTruckIds.length > 0) {
        promises.push(
          (async () => {
            try {
              const response = await getTrucks({
                where: { id: { in: uniqueTruckIds } },
                select: { id: true, plate: true, model: true },
                limit: uniqueTruckIds.length,
              } as any);
              if (response?.data) {
                response.data.forEach((truck: any) => {
                  details.trucks.set(truck.id, truck.plate || truck.model || `Caminhão ${truck.id.slice(0, 8)}`);
                });
              }
            } catch (error) {
              console.error("Failed to fetch trucks batch:", error);
            }
          })()
        );
      }

      await Promise.all(promises);

      return details;
    },
    enabled:
      uniqueCategoryIds.length > 0 ||
      uniqueBrandIds.length > 0 ||
      uniqueSupplierIds.length > 0 ||
      uniqueUserIds.length > 0 ||
      uniqueCustomerIds.length > 0 ||
      uniqueSectorIds.length > 0 ||
      uniquePaintIds.length > 0 ||
      uniqueFormulaIds.length > 0 ||
      uniqueItemIds.length > 0 ||
      uniqueFileIds.length > 0 ||
      uniqueObservationIds.length > 0 ||
      uniqueTruckIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    structuralSharing: false, // Prevent React Query from serializing Maps
  });
}
