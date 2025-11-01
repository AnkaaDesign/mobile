import { useState, useEffect } from "react";
import { View, ScrollView, Alert , StyleSheet} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconTruck, IconDeviceFloppy, IconX } from "@tabler/icons-react-native";
import { useTruck, useTruckMutations } from '../../../../../hooks';
import { truckUpdateSchema, type TruckUpdateFormData } from '../../../../../schemas';
import { TRUCK_MANUFACTURER, TRUCK_MANUFACTURER_LABELS } from '../../../../../constants';
import {
  ThemedView,
  ThemedText,
  Card,
  Input,
  Select,
  SelectItem,
  Button,
  ErrorScreen,
  Skeleton,
  SimpleFormField,
} from "@/components/ui";
import { TaskSelector } from "@/components/production/task/selector/task-selector";
import { GarageSelector } from "@/components/production/garage/selector/garage-selector";
import { LayoutSelector } from "@/components/production/layout/selector/layout-selector";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function TruckEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: truck, isLoading, error, refetch } = useTruck(id!, {
    include: {
      task: true,
      garage: true,
      leftSideLayout: true,
      rightSideLayout: true,
      backSideLayout: true,
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    
    reset,
  } = useForm<TruckUpdateFormData>({
    resolver: zodResolver(truckUpdateSchema),
    mode: "onChange",
    defaultValues: {
      plate: "",
      model: "",
      manufacturer: TRUCK_MANUFACTURER.VOLKSWAGEN,
      xPosition: null,
      yPosition: null,
      taskId: "",
      garageId: null,
      leftSideLayoutId: null,
      rightSideLayoutId: null,
      backSideLayoutId: null,
    },
  });

  const { updateAsync } = useTruckMutations();

  // Populate form when truck data is loaded
  useEffect(() => {
    if (truck?.data && !isLoading) {
      const truckData = truck.data;
      reset({
        plate: truckData.plate,
        model: truckData.model,
        manufacturer: truckData.manufacturer,
        xPosition: truckData.xPosition,
        yPosition: truckData.yPosition,
        taskId: truckData.taskId,
        garageId: truckData.garageId,
        leftSideLayoutId: truckData.leftSideLayoutId,
        rightSideLayoutId: truckData.rightSideLayoutId,
        backSideLayoutId: truckData.backSideLayoutId,
      });
    }
  }, [truck, isLoading, reset]);

  const onSubmit = async (data: TruckUpdateFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await updateAsync({ id: id!, data });

      if (result?.data) {
        Alert.alert(
          "Sucesso",
          "Caminhão atualizado com sucesso!",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace(routeToMobilePath(routes.production.trucks.details(id!)) as any);
              },
            },
          ]
        );
      } else {
        Alert.alert("Erro", "Erro ao atualizar caminhão");
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao atualizar caminhão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      Alert.alert(
        "Descartar Alterações",
        "Você tem alterações não salvas. Deseja descartá-las?",
        [
          { text: "Continuar Editando", style: "cancel" },
          { text: "Descartar", style: "destructive", onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const manufacturerOptions = Object.values(TRUCK_MANUFACTURER).map((manufacturer) => ({
    label: TRUCK_MANUFACTURER_LABELS[manufacturer],
    value: manufacturer,
  }));

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Skeleton height={24} width="60%" />
            <View style={styles.skeletonRows}>
              <Skeleton height={48} width="100%" />
              <Skeleton height={48} width="100%" />
              <Skeleton height={48} width="100%" />
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  if (error || !truck?.data) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar caminhão"
          detail={error?.message || "Caminhão não encontrado"}
          onRetry={refetch}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <IconTruck size={24} color={colors.primary} />
            <ThemedText style={styles.title}>Editar Caminhão</ThemedText>
          </View>
          <ThemedText style={StyleSheet.flatten([styles.subtitle, { color: colors.mutedForeground }])}>
            {truck.data.plate} - {TRUCK_MANUFACTURER_LABELS[truck.data.manufacturer]} {truck.data.model}
          </ThemedText>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* Basic Information */}
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Identificação</ThemedText>

          <SimpleFormField
            label="Placa"
            required
            error={errors.plate}
          >
            <Controller
              control={control}
              name="plate"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Ex: ABC-1234"
                  autoCapitalize="characters"
                  maxLength={8}
                  error={!!errors.plate}
                />
              )}
            />
          </SimpleFormField>

          <SimpleFormField
            label="Modelo"
            required
            error={errors.model}
          >
            <Controller
              control={control}
              name="model"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Ex: Constellation 26.280"
                  maxLength={100}
                  error={!!errors.model}
                />
              )}
            />
          </SimpleFormField>

          <SimpleFormField
            label="Montadora"
            required
            error={errors.manufacturer}
          >
            <Controller
              control={control}
              name="manufacturer"
              render={({ field: { onChange, value } }) => (
                <Select
                  value={value}
                  onValueChange={onChange}
                >
                  {manufacturerOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Select>
              )}
            />
          </SimpleFormField>
        </Card>

        {/* Task Assignment */}
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Tarefa</ThemedText>

          <SimpleFormField
            label="Tarefa Associada"
            required
            error={errors.taskId}
          >
            <Controller
              control={control}
              name="taskId"
              render={({ field: { onChange, value } }) => (
                <TaskSelector
                  value={value}
                  onValueChange={onChange}
                  placeholder="Selecione uma tarefa"
                />
              )}
            />
          </SimpleFormField>
        </Card>

        {/* Location */}
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Localização</ThemedText>

          <SimpleFormField
            label="Garagem"
            error={errors.garageId}
          >
            <Controller
              control={control}
              name="garageId"
              render={({ field: { onChange, value } }) => (
                <GarageSelector
                  value={value || ""}
                  onValueChange={(val) => onChange(val || null)}
                  placeholder="Selecione uma garagem (opcional)"
                />
              )}
            />
          </SimpleFormField>

          <View style={styles.row}>
            <SimpleFormField
              label="Posição X (m)"
              error={errors.xPosition}
              style={styles.halfField}
            >
              <Controller
                control={control}
                name="xPosition"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value?.toString() || ""}
                    onChangeText={(text) => onChange(text ? parseFloat(text) || null : null)}
                    onBlur={onBlur}
                    placeholder="Ex: 10.5"
                    keyboardType="numeric"
                  />
                )}
              />
            </SimpleFormField>

            <SimpleFormField
              label="Posição Y (m)"
              error={errors.yPosition}
              style={styles.halfField}
            >
              <Controller
                control={control}
                name="yPosition"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value?.toString() || ""}
                    onChangeText={(text) => onChange(text ? parseFloat(text) || null : null)}
                    onBlur={onBlur}
                    placeholder="Ex: 5.25"
                    keyboardType="numeric"
                  />
                )}
              />
            </SimpleFormField>
          </View>
        </Card>

        {/* Layouts */}
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Layouts do Caminhão</ThemedText>

          <SimpleFormField
            label="Layout Lateral Esquerdo"
            error={errors.leftSideLayoutId}
          >
            <Controller
              control={control}
              name="leftSideLayoutId"
              render={({ field: { onChange, value } }) => (
                <LayoutSelector
                  value={value || ""}
                  onValueChange={(val) => onChange(val || null)}
                  placeholder="Selecione o layout esquerdo"
                />
              )}
            />
          </SimpleFormField>

          <SimpleFormField
            label="Layout Lateral Direito"
            error={errors.rightSideLayoutId}
          >
            <Controller
              control={control}
              name="rightSideLayoutId"
              render={({ field: { onChange, value } }) => (
                <LayoutSelector
                  value={value || ""}
                  onValueChange={(val) => onChange(val || null)}
                  placeholder="Selecione o layout direito"
                />
              )}
            />
          </SimpleFormField>

          <SimpleFormField
            label="Layout Traseiro"
            error={errors.backSideLayoutId}
          >
            <Controller
              control={control}
              name="backSideLayoutId"
              render={({ field: { onChange, value } }) => (
                <LayoutSelector
                  value={value || ""}
                  onValueChange={(val) => onChange(val || null)}
                  placeholder="Selecione o layout traseiro"
                />
              )}
            />
          </SimpleFormField>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom }]}>
        <Button
          variant="outline"
          onPress={handleCancel}
          disabled={isSubmitting}
          style={styles.actionButton}
        >
          <IconX size={20} />
          <ThemedText>Cancelar</ThemedText>
        </Button>

        <Button
          variant="default"
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isSubmitting || !isDirty}
          style={styles.actionButton}
        >
          <IconDeviceFloppy size={20} />
          <ThemedText style={{ color: "white" }}>
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </ThemedText>
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    gap: 4,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginLeft: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    marginBottom: 0,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  skeletonRows: {
    gap: 8,
  },
});