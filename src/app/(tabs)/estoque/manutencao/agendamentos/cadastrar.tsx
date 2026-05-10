import { useMemo } from "react";
import { Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormScreen } from "@/components/screens/form-screen";
import { useFormFlow } from "@/hooks/use-form-flow";
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { useItems } from "@/hooks/useItem";
import { mobileRoute } from "@/constants/routes.types";
import { routes, SCHEDULE_FREQUENCY_LABELS, SECTOR_PRIVILEGES } from "@/constants";

const maintenanceScheduleCreateSchema = z.object({
  itemId: z.string().min(1, "Item é obrigatório"),
  frequency: z.string().min(1, "Frequência é obrigatória"),
  frequencyCount: z.number().min(1, "Intervalo é obrigatório"),
  nextRun: z.date().optional(),
});

type MaintenanceScheduleCreateFormData = z.infer<typeof maintenanceScheduleCreateSchema>;

export default function MaintenanceScheduleCreateScreen() {
  const formKey = useFormScreenKey();
  return <MaintenanceScheduleCreateScreenInner key={formKey} />;
}

function MaintenanceScheduleCreateScreenInner() {
  const { data: items } = useItems({
    orderBy: { name: "asc" },
    limit: 100,
  });

  const form = useForm<MaintenanceScheduleCreateFormData>({
    resolver: zodResolver(maintenanceScheduleCreateSchema),
    defaultValues: {
      itemId: "",
      frequency: "WEEKLY",
      frequencyCount: 1,
      nextRun: new Date(),
    },
  });

  // Mock mutation — wire to real API once available. Surfaces a success
  // alert and lets <FormScreen> drive navigation through useFormFlow.
  // Foundation patch: useFormFlow accepts a callback directly, no useMutation wrapper.
  const flow = useFormFlow<MaintenanceScheduleCreateFormData, { id: string }>({
    form,
    mutation: async (_data) => {
      Alert.alert("Sucesso", "Agendamento criado com sucesso");
      return { id: "" };
    },
    successRoute: () => mobileRoute(routes.inventory.maintenance.schedules.root),
    cancelFallback: mobileRoute(routes.inventory.maintenance.schedules.root),
  });

  const itemOptions: ComboboxOption[] = useMemo(
    () =>
      items?.data?.map((item) => ({
        value: item.id,
        label: item.name,
      })) || [],
    [items?.data],
  );

  const frequencyOptions: ComboboxOption[] = useMemo(
    () =>
      Object.entries(SCHEDULE_FREQUENCY_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  );

  return (
    <FormScreen
      title="Novo Agendamento"
      mode="create"
      form={form}
      flow={flow}
      submittingLabel="Salvando..."
      submitLabel="Criar Agendamento"
      privilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <FormCard title="Novo Agendamento" icon="IconTool">
        <FormFieldGroup
          label="Item/Equipamento"
          required
          error={form.formState.errors.itemId?.message}
        >
          <Controller
            control={form.control}
            name="itemId"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Combobox
                options={itemOptions}
                value={value}
                onValueChange={onChange}
                placeholder="Selecione o item"
                searchable
                clearable={false}
                error={error?.message}
              />
            )}
          />
        </FormFieldGroup>

        <FormFieldGroup
          label="Frequência"
          required
          error={form.formState.errors.frequency?.message}
        >
          <Controller
            control={form.control}
            name="frequency"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Combobox
                options={frequencyOptions}
                value={value}
                onValueChange={onChange}
                placeholder="Selecione a frequência"
                searchable={false}
                clearable={false}
                error={error?.message}
              />
            )}
          />
        </FormFieldGroup>

        <FormFieldGroup
          label="Intervalo"
          required
          error={form.formState.errors.frequencyCount?.message}
        >
          <Controller
            control={form.control}
            name="frequencyCount"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={String(value || 1)}
                onChangeText={(val) => {
                  if (!val) {
                    onChange(1);
                    return;
                  }
                  const numValue = parseInt(String(val));
                  onChange(isNaN(numValue) || numValue < 1 ? 1 : numValue);
                }}
                onBlur={onBlur}
                placeholder="Digite o intervalo"
                keyboardType="numeric"
              />
            )}
          />
        </FormFieldGroup>

        <FormFieldGroup
          label="Próxima Execução"
          error={form.formState.errors.nextRun?.message}
        >
          <Controller
            control={form.control}
            name="nextRun"
            render={({ field: { onChange, value } }) => (
              <DatePicker
                value={value}
                onChange={onChange}
                placeholder="Selecione a data"
                type="datetime"
              />
            )}
          />
        </FormFieldGroup>
      </FormCard>
    </FormScreen>
  );
}
