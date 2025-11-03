import { useState, useEffect } from "react";
import { View, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconTruck, IconDeviceFloppy, IconX } from "@tabler/icons-react-native";
import { useTruckMutations, useTruck } from '../../../../hooks';
import { truckCreateSchema, type TruckCreateFormData } from '../../../../schemas';
import { TRUCK_MANUFACTURER, TRUCK_MANUFACTURER_LABELS } from '../../../../constants';
import {
  ThemedView,
  ThemedText,
  Card,
  Input,
  Select,
  SelectItem,
  Button,
  
  Skeleton,
  SimpleFormField,
} from "@/components/ui";
import { TaskSelector } from "@/components/production/task/selector/task-selector";
import { GarageSelector } from "@/components/production/garage/selector/garage-selector";
import { LayoutSelector } from "@/components/production/layout/selector/layout-selector";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

export default function TruckCreateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { duplicateFrom } = useLocalSearchParams<{ duplicateFrom?: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: duplicateSource, isLoading: isLoadingDuplicate } = useTruck(duplicateFrom!, {
    enabled: !!duplicateFrom,
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    
  } = useForm<TruckCreateFormData>({
    resolver: zodResolver(truckCreateSchema),
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

  const { createAsync } = useTruckMutations();

  // Pre-fill form when duplicating
  useEffect(() => {
    if (duplicateSource?.data && !isLoadingDuplicate) {
      const truck = duplicateSource.data;
      setValue("model", truck.model);
      setValue("manufacturer", truck.manufacturer);
      if (truck.xPosition) setValue("xPosition", truck.xPosition);
      if (truck.yPosition) setValue("yPosition", truck.yPosition);
      if (truck.garageId) setValue("garageId", truck.garageId);
      if (truck.leftSideLayoutId) setValue("leftSideLayoutId", truck.leftSideLayoutId);
      if (truck.rightSideLayoutId) setValue("rightSideLayoutId", truck.rightSideLayoutId);
      if (truck.backSideLayoutId) setValue("backSideLayoutId", truck.backSideLayoutId);
    }
  }, [duplicateSource, isLoadingDuplicate, setValue]);

  const onSubmit = async (data: TruckCreateFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await createAsync(data);

      if (result?.data) {
        Alert.alert(
          "Sucesso",
          "Caminhão criado com sucesso!",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace(routeToMobilePath(routes.production.trucks.details(result.data?.id || '')) as any);
              },
            },
          ]
        );
      } else {
        Alert.alert("Erro", "Erro ao criar caminhão");
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao criar caminhão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const manufacturerOptions = Object.values(TRUCK_MANUFACTURER).map((manufacturer) => ({
    label: TRUCK_MANUFACTURER_LABELS[manufacturer],
    value: manufacturer,
  }));

  if (duplicateFrom && isLoadingDuplicate) {
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

  return (
    <ThemedView style={StyleSheet.flatten([styles.wrapper, { backgroundColor: colors.background }])}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header Card */}
            <Card style={styles.headerCard}>
              <View style={styles.headerContent}>
                <View style={[styles.headerLeft, { flex: 1 }]}>
                  <IconTruck size={24} color={colors.primary} />
                  <ThemedText style={StyleSheet.flatten([styles.truckName, { color: colors.foreground }])}>
                    {duplicateFrom ? "Duplicar Caminhão" : "Cadastrar Caminhão"}
                  </ThemedText>
                </View>
                <View style={styles.headerActions}>
                  {/* Empty placeholder to match detail page structure */}
                </View>
              </View>
            </Card>
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

        {/* Bottom spacing */}
        <View style={{ height: spacing.md }} />
      </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Action Buttons */}
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.card }}>
        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: spacing.xl,
            },
          ]}
        >
          <Button
            variant="outline"
            onPress={handleCancel}
            disabled={isSubmitting}
            style={{ flex: 1, minHeight: 40 }}
          >
            <>
              <IconX size={20} color={colors.foreground} />
              <ThemedText style={{ color: colors.foreground, marginLeft: 8 }}>Cancelar</ThemedText>
            </>
          </Button>

          <Button
            variant="default"
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isSubmitting}
            style={{ flex: 1, minHeight: 40 }}
          >
            <>
              <IconDeviceFloppy size={20} color={colors.primaryForeground} />
              <ThemedText style={{ color: colors.primaryForeground, marginLeft: 8 }}>
                {isSubmitting ? "Salvando..." : "Salvar Caminhão"}
              </ThemedText>
            </>
          </Button>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  truckName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 36,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  skeletonRows: {
    gap: spacing.sm,
  },
});