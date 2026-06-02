import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";

import { getItemCategories } from "@/api-client/item-category";
import { useItemCategoryMutations } from "@/hooks";
import type { ItemCreateFormData, ItemUpdateFormData } from "../../../../schemas";
import { ITEM_CATEGORY_LEVEL, ITEM_CATEGORY_TYPE, ACCOUNTING_TYPE_LABELS } from "@/constants";
import type { ItemCategory } from "@/types";

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface CategorySelectorProps {
  disabled?: boolean;
  required?: boolean;
  initialCategory?: ItemCategory;
  onCategoryChange?: (categoryId: string | undefined) => void;
}

const categorySelect = {
  id: true,
  name: true,
  type: true,
  parentId: true,
  categoryLevel: true,
  accountingType: true,
};

/**
 * Cascading category picker:
 *  - First combobox selects a top-level Categoria (categoryLevel = 1).
 *  - Second combobox selects a Subcategoria (categoryLevel = 2) under that parent.
 *  - The form's `categoryId` is always the leaf Subcategoria id.
 *  - The accountingType rollup of the chosen subcategory is shown as a read-only chip.
 *  - Inline create is offered for subcategories under the selected parent.
 */
export function CategorySelector({ disabled, required, initialCategory, onCategoryChange }: CategorySelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { control } = useFormContext<ItemFormData>();
  const { createAsync } = useItemCategoryMutations();

  // Cache for category lookups (both parents and subcategories)
  const cacheRef = useRef<Map<string, ItemCategory>>(new Map());

  // Derive the initial parent id from the initial leaf subcategory (if any)
  const initialParentId = useMemo(() => {
    if (!initialCategory) return undefined;
    if (initialCategory.categoryLevel === ITEM_CATEGORY_LEVEL.CATEGORY) return initialCategory.id;
    return initialCategory.parentId ?? undefined;
  }, [initialCategory?.id]);

  // Selected parent Categoria (level 1). Local-only state; not part of form data.
  const [parentId, setParentId] = useState<string | undefined>(initialParentId);
  // The selected leaf subcategory, for chip display.
  const [selectedSubcategory, setSelectedSubcategory] = useState<ItemCategory | undefined>(
    initialCategory && initialCategory.categoryLevel === ITEM_CATEGORY_LEVEL.SUBCATEGORY ? initialCategory : undefined,
  );

  // Seed cache with the initial category
  useEffect(() => {
    if (initialCategory) {
      cacheRef.current.set(initialCategory.id, initialCategory);
      if (initialCategory.parent) cacheRef.current.set(initialCategory.parent.id, initialCategory.parent);
    }
  }, [initialCategory?.id]);

  // Resync local selection when initialCategory arrives/changes (edit forms load async).
  // Never let useState(prop) desync on refetch — mirror the resolved parent/leaf here.
  useEffect(() => {
    if (!initialCategory) return;
    setParentId(initialParentId);
    setSelectedSubcategory(
      initialCategory.categoryLevel === ITEM_CATEGORY_LEVEL.SUBCATEGORY ? initialCategory : undefined,
    );
  }, [initialCategory?.id, initialParentId]);

  const initialParentOptions = useMemo<ItemCategory[]>(() => {
    if (initialCategory?.parent) return [initialCategory.parent];
    if (initialCategory?.categoryLevel === ITEM_CATEGORY_LEVEL.CATEGORY) return [initialCategory];
    return [];
  }, [initialCategory?.id]);

  const initialSubOptions = useMemo<ItemCategory[]>(
    () => (initialCategory?.categoryLevel === ITEM_CATEGORY_LEVEL.SUBCATEGORY ? [initialCategory] : []),
    [initialCategory?.id],
  );

  // Search top-level Categorias
  const searchParents = useCallback(async (search: string, page: number = 1): Promise<{ data: ItemCategory[]; hasMore: boolean }> => {
    const params: any = {
      orderBy: { name: "asc" },
      page,
      take: 50,
      categoryLevel: ITEM_CATEGORY_LEVEL.CATEGORY,
      select: categorySelect,
    };
    if (search && search.trim()) params.searchingFor = search.trim();

    try {
      const response = await getItemCategories(params);
      const categories = response.data || [];
      categories.forEach((cat) => cacheRef.current.set(cat.id, cat));
      return { data: categories, hasMore: response.meta?.hasNextPage || false };
    } catch (error) {
      console.error("[CategorySelector] Error fetching parent categories:", error);
      return { data: [], hasMore: false };
    }
  }, []);

  // Search Subcategorias under the currently-selected parent
  const searchSubcategories = useCallback(
    async (search: string, page: number = 1): Promise<{ data: ItemCategory[]; hasMore: boolean }> => {
      if (!parentId) return { data: [], hasMore: false };
      const params: any = {
        orderBy: { name: "asc" },
        page,
        take: 50,
        parentId,
        categoryLevel: ITEM_CATEGORY_LEVEL.SUBCATEGORY,
        select: categorySelect,
      };
      if (search && search.trim()) params.searchingFor = search.trim();

      try {
        const response = await getItemCategories(params);
        const categories = response.data || [];
        categories.forEach((cat) => cacheRef.current.set(cat.id, cat));
        return { data: categories, hasMore: response.meta?.hasNextPage || false };
      } catch (error) {
        console.error("[CategorySelector] Error fetching subcategories:", error);
        return { data: [], hasMore: false };
      }
    },
    [parentId],
  );

  const getOptionLabel = useCallback((category: ItemCategory) => category.name, []);
  const getOptionValue = useCallback((category: ItemCategory) => category.id, []);

  // Resolve the selected parent's type from cache (for inheriting on create)
  const parentCacheType = () => (parentId ? cacheRef.current.get(parentId)?.type : undefined);

  // Create a new Subcategoria under the selected parent
  const handleCreateSubcategory = async (name: string) => {
    if (!parentId) return undefined;
    setIsCreating(true);
    try {
      // Inherit the parent's type (defaults to REGULAR if unknown)
      const parentType = parentCacheType() ?? ITEM_CATEGORY_TYPE.REGULAR;
      const result = await createAsync({
        name,
        type: parentType,
        parentId,
        categoryLevel: ITEM_CATEGORY_LEVEL.SUBCATEGORY,
      });
      if (result.success && result.data) {
        cacheRef.current.set(result.data.id, result.data);
        return result.data.id;
      }
    } finally {
      setIsCreating(false);
    }
    return undefined;
  };

  const accountingType = selectedSubcategory?.accountingType ?? selectedSubcategory?.parent?.accountingType ?? null;
  const accountingLabel = accountingType ? ACCOUNTING_TYPE_LABELS[accountingType] : undefined;

  return (
    <Controller
      control={control}
      name="categoryId"
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const handleSubSelect = (selectedValue: string | string[] | null | undefined) => {
          const singleValue = Array.isArray(selectedValue) ? selectedValue[0] : selectedValue;
          const newValue = singleValue === "" ? null : singleValue ?? null;
          onChange(newValue);
          const sub = newValue ? cacheRef.current.get(newValue) : undefined;
          setSelectedSubcategory(sub);
          onCategoryChange?.(sub?.id || (newValue ?? undefined) || undefined);
        };

        return (
          <View style={{ gap: 12 }}>
            {/* Parent Categoria */}
            <View style={{ gap: 8 }}>
              <Label nativeID="categoryParent" style={{ marginBottom: 4 }}>
                Categoria {required && <ThemedText variant="destructive">*</ThemedText>}
              </Label>
              <Combobox<ItemCategory>
                value={parentId || ""}
                onValueChange={(selectedValue) => {
                  const singleValue = Array.isArray(selectedValue) ? selectedValue[0] : selectedValue;
                  const newParent = singleValue === "" ? undefined : singleValue ?? undefined;
                  setParentId(newParent);
                  // Reset the leaf subcategory whenever the parent changes
                  onChange(null);
                  setSelectedSubcategory(undefined);
                  onCategoryChange?.(undefined);
                }}
                async={true}
                queryKey={["item-categories", "parents"]}
                queryFn={searchParents}
                initialOptions={initialParentOptions}
                getOptionLabel={getOptionLabel}
                getOptionValue={getOptionValue}
                placeholder="Selecione uma categoria"
                searchPlaceholder="Buscar categoria..."
                emptyText="Nenhuma categoria encontrada"
                disabled={disabled || isCreating}
                clearable={!required}
                minSearchLength={0}
                pageSize={50}
                debounceMs={300}
              />
            </View>

            {/* Subcategoria (leaf) */}
            <View style={{ gap: 8 }}>
              <Label nativeID="categoryId" style={{ marginBottom: 4 }}>
                Subcategoria {required && <ThemedText variant="destructive">*</ThemedText>}
              </Label>
              <Combobox<ItemCategory>
                key={parentId || "no-parent"}
                value={value || ""}
                onValueChange={handleSubSelect}
                async={true}
                queryKey={["item-categories", "subcategories", parentId || "none"]}
                queryFn={searchSubcategories}
                initialOptions={initialSubOptions}
                getOptionLabel={getOptionLabel}
                getOptionValue={getOptionValue}
                placeholder={parentId ? "Selecione uma subcategoria" : "Selecione uma categoria primeiro"}
                searchPlaceholder="Buscar subcategoria..."
                emptyText="Nenhuma subcategoria encontrada"
                disabled={disabled || isCreating || !parentId}
                error={error?.message}
                clearable={!required}
                minSearchLength={0}
                pageSize={50}
                debounceMs={300}
                onCreate={
                  parentId
                    ? async (name: string) => {
                        const newId = await handleCreateSubcategory(name);
                        if (newId) {
                          onChange(newId);
                          setSelectedSubcategory(cacheRef.current.get(newId));
                          onCategoryChange?.(newId);
                        }
                      }
                    : undefined
                }
                createLabel={(name: string) => `Criar subcategoria "${name}"`}
                isCreating={isCreating}
              />
            </View>

            {/* Read-only accounting rollup chip */}
            {accountingLabel ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ThemedText variant="muted" style={{ fontSize: 12 }}>
                  Classificação contábil:
                </ThemedText>
                <Badge variant="secondary">{accountingLabel}</Badge>
              </View>
            ) : null}
          </View>
        );
      }}
    />
  );
}
