import { Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormScreen } from "@/components/screens/form-screen";
import { useFormFlow } from "@/hooks/use-form-flow";
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { useHolidayMutations } from "@/hooks/useHoliday";
import { mobileRoute } from "@/constants/routes.types";
import { routes, SECTOR_PRIVILEGES } from "@/constants";

interface HolidayCreateForm {
  name: string;
  date: string;
}

export default function HolidaysCreateScreen() {
  const formKey = useFormScreenKey();
  return <HolidaysCreateScreenInner key={formKey} />;
}

function HolidaysCreateScreenInner() {
  const { createAsync } = useHolidayMutations();

  const form = useForm<HolidayCreateForm>({
    defaultValues: { name: "", date: "" },
  });

  const flow = useFormFlow<HolidayCreateForm, { id: string }>({
    form,
    mutation: async (data) => {
      if (!data.name?.trim()) {
        Alert.alert("Erro", "Nome do feriado é obrigatório");
        throw new Error("missing name");
      }
      const r = await createAsync({
        name: data.name,
        date: data.date ? new Date(data.date) : new Date(),
      } as any);
      return { id: r?.data?.id ?? "" };
    },
    successRoute: () => mobileRoute(routes.personnelDepartment.holidays.root),
    cancelFallback: mobileRoute(routes.personnelDepartment.holidays.root),
  });

  return (
    <FormScreen
      title="Novo Feriado"
      mode="create"
      form={form}
      flow={flow}
      submittingLabel="Salvando..."
      submitLabel="Salvar Feriado"
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
