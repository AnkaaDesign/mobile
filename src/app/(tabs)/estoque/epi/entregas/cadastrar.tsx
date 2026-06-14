import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormScreen } from "@/components/screens/form-screen";
import { useFormFlow } from "@/hooks/use-form-flow";
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { usePpeDeliveryMutations } from "@/hooks";
import { useAuth } from "@/contexts/auth-context";
import { getItems, getUsers } from "@/api-client";
import {
  PPE_DELIVERY_STATUS,
  PPE_DELIVERY_STATUS_ORDER,
  CONTRACT_STATUS,
  PPE_TYPE,
  routes,
  SECTOR_PRIVILEGES,
} from "@/constants";
import { ppeDeliveryCreateSchema, type PpeDeliveryCreateFormData } from "@/schemas";
import { mobileRoute } from "@/constants/routes.types";
import { getItemPpeSize } from "@/utils/ppe-size-mapping";
import type { Item, User } from "@/types";

export default function CreatePPEDeliveryScreen() {
  const formKey = useFormScreenKey();
  return <CreatePPEDeliveryScreenInner key={formKey} />;
}

function CreatePPEDeliveryScreenInner() {
  const { user: currentUser } = useAuth();
  const { createAsync } = usePpeDeliveryMutations();

  const form = useForm<PpeDeliveryCreateFormData>({
    resolver: zodResolver(ppeDeliveryCreateSchema),
    defaultValues: {
      itemId: "",
      userId: "",
      quantity: 1,
      status: PPE_DELIVERY_STATUS.APPROVED,
      statusOrder: PPE_DELIVERY_STATUS_ORDER[PPE_DELIVERY_STATUS.APPROVED],
    },
  });

  const selectedUserId = form.watch("userId");
  const selectedUserRef = useRef<User | null>(null);
  const loadedUsersRef = useRef<Map<string, User>>(new Map());

  useEffect(() => {
    if (selectedUserId) {
      const user = loadedUsersRef.current.get(selectedUserId);
      selectedUserRef.current = user || null;
    } else {
      selectedUserRef.current = null;
    }
  }, [selectedUserId]);

  const searchUsers = useCallback(async (search: string, page = 1) => {
    const pageSize = 50;
    try {
      const response = await getUsers({
        take: pageSize,
        skip: (page - 1) * pageSize,
        where: { currentContractStatus: { not: CONTRACT_STATUS.TERMINATED } },
        orderBy: { name: "asc" },
        include: { ppeSize: true },
        searchingFor: search || undefined,
      });
      const users = response.data || [];
      users.forEach((u) => loadedUsersRef.current.set(u.id, u));
      return {
        data: users,
        hasMore: response.meta?.hasNextPage || false,
      };
    } catch {
      return { data: [], hasMore: false };
    }
  }, []);

  const userQueryKey = useMemo(() => ["users", "ppe-delivery-create"], []);
  const getUserValue = useCallback((u: User) => u.id, []);
  const getUserLabel = useCallback((u: User) => u.name, []);

  const searchItems = useCallback(async (search: string) => {
    try {
      const response = await getItems({
        take: 500,
        where: {
          isActive: true,
          // PPE identity = ppeType != null (capability-fields contract)
          ppeType: { not: null },
        },
        include: { measures: true, brands: true },
        searchingFor: search || undefined,
        orderBy: { name: "asc" },
      });

      let items = response.data || [];

      const user = selectedUserRef.current;
      if (user?.ppeSize) {
        const userPpeSize = (user as any).ppeSize;
        items = items.filter((item: Item) => {
          if (!item.ppeType) return true;
          if (item.ppeType === PPE_TYPE.OTHERS) return true;

          const itemSize = getItemPpeSize(item);
          if (!itemSize) return true;

          let userSize: string | null = null;
          if (item.ppeType === PPE_TYPE.SHIRT || item.ppeType === PPE_TYPE.SLEEVES) {
            userSize = userPpeSize?.shirts || userPpeSize?.sleeves || null;
          } else if (item.ppeType === PPE_TYPE.PANTS) {
            userSize = userPpeSize?.pants || null;
          } else if (item.ppeType === PPE_TYPE.BOOTS) {
            userSize = userPpeSize?.boots || null;
          } else if (item.ppeType === PPE_TYPE.GLOVES) {
            userSize = userPpeSize?.gloves || null;
          } else if (item.ppeType === PPE_TYPE.MASK) {
            userSize = userPpeSize?.mask || null;
          } else if (item.ppeType === PPE_TYPE.RAIN_BOOTS) {
            userSize = userPpeSize?.rainBoots || null;
          }

          if (!userSize) return true;
          return itemSize === userSize;
        });
      }

      return {
        data: items,
        hasMore: false,
      };
    } catch {
      return { data: [], hasMore: false };
    }
  }, []);

  const itemQueryKey = useMemo(
    () => ["ppe-items", "delivery-create", selectedUserId || "none"],
    [selectedUserId],
  );

  const getItemValue = useCallback((item: Item) => item.id, []);
  const getItemLabel = useCallback((item: Item) => {
    const itemSize = getItemPpeSize(item);
    const displaySize = itemSize
      ? itemSize.startsWith("SIZE_")
        ? itemSize.replace("SIZE_", "")
        : itemSize
      : null;
    const brandName = (item as any).brands?.map((b: any) => b.name).join(", ") || null;
    return [item.name, brandName, displaySize].filter(Boolean).join(" - ");
  }, []);

  // Foundation patch: useFormFlow accepts a callback directly; no
  // useMutation wrapper needed around the entity-mutation API.
  const flow = useFormFlow<PpeDeliveryCreateFormData, { id: string }>({
    form,
    mutation: async (data) => {
      const result = await createAsync({
        ...data,
        status: PPE_DELIVERY_STATUS.APPROVED,
        statusOrder: PPE_DELIVERY_STATUS_ORDER[PPE_DELIVERY_STATUS.APPROVED],
        reviewedBy: currentUser?.id || null,
      });
      const newId = (result as any)?.data?.id || (result as any)?.id;
      return { id: newId ?? "" };
    },
    successAction: "replace",
    successRoute: (result) =>
      result.id
        ? mobileRoute(routes.inventory.ppe.deliveries.details(result.id))
        : // `as any` avoids unioning two AppRoute values (TS2590 — generated Href union too complex)
          (mobileRoute(routes.inventory.ppe.deliveries.root) as any),
    cancelFallback: mobileRoute(routes.inventory.ppe.deliveries.root),
  });

  return (
    <FormScreen
      title="Nova Entrega de EPI"
      mode="create"
      form={form}
      flow={flow}
      submittingLabel="Cadastrando..."
      submitLabel="Cadastrar Entrega"
      privilege={{ any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <FormCard title="Informações Básicas" icon="IconShield">
        <FormFieldGroup
          label="Colaborador"
          required
          error={form.formState.errors.userId?.message}
        >
          <Controller
            control={form.control}
            name="userId"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Combobox<User>
                async
                queryKey={userQueryKey}
                queryFn={searchUsers}
                minSearchLength={0}
                debounceMs={300}
                value={value || undefined}
                onValueChange={(newValue) => {
                  const id = Array.isArray(newValue) ? newValue[0] : newValue;
                  onChange(id || "");
                  if (id) {
                    selectedUserRef.current = loadedUsersRef.current.get(id) || null;
                  } else {
                    selectedUserRef.current = null;
                  }
                }}
                getOptionValue={getUserValue}
                getOptionLabel={getUserLabel}
                placeholder="Selecione o colaborador"
                searchPlaceholder="Buscar colaborador..."
                emptyText="Nenhum colaborador encontrado"
                searchable
                clearable
                error={error?.message}
              />
            )}
          />
        </FormFieldGroup>

        <FormFieldGroup
          label="Item EPI"
          required
          error={form.formState.errors.itemId?.message}
        >
          <Controller
            control={form.control}
            name="itemId"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Combobox<Item>
                async
                queryKey={itemQueryKey}
                queryFn={searchItems}
                minSearchLength={0}
                debounceMs={300}
                value={value || undefined}
                onValueChange={(newValue) => {
                  const id = Array.isArray(newValue) ? newValue[0] : newValue;
                  onChange(id || "");
                }}
                getOptionValue={getItemValue}
                getOptionLabel={getItemLabel}
                placeholder="Selecione o item"
                searchPlaceholder="Buscar EPI..."
                emptyText="Nenhum EPI encontrado"
                searchable
                clearable
                error={error?.message}
              />
            )}
          />
        </FormFieldGroup>

        <FormFieldGroup
          label="Quantidade"
          required
          error={form.formState.errors.quantity?.message}
        >
          <Controller
            control={form.control}
            name="quantity"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={String(value || 1)}
                onChangeText={(text: string | number | null) => {
                  if (!text) {
                    onChange(1);
                    return;
                  }
                  const numValue = parseInt(String(text));
                  onChange(isNaN(numValue) ? 1 : numValue);
                }}
                onBlur={onBlur}
                placeholder="1"
                error={!!form.formState.errors.quantity}
                keyboardType="number-pad"
              />
            )}
          />
        </FormFieldGroup>
      </FormCard>
    </FormScreen>
  );
}
