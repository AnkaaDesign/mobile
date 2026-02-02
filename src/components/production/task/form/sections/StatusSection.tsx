/**
 * Status Section Component
 * Handles task status and workflow-related fields
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { SimpleFormField } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';

interface StatusSectionProps {
  isSubmitting?: boolean;
  errors?: any;
  mode?: 'create' | 'edit';
}

const TASK_STATUSES = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'IN_PROGRESS', label: 'Em Andamento' },
  { value: 'REVIEW', label: 'Em Revisão' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'ON_HOLD', label: 'Em Espera' },
];

const PRIORITY_LEVELS = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];

export default function StatusSection({
  isSubmitting = false,
  errors = {},
  mode = 'create'
}: StatusSectionProps) {
  const { control, watch } = useFormContext();
  const { user } = useAuth();

  // Only show this section in edit mode for specific roles
  const isAdminUser = user?.sector?.privileges === 'ADMIN';
  const isFinancialUser = user?.sector?.privileges === 'FINANCIAL';
  const isCommercialUser = user?.sector?.privileges === 'COMMERCIAL';

  if (mode !== 'edit' || (!isAdminUser && !isFinancialUser && !isCommercialUser)) {
    return null;
  }

  const currentStatus = watch('status');

  return (
    <FormCard title="Status e Controle" icon="IconFlag">
      {/* Task Status */}
      <SimpleFormField label="Status da Tarefa" required error={errors.status}>
        <Controller
          control={control}
          name="status"
          render={({ field: { onChange, value } }) => (
            <Select
              value={value || 'PENDING'}
              onValueChange={onChange}
              options={TASK_STATUSES}
              placeholder="Selecione o status"
              disabled={isSubmitting}
              error={!!errors.status}
            />
          )}
        />
      </SimpleFormField>

      {/* Priority Level */}
      <SimpleFormField label="Prioridade" error={errors.priority}>
        <Controller
          control={control}
          name="priority"
          render={({ field: { onChange, value } }) => (
            <Select
              value={value || 'MEDIUM'}
              onValueChange={onChange}
              options={PRIORITY_LEVELS}
              placeholder="Selecione a prioridade"
              disabled={isSubmitting}
              error={!!errors.priority}
            />
          )}
        />
      </SimpleFormField>

      {/* Completion Percentage */}
      <SimpleFormField label="Progresso (%)" error={errors.completionPercentage}>
        <Controller
          control={control}
          name="completionPercentage"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              value={value ? String(value) : ''}
              onChangeText={(text) => {
                const numValue = parseInt(text);
                if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                  onChange(numValue);
                } else if (text === '') {
                  onChange(0);
                }
              }}
              onBlur={onBlur}
              placeholder="0-100"
              keyboardType="number-pad"
              maxLength={3}
              error={!!errors.completionPercentage}
              editable={!isSubmitting}
            />
          )}
        />
      </SimpleFormField>

      {/* Is Urgent Flag */}
      <SimpleFormField label="Tarefa Urgente" error={errors.isUrgent}>
        <Controller
          control={control}
          name="isUrgent"
          render={({ field: { onChange, value } }) => (
            <Switch
              value={!!value}
              onValueChange={onChange}
              disabled={isSubmitting}
            />
          )}
        />
      </SimpleFormField>

      {/* Requires Approval */}
      <SimpleFormField label="Requer Aprovação" error={errors.requiresApproval}>
        <Controller
          control={control}
          name="requiresApproval"
          render={({ field: { onChange, value } }) => (
            <Switch
              value={!!value}
              onValueChange={onChange}
              disabled={isSubmitting}
            />
          )}
        />
      </SimpleFormField>

      {/* Status Notes */}
      <SimpleFormField label="Observações do Status" error={errors.statusNotes}>
        <Controller
          control={control}
          name="statusNotes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Textarea
              value={value || ""}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Notas sobre o status atual..."
              numberOfLines={3}
              error={!!errors.statusNotes}
              editable={!isSubmitting}
            />
          )}
        />
      </SimpleFormField>

      {/* Cancellation Reason - Only show if status is CANCELLED */}
      {currentStatus === 'CANCELLED' && (
        <SimpleFormField label="Motivo do Cancelamento" required error={errors.cancellationReason}>
          <Controller
            control={control}
            name="cancellationReason"
            render={({ field: { onChange, onBlur, value } }) => (
              <Textarea
                value={value || ""}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Descreva o motivo do cancelamento..."
                numberOfLines={4}
                error={!!errors.cancellationReason}
                editable={!isSubmitting}
              />
            )}
          />
        </SimpleFormField>
      )}
    </FormCard>
  );
}

const styles = StyleSheet.create({
  // Add any specific styles here if needed
});