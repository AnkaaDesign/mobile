/**
 * Vehicle Section Component
 * Handles truck and vehicle information including serial number, plate, chassis, etc.
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { SimpleFormField, FormFieldGroup } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { ThemedText } from '@/components/ui/themed-text';
import { spacing, fontSize } from '@/constants/design-system';
import { useSectors } from '@/hooks';
import { useAuth } from '@/hooks/useAuth';
import {
  TRUCK_CATEGORY,
  IMPLEMENT_TYPE,
  COMMISSION_STATUS,
  TASK_STATUS
} from '@/constants/enums';
import {
  TRUCK_CATEGORY_LABELS,
  IMPLEMENT_TYPE_LABELS,
  COMMISSION_STATUS_LABELS
} from '@/constants/enum-labels';

const TASK_STATUS_OPTIONS = Object.values(TASK_STATUS).map(status => ({
  value: status,
  label: status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}));

interface VehicleSectionProps {
  isSubmitting?: boolean;
  errors?: any;
  mode?: 'create' | 'edit';
  canViewRestrictedFields?: boolean;
}

export default function VehicleSection({
  isSubmitting = false,
  errors = {},
  mode = 'create',
  canViewRestrictedFields = false
}: VehicleSectionProps) {
  const { control } = useFormContext();
  const { user } = useAuth();
  const [sectorSearch, setSectorSearch] = useState('');

  // Fetch sectors
  const { data: sectors, isLoading: isLoadingSectors } = useSectors({
    searchingFor: sectorSearch,
    orderBy: { name: "asc" },
  });

  const sectorOptions = sectors?.data?.map((sector) => ({
    value: sector.id,
    label: sector.name,
  })) || [];

  // Check if user can view commission field
  const canViewCommissionField = ['ADMIN', 'FINANCIAL', 'COMMERCIAL', 'PRODUCTION'].includes(
    user?.sector?.privileges || ''
  );

  return (
    <>
      <FormCard title="Informações do Veículo" icon="IconTruck">
        {/* Serial Number */}
        <SimpleFormField label="Número de Série" error={errors.serialNumber}>
          <Controller
            control={control}
            name="serialNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value || ""}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Ex: ABC-123456"
                autoCapitalize="characters"
                error={!!errors.serialNumber}
              />
            )}
          />
        </SimpleFormField>

        {/* Truck - Plate */}
        <SimpleFormField label="Placa" error={errors.truck?.plate}>
          <Controller
            control={control}
            name="truck.plate"
            render={({ field: { onChange, onBlur, value } }) => {
              // Format Brazilian license plate for display
              const formatPlate = (val: string | null | undefined): string => {
                if (!val) return "";
                const clean = val.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                if (clean.length <= 3) {
                  return clean;
                }
                // Format: ABC-1234 or ABC-1D23
                return clean.slice(0, 3) + '-' + clean.slice(3, 7);
              };

              const handleChange = (text: string | null) => {
                if (!text) {
                  onChange(null);
                  return;
                }
                const cleanValue = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                const limitedValue = cleanValue.slice(0, 7);
                onChange(limitedValue || null);
              };

              return (
                <Input
                  value={formatPlate(value)}
                  onChangeText={handleChange}
                  onBlur={onBlur}
                  placeholder="Ex: ABC-1234 ou ABC-1D23"
                  autoCapitalize="characters"
                  maxLength={8}
                  error={!!errors.truck?.plate}
                />
              );
            }}
          />
        </SimpleFormField>

        {/* Truck - Chassis Number */}
        <SimpleFormField label="Número do Chassi (17 caracteres)" error={errors.truck?.chassisNumber}>
          <Controller
            control={control}
            name="truck.chassisNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                type="chassis"
                value={value || ""}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Ex: 9BW ZZZ37 7V T004251"
                autoCapitalize="characters"
                error={!!errors.truck?.chassisNumber}
              />
            )}
          />
        </SimpleFormField>

        {/* Truck - Category */}
        <SimpleFormField label="Categoria do Caminhão" error={errors.truck?.category}>
          <Controller
            control={control}
            name="truck.category"
            render={({ field: { onChange, value } }) => (
              <Combobox
                value={value || ""}
                onValueChange={(val) => onChange(val || null)}
                options={Object.values(TRUCK_CATEGORY).map((category) => ({
                  value: category,
                  label: TRUCK_CATEGORY_LABELS[category],
                }))}
                placeholder="Selecione a categoria"
                searchable={false}
                clearable={true}
                disabled={isSubmitting}
              />
            )}
          />
        </SimpleFormField>

        {/* Truck - Implement Type */}
        <SimpleFormField label="Tipo de Implemento" error={errors.truck?.implementType}>
          <Controller
            control={control}
            name="truck.implementType"
            render={({ field: { onChange, value } }) => (
              <Combobox
                value={value || ""}
                onValueChange={(val) => onChange(val || null)}
                options={Object.values(IMPLEMENT_TYPE).map((type) => ({
                  value: type,
                  label: IMPLEMENT_TYPE_LABELS[type],
                }))}
                placeholder="Selecione o tipo"
                searchable={false}
                clearable={true}
                disabled={isSubmitting}
              />
            )}
          />
        </SimpleFormField>

        {/* Sector */}
        <SimpleFormField label="Setor" error={errors.sectorId}>
          <Controller
            control={control}
            name="sectorId"
            render={({ field: { onChange, value } }) => (
              <Combobox
                value={value || ""}
                onValueChange={(val) => onChange(val || null)}
                options={sectorOptions}
                placeholder="Selecione o setor"
                searchPlaceholder="Buscar setor..."
                emptyText="Nenhum setor encontrado"
                onSearchChange={setSectorSearch}
                loading={isLoadingSectors}
                searchable={true}
                clearable={true}
              />
            )}
          />
        </SimpleFormField>

        {/* Commission Status */}
        {canViewCommissionField && (
          <SimpleFormField label="Status de Comissão" error={errors.commission}>
            <Controller
              control={control}
              name="commission"
              render={({ field: { onChange, value } }) => (
                <Combobox
                  value={value || COMMISSION_STATUS.FULL_COMMISSION}
                  onValueChange={onChange}
                  options={Object.values(COMMISSION_STATUS).map((status) => ({
                    value: status,
                    label: COMMISSION_STATUS_LABELS[status],
                  }))}
                  placeholder="Selecione o status de comissão"
                  searchable={false}
                  disabled={isSubmitting}
                />
              )}
            />
          </SimpleFormField>
        )}

        {/* Status (edit mode only) */}
        {mode === "edit" && (
          <SimpleFormField label="Status" error={errors.status}>
            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <Combobox
                  value={value || TASK_STATUS.WAITING_PRODUCTION}
                  onValueChange={onChange}
                  options={TASK_STATUS_OPTIONS}
                  placeholder="Selecione o status"
                  searchable={false}
                />
              )}
            />
          </SimpleFormField>
        )}
      </FormCard>

      {/* Dates Card */}
      <FormCard title="Datas" icon="IconCalendar">
        {/* Forecast Date */}
        {canViewRestrictedFields && (
          <Controller
            control={control}
            name="forecastDate"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.fieldGroup}>
                <Label>Data de Previsão de Liberação</Label>
                <DatePicker
                  value={value ?? undefined}
                  onChange={onChange}
                  type="datetime"
                  placeholder="Selecione a data de previsão"
                  disabled={isSubmitting}
                />
                {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
              </View>
            )}
          />
        )}

        {/* Entry Date */}
        <Controller
          control={control}
          name="entryDate"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.fieldGroup}>
              <Label>Data de Entrada</Label>
              <DatePicker
                value={value ?? undefined}
                onChange={onChange}
                type="date"
                placeholder="Selecione a data"
                disabled={isSubmitting}
              />
              {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
            </View>
          )}
        />

        {/* Term/Deadline */}
        <Controller
          control={control}
          name="term"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.fieldGroup}>
              <Label>Prazo de Entrega</Label>
              <DatePicker
                value={value ?? undefined}
                onChange={onChange}
                type="datetime"
                placeholder="Selecione o prazo"
                disabled={isSubmitting}
              />
              {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
            </View>
          )}
        />

        {/* Started At - Edit mode only */}
        {mode === "edit" && (
          <Controller
            control={control}
            name="startedAt"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.fieldGroup}>
                <Label>Data de Início</Label>
                <DatePicker
                  value={value ?? undefined}
                  onChange={onChange}
                  type="datetime"
                  placeholder="Selecione a data de início"
                  disabled={isSubmitting}
                />
                {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
              </View>
            )}
          />
        )}

        {/* Finished At - Edit mode only */}
        {mode === "edit" && (
          <Controller
            control={control}
            name="finishedAt"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.fieldGroup}>
                <Label>Data de Conclusão</Label>
                <DatePicker
                  value={value ?? undefined}
                  onChange={onChange}
                  type="datetime"
                  placeholder="Selecione a data de conclusão"
                  disabled={isSubmitting}
                />
                {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
              </View>
            )}
          />
        )}
      </FormCard>
    </>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: "#ef4444",
    marginTop: spacing.xs,
  },
});