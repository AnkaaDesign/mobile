import { useEffect, useMemo } from "react";
import { Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormScreen } from "@/components/screens/form-screen";
import { useFormFlow } from "@/hooks/use-form-flow";
import { usePpeDeliveryMutations, usePpeDelivery } from "@/hooks";
import { useAuth } from "@/contexts/auth-context";
import {
  PPE_DELIVERY_STATUS,
  PPE_DELIVERY_STATUS_ORDER,
  SECTOR_PRIVILEGES,
  routes,
} from "@/constants";
import { PPE_DELIVERY_STATUS_LABELS } from "@/constants/enum-labels";
import {
  ppeDeliveryUpdateSchema,
  mapPpeDeliveryToFormData,
  type PpeDeliveryUpdateFormData,
} from "@/schemas";
import { hasPrivilege } from "@/utils";
import { mobileRoute } from "@/constants/routes.types";
import { EDITABLE_PPE_DELIVERY_STATUSES } from "@/constants/editable-statuses";

export default function EditPPEDeliveryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditPPEDeliveryScreenInner key={id} />;
}

function EditPPEDeliveryScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { updateAsync } = usePpeDeliveryMutations();

  const loadQuery = usePpeDelivery(id, {
    include: { item: true, user: true },
  });

  const form = useForm<PpeDeliveryUpdateFormData>({
    resolver: zodResolver(ppeDeliveryUpdateSchema),
    defaultValues: {
      quantity: 0,
      status: PPE_DELIVERY_STATUS.PENDING,
    },
  });

  // Reset form when delivery data loads.
  useEffect(() => {
    if (loadQuery.data?.data) {
      const formData = mapPpeDeliveryToFormData(loadQuery.data.data);
      form.reset(formData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadQuery.data?.data]);

  // Auto-set actualDeliveryDate when status changes to DELIVERED.
  const watchedStatus = form.watch("status");
  useEffect(() => {
    if (watchedStatus === PPE_DELIVERY_STATUS.DELIVERED) {
      form.setValue("actualDeliveryDate", new Date(), { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedStatus]);

  const canEditStatus = hasPrivilege(currentUser, SECTOR_PRIVILEGES.WAREHOUSE);

  const statusOptions: ComboboxOption[] = useMemo(
    () =>
      Object.entries(PPE_DELIVERY_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  );

  const mutation = useMutation<{ id: string }, unknown, PpeDeliveryUpdateFormData>({
    mutationFn: async (data) => {
      if (!id) {
        Alert.alert("Erro", "ID de entrega não encontrado");
        throw new Error("missing id");
      }
      const submitData: PpeDeliveryUpdateFormData & { statusOrder?: number } = { ...data };
      if (data.status) {
        submitData.statusOrder = PPE_DELIVERY_STATUS_ORDER[data.status];
      }
      await updateAsync({ id, data: submitData });
      return { id };
    },
    onError: (err: any) => {
      Alert.alert("Erro", err?.message || "Ocorreu um erro ao atualizar a entrega de EPI");
    },
  });

  const flow = useFormFlow({
    form,
    mutation,
    successAction: "replace",
    successRoute: (result) =>
      mobileRoute(routes.inventory.ppe.deliveries.details(result.id)),
    cancelFallback: mobileRoute(routes.inventory.ppe.deliveries.root),
  });

  return (
    <FormScreen
      title="Editar Entrega de EPI"
      mode="edit"
      form={form}
      flow={flow}
      loadQuery={loadQuery}
      editGuard={{ editable: EDITABLE_PPE_DELIVERY_STATUSES }}
      submittingLabel="Salvando..."
      submitLabel="Salvar"
      privilege={{ any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <FormCard title="Informações Básicas" icon="IconShield">
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
                value={String(value || 0)}
                onChangeText={(text) => {
                  if (!text) {
                    onChange(0);
                    return;
                  }
                  const numValue = parseInt(String(text));
                  onChange(isNaN(numValue) ? 0 : numValue);
                }}
                onBlur={onBlur}
                placeholder="0"
                error={!!form.formState.errors.quantity}
                keyboardType="number-pad"
              />
            )}
          />
        </FormFieldGroup>

        {canEditStatus && (
          <FormFieldGroup label="Status" error={form.formState.errors.status?.message}>
            <Controller
              control={form.control}
              name="status"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Combobox
                  options={statusOptions}
                  value={value || undefined}
                  onValueChange={onChange}
                  placeholder="Selecione o status"
                  searchable={false}
                  clearable
                  error={error?.message}
                />
              )}
            />
          </FormFieldGroup>
        )}
      </FormCard>
    </FormScreen>
  );
}
