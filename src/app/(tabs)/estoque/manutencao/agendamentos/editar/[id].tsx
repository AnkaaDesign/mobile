import { useMemo } from "react";
import { Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams } from "expo-router";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormScreen } from "@/components/screens/form-screen";
import { useFormFlow } from "@/hooks/use-form-flow";
import { useMaintenance } from "@/hooks/useMaintenance";
import { useItems } from "@/hooks/useItem";
import { mobileRoute } from "@/constants/routes.types";
import { routes, SCHEDULE_FREQUENCY_LABELS, SECTOR_PRIVILEGES } from "@/constants";

const maintenanceScheduleUpdateSchema = z.object({
  itemId: z.string().min(1, "Item é obrigatório"),
  frequency: z.string().min(1, "Frequência é obrigatória"),
  frequencyCount: z.number().min(1, "Intervalo é obrigatório"),
  nextRun: z.date().optional(),
});

type MaintenanceScheduleUpdateFormData = z.infer<typeof maintenanceScheduleUpdateSchema>;

export default function MaintenanceScheduleEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MaintenanceScheduleEditScreenInner key={id} />;
}

function MaintenanceScheduleEditScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const loadQuery = useMaintenance(id, {
    include: { item: true },
  });
  const schedule = (loadQuery.data?.data || null) as any;

  const { data: items } = useItems({
    orderBy: { name: "asc" },
    limit: 100,
  });

  const form = useForm<MaintenanceScheduleUpdateFormData>({
    resolver: zodResolver(maintenanceScheduleUpdateSchema),
    defaultValues: {
      itemId: schedule?.itemId || "",
      frequency: schedule?.frequency || "WEEKLY",
      frequencyCount: schedule?.frequencyCount || 1,
      nextRun: schedule?.nextRun ? new Date(schedule.nextRun) : undefined,
    },
  });

  const flow = useFormFlow<MaintenanceScheduleUpdateFormData, { id: string }>({
    form,
    mutation: async (_data) => {
      Alert.alert("Sucesso", "Agendamento atualizado com sucesso");
      return { id: id ?? "" };
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
      title="Editar Agendamento"
      mode="edit"
      form={form}
      flow={flow}
      loadQuery={loadQuery}
      submittingLabel="Atualizando..."
      submitLabel="Atualizar Agendamento"
      privilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <FormCard title="Editar Agendamento" icon="IconTool">
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
