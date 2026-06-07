import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormScreen } from "@/components/screens/form-screen";
import { useFormFlow } from "@/hooks/use-form-flow";
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { usePpeDeliveryScheduleMutations } from "@/hooks";
import { mobileRoute } from "@/constants/routes.types";
import {
  routes,
  SCHEDULE_FREQUENCY,
  ASSIGNMENT_TYPE,
  PPE_TYPE,
  SECTOR_PRIVILEGES,
} from "@/constants";
import {
  SCHEDULE_FREQUENCY_LABELS,
  ASSIGNMENT_TYPE_LABELS,
  PPE_TYPE_LABELS,
} from "@/constants/enum-labels";

interface PpeScheduleCreateForm {
  name: string;
  frequency: SCHEDULE_FREQUENCY;
  frequencyCount: number;
  assignmentType: ASSIGNMENT_TYPE;
  ppeTypes: string[];
  isActive: boolean;
}

export default function CreatePPEScheduleScreen() {
  const formKey = useFormScreenKey();
  return <CreatePPEScheduleScreenInner key={formKey} />;
}

function CreatePPEScheduleScreenInner() {
  const { createAsync } = usePpeDeliveryScheduleMutations();

  const form = useForm<PpeScheduleCreateForm>({
    defaultValues: {
      name: "",
      frequency: SCHEDULE_FREQUENCY.MONTHLY,
      frequencyCount: 1,
      assignmentType: ASSIGNMENT_TYPE.ALL,
      ppeTypes: [],
      isActive: true,
    },
  });

  const flow = useFormFlow<PpeScheduleCreateForm, { id: string }>({
    form,
    mutation: async (data) => {
      const result = await createAsync({
        name: data.name,
        frequency: data.frequency,
        frequencyCount: data.frequencyCount,
        assignmentType: data.assignmentType,
        isActive: data.isActive,
        excludedUserIds: [],
        includedUserIds: [],
        customMonths: [],
        rescheduleCount: 0,
        items: (data.ppeTypes || [])
          .filter((t) => t !== PPE_TYPE.OTHERS)
          .map((ppeType) => ({ ppeType: ppeType as PPE_TYPE, quantity: 1 })),
      });
      const newId = (result as any)?.data?.id || (result as any)?.id;
      return { id: newId ?? "" };
    },
    successAction: "replace",
    successRoute: (result) =>
      result.id
        ? mobileRoute(routes.inventory.ppe.schedules.details(result.id))
        : mobileRoute(routes.inventory.ppe.schedules.root),
    cancelFallback: mobileRoute(routes.inventory.ppe.schedules.root),
  });

  const frequencyOptions: ComboboxOption[] = useMemo(
    () =>
      Object.entries(SCHEDULE_FREQUENCY_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  );

  const assignmentTypeOptions: ComboboxOption[] = useMemo(
    () =>
      Object.entries(ASSIGNMENT_TYPE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  );

  const ppeTypeOptions: ComboboxOption[] = useMemo(
    () =>
      Object.entries(PPE_TYPE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  );

  return (
    <FormScreen
      title="Novo Agendamento de EPI"
      mode="create"
      form={form}
      flow={flow}
      submittingLabel="Salvando..."
      submitLabel="Criar Agendamento"
      privilege={{ any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <FormCard title="Informações Básicas" icon="IconCalendar">
        <FormFieldGroup
          label="Nome do Agendamento"
          required
          error={form.formState.errors.name?.message as string | undefined}
        >
          <Controller
            control={form.control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value || ""}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Digite o nome do agendamento"
                error={!!form.formState.errors.name}
              />
            )}
          />
        </FormFieldGroup>

        <FormFieldGroup label="Status">
          <Controller
            control={form.control}
            name="isActive"
            render={({ field: { onChange, value } }) => (
              <Switch checked={value} onCheckedChange={onChange} />
            )}
          />
        </FormFieldGroup>
      </FormCard>

      <FormCard title="Configuração de Frequência" icon="IconClock">
        <FormFieldGroup
          label="Frequência"
          required
          error={form.formState.errors.frequency?.message as string | undefined}
        >
          <Controller
            control={form.control}
            name="frequency"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Combobox
                options={frequencyOptions}
                value={value || undefined}
                onValueChange={onChange}
                placeholder="Selecione a frequência"
                searchable={false}
                error={error?.message}
              />
            )}
          />
        </FormFieldGroup>

        <FormFieldGroup
          label="Quantidade"
          error={form.formState.errors.frequencyCount?.message as string | undefined}
        >
          <Controller
            control={form.control}
            name="frequencyCount"
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
                error={!!form.formState.errors.frequencyCount}
                keyboardType="number-pad"
              />
            )}
          />
        </FormFieldGroup>

        <FormFieldGroup
          label="Tipo de Atribuição"
          required
          error={form.formState.errors.assignmentType?.message as string | undefined}
        >
          <Controller
            control={form.control}
            name="assignmentType"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Combobox
                options={assignmentTypeOptions}
                value={value || undefined}
                onValueChange={onChange}
                placeholder="Selecione o tipo"
                searchable={false}
                error={error?.message}
              />
            )}
          />
        </FormFieldGroup>
      </FormCard>

      <FormCard title="Tipos de EPI" icon="IconShield">
        <FormFieldGroup
          label="Selecione os tipos de EPI"
          error={form.formState.errors.ppeTypes?.message as string | undefined}
        >
          <Controller
            control={form.control}
            name="ppeTypes"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Combobox
                options={ppeTypeOptions}
                value={value?.[0] || undefined}
                onValueChange={(val) => onChange(val ? [val] : [])}
                placeholder="Selecione os tipos"
                searchable={false}
                clearable
                error={error?.message}
              />
            )}
          />
        </FormFieldGroup>
      </FormCard>
    </FormScreen>
  );
}
