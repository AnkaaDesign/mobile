import { useEffect } from "react";
import { Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useLocalSearchParams } from "expo-router";

import { Input } from "@/components/ui/input";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormScreen } from "@/components/screens/form-screen";
import { useFormFlow } from "@/hooks/use-form-flow";
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { useHoliday, useHolidayMutations } from "@/hooks/useHoliday";
import { mobileRoute } from "@/constants/routes.types";
import { routes, SECTOR_PRIVILEGES } from "@/constants";

interface HolidayEditForm {
  name: string;
  date: string;
}

export default function HolidayEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const formKey = useFormScreenKey();
  return <HolidayEditScreenInner key={`${id}-${formKey}`} />;
}

function HolidayEditScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const holidayId = id || "";
  const loadQuery = useHoliday(holidayId, { enabled: !!holidayId });
  const { updateAsync } = useHolidayMutations();

  const form = useForm<HolidayEditForm>({
    defaultValues: { name: "", date: "" },
  });

  // Hydrate the form once the holiday loads.
  useEffect(() => {
    const holiday = loadQuery.data?.data;
    if (!holiday) return;
    form.reset({
      name: holiday.name || "",
      date:
        holiday.date instanceof Date
          ? holiday.date.toISOString().split("T")[0]
          : holiday.date || "",
    });
  }, [loadQuery.data, form]);

  const flow = useFormFlow<HolidayEditForm, { id: string }>({
    form,
    mutation: async (data) => {
      if (!holidayId) {
        Alert.alert("Erro", "ID do feriado não encontrado");
        throw new Error("missing id");
      }
      const r = await updateAsync({
        id: holidayId,
        data: {
          name: data.name,
          date: data.date ? new Date(data.date) : undefined,
        } as any,
      });
      return { id: r?.data?.id ?? holidayId };
    },
    successRoute: () => mobileRoute(routes.humanResources.holidays.root),
    cancelFallback: mobileRoute(routes.humanResources.holidays.root),
  });

  return (
    <FormScreen
      title="Editar Feriado"
      mode="edit"
      form={form}
      flow={flow}
      loadQuery={loadQuery as any}
      submittingLabel="Salvando..."
      submitLabel="Salvar Alterações"
      privilege={{
        any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
      }}
    >
      <FormCard title="Informações do Feriado" icon="IconCalendar">
        <FormFieldGroup
          label="Nome do Feriado"
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
                placeholder="Digite o nome do feriado"
                error={!!form.formState.errors.name}
              />
            )}
          />
        </FormFieldGroup>

        <FormFieldGroup
          label="Data do Feriado"
          required
          error={form.formState.errors.date?.message as string | undefined}
        >
          <Controller
            control={form.control}
            name="date"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value || ""}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="AAAA-MM-DD"
                error={!!form.formState.errors.date}
              />
            )}
          />
        </FormFieldGroup>
      </FormCard>
    </FormScreen>
  );
}
