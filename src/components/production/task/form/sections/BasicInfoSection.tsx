/**
 * Basic Information Section Component
 * Combines customer info and vehicle details in one section
 */

import React from 'react';
import { View } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { SimpleFormField, FormFieldGroup } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { CustomerSelector } from '../customer-selector';
import { toTitleCase } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { useSectors } from '@/hooks';
import {
  TRUCK_CATEGORY,
  IMPLEMENT_TYPE,
  COMMISSION_STATUS,
  TASK_STATUS
} from '@/constants/enums';
import {
  TRUCK_CATEGORY_LABELS,
  IMPLEMENT_TYPE_LABELS,
  COMMISSION_STATUS_LABELS,
  TASK_STATUS_LABELS
} from '@/constants/enum-labels';

interface BasicInfoSectionProps {
  isSubmitting?: boolean;
  errors?: any;
  mode?: 'create' | 'edit';
  initialCustomer?: any;
  task?: any;
}

export default function BasicInfoSection({
  isSubmitting = false,
  errors = {},
  mode = 'create',
  initialCustomer,
  task
}: BasicInfoSectionProps) {
  const { control, watch } = useFormContext();
  const { user } = useAuth();

  // Check user sector privileges
  const userPrivilege = user?.sector?.privileges;
  const isFinancialSector = userPrivilege === 'FINANCIAL';
  const isWarehouseSector = userPrivilege === 'WAREHOUSE';
  const isDesignerSector = userPrivilege === 'DESIGNER';
  const isLogisticSector = userPrivilege === 'LOGISTIC';
  const isCommercialSector = userPrivilege === 'COMMERCIAL';

  // Check if user can view restricted fields
  const canViewRestrictedFields = ['ADMIN', 'FINANCIAL', 'COMMERCIAL', 'LOGISTIC', 'DESIGNER'].includes(userPrivilege || '');
  const canViewCommissionField = ['ADMIN', 'FINANCIAL', 'COMMERCIAL', 'PRODUCTION'].includes(userPrivilege || '');
  // Fetch sectors
  const { data: sectors, isLoading: isLoadingSectors } = useSectors({
    orderBy: { name: "asc" },
  });

  const sectorOptions = sectors?.data?.map((sector) => ({
    value: sector.id,
    label: sector.name,
  })) || [];

  const truckCategoryOptions = Object.values(TRUCK_CATEGORY).map(cat => ({
    value: cat,
    label: TRUCK_CATEGORY_LABELS[cat] || cat
  }));

  const implementTypeOptions = Object.values(IMPLEMENT_TYPE).map(type => ({
    value: type,
    label: IMPLEMENT_TYPE_LABELS[type] || type
  }));

  const statusOptions = Object.values(TASK_STATUS).map(status => ({
    value: status,
    label: TASK_STATUS_LABELS[status] || status
  }));

  const commissionOptions = Object.values(COMMISSION_STATUS).map(status => ({
    value: status,
    label: COMMISSION_STATUS_LABELS[status] || status
  }));

  return (
    <FormCard title="Informações Básicas" icon="IconFileText">
      {/* Task Name */}
      <SimpleFormField label="Nome da Tarefa" error={errors.name}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={() => {
                if (value) {
                  onChange(toTitleCase(value));
                }
                onBlur();
              }}
              placeholder="Ex: Pintura completa do caminhão"
              maxLength={200}
              error={!!errors.name}
              editable={!isSubmitting && !isFinancialSector && !isWarehouseSector && !isDesignerSector && !isLogisticSector}
            />
          )}
        />
      </SimpleFormField>

      {/* Customer */}
      <FormFieldGroup label="Cliente" error={errors.customerId?.message}>
        <Controller
          control={control}
          name="customerId"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <CustomerSelector
              value={value}
              onValueChange={onChange}
              initialCustomer={initialCustomer}
              disabled={isSubmitting || isFinancialSector || isWarehouseSector || isDesignerSector}
              error={error?.message}
              required={false}
            />
          )}
        />
      </FormFieldGroup>

      {/* Truck Category */}
      <SimpleFormField label="Categoria do Caminhão" error={errors.truck?.category}>
        <Controller
          control={control}
          name="truck.category"
          render={({ field: { onChange, value } }) => (
            <Combobox
              value={value || ''}
              onValueChange={onChange}
              options={truckCategoryOptions}
              placeholder="Selecione a categoria"
              disabled={isSubmitting || isFinancialSector || isWarehouseSector || isDesignerSector}
              error={errors.truck?.category?.message}
            />
          )}
        />
      </SimpleFormField>

      {/* Implement Type */}
      <SimpleFormField label="Tipo de Implemento" error={errors.truck?.implementType}>
        <Controller
          control={control}
          name="truck.implementType"
          render={({ field: { onChange, value } }) => (
            <Combobox
              value={value || ''}
              onValueChange={onChange}
              options={implementTypeOptions}
              placeholder="Selecione o tipo"
              disabled={isSubmitting || isFinancialSector || isWarehouseSector || isDesignerSector}
              error={errors.truck?.implementType?.message}
            />
          )}
        />
      </SimpleFormField>

      {/* Serial Number */}
      <SimpleFormField label="Número de Série" error={errors.serialNumber}>
        <Controller
          control={control}
          name="serialNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              value={value || ''}
              onChangeText={(text) => onChange(String(text ?? '').toUpperCase())}
              onBlur={onBlur}
              placeholder="Ex: ABC123456"
              maxLength={50}
              autoCapitalize="characters"
              error={!!errors.serialNumber}
              editable={!isSubmitting && !isFinancialSector && !isWarehouseSector && !isDesignerSector}
            />
          )}
        />
      </SimpleFormField>

      {/* License Plate */}
      <SimpleFormField label="Placa" error={errors.plate}>
        <Controller
          control={control}
          name="truck.plate"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              value={value || ''}
              onChangeText={(text) => onChange(String(text ?? '').toUpperCase())}
              onBlur={onBlur}
              placeholder="Ex: ABC-1234"
              maxLength={10}
              autoCapitalize="characters"
              error={!!errors.truck?.plate}
              editable={!isSubmitting && !isFinancialSector && !isWarehouseSector && !isDesignerSector}
            />
          )}
        />
      </SimpleFormField>

      {/* Chassis Number */}
      <SimpleFormField label="Chassi" error={errors.chassisNumber}>
        <Controller
          control={control}
          name="truck.chassisNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              value={value || ''}
              onChangeText={(text) => onChange(String(text ?? '').toUpperCase())}
              onBlur={onBlur}
              placeholder="Ex: 9BWZZZ377VT004251"
              maxLength={17}
              autoCapitalize="characters"
              error={!!errors.truck?.chassisNumber}
              editable={!isSubmitting && !isFinancialSector && !isWarehouseSector && !isDesignerSector}
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
              value={value || ''}
              onValueChange={onChange}
              options={sectorOptions}
              placeholder="Selecione o setor"
              searchPlaceholder="Buscar setor..."
              emptyText="Nenhum setor encontrado"
              disabled={isSubmitting || isFinancialSector || isWarehouseSector || isDesignerSector || isCommercialSector}
              error={errors.sectorId?.message}
              loading={isLoadingSectors}
              clearable={false}
            />
          )}
        />
      </SimpleFormField>

      {/* Status - Only in edit mode */}
      {mode === 'edit' && (
        <SimpleFormField label="Status" error={errors.status}>
          <Controller
            control={control}
            name="status"
            render={({ field: { onChange, value } }) => (
              <Combobox
                value={value || ''}
                onValueChange={onChange}
                options={statusOptions}
                placeholder="Selecione o status"
                disabled={isSubmitting || isFinancialSector}
                error={errors.status?.message}
              />
            )}
          />
        </SimpleFormField>
      )}

      {/* Commission Status - Only visible to specific roles */}
      {canViewCommissionField && (
        <SimpleFormField label="Status de Comissão" error={errors.commission}>
          <Controller
            control={control}
            name="commission"
            render={({ field: { onChange, value } }) => (
              <Combobox
                value={value || ''}
                onValueChange={onChange}
                options={commissionOptions}
                placeholder="Selecione o status da comissão"
                disabled={isSubmitting}
                error={errors.commission?.message}
              />
            )}
          />
        </SimpleFormField>
      )}

      {/* Details */}
      <SimpleFormField label="Detalhes" error={errors.details}>
        <Controller
          control={control}
          name="details"
          render={({ field: { onChange, onBlur, value } }) => (
            <Textarea
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Detalhes adicionais da tarefa..."
              numberOfLines={4}
              maxLength={500}
              error={!!errors.details}
              editable={!isSubmitting}
            />
          )}
        />
      </SimpleFormField>
    </FormCard>
  );
}