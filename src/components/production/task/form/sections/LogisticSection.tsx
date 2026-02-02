/**
 * Logistic Section Component
 * Handles logistic-specific fields like delivery information and discounts
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { SimpleFormField } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useAuth } from '@/hooks/useAuth';

interface LogisticSectionProps {
  isSubmitting?: boolean;
  errors?: any;
}

export default function LogisticSection({
  isSubmitting = false,
  errors = {}
}: LogisticSectionProps) {
  const { control, watch } = useFormContext();
  const { user } = useAuth();

  // Only show this section for Admin and Logistic users
  const isAdminUser = user?.sector?.privileges === 'ADMIN';
  const isLogisticUser = user?.sector?.privileges === 'LOGISTIC';

  if (!isAdminUser && !isLogisticUser) {
    return null;
  }

  // Watch for discount-related fields
  const hasDiscount = watch('logisticDiscount');

  return (
    <FormCard title="Informações Logísticas" icon="IconTruck">
      {/* Delivery Date */}
      <SimpleFormField label="Data de Entrega" error={errors.deliveryDate}>
        <Controller
          control={control}
          name="deliveryDate"
          render={({ field: { onChange, value } }) => (
            <DateTimePicker
              value={value ? new Date(value) : undefined}
              onValueChange={(date) => onChange(date?.toISOString())}
              placeholder="Selecione a data de entrega"
              disabled={isSubmitting}
              error={!!errors.deliveryDate}
            />
          )}
        />
      </SimpleFormField>

      {/* Delivery Address */}
      <SimpleFormField label="Endereço de Entrega" error={errors.deliveryAddress}>
        <Controller
          control={control}
          name="deliveryAddress"
          render={({ field: { onChange, onBlur, value } }) => (
            <Textarea
              value={value || ""}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Digite o endereço completo de entrega..."
              numberOfLines={3}
              error={!!errors.deliveryAddress}
              editable={!isSubmitting}
            />
          )}
        />
      </SimpleFormField>

      {/* Logistic Discount Toggle */}
      <SimpleFormField label="Desconto Logístico" error={errors.logisticDiscount}>
        <Controller
          control={control}
          name="logisticDiscount"
          render={({ field: { onChange, value } }) => (
            <Switch
              value={!!value}
              onValueChange={onChange}
              disabled={isSubmitting}
            />
          )}
        />
      </SimpleFormField>

      {/* Discount Value - Only show if discount is enabled */}
      {hasDiscount && (
        <SimpleFormField label="Valor do Desconto (%)" error={errors.discountValue}>
          <Controller
            control={control}
            name="discountValue"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value ? String(value) : ''}
                onChangeText={(text) => {
                  const numValue = parseFloat(text);
                  if (!isNaN(numValue) || text === '') {
                    onChange(text === '' ? null : numValue);
                  }
                }}
                onBlur={onBlur}
                placeholder="Ex: 10"
                keyboardType="decimal-pad"
                maxLength={5}
                error={!!errors.discountValue}
                editable={!isSubmitting}
              />
            )}
          />
        </SimpleFormField>
      )}

      {/* Transportation Notes */}
      <SimpleFormField label="Observações de Transporte" error={errors.transportNotes}>
        <Controller
          control={control}
          name="transportNotes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Textarea
              value={value || ""}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Observações sobre o transporte..."
              numberOfLines={3}
              error={!!errors.transportNotes}
              editable={!isSubmitting}
            />
          )}
        />
      </SimpleFormField>

      {/* Freight Value */}
      <SimpleFormField label="Valor do Frete (R$)" error={errors.freightValue}>
        <Controller
          control={control}
          name="freightValue"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              value={value ? String(value) : ''}
              onChangeText={(text) => {
                const numValue = parseFloat(text);
                if (!isNaN(numValue) || text === '') {
                  onChange(text === '' ? null : numValue);
                }
              }}
              onBlur={onBlur}
              placeholder="Ex: 150.00"
              keyboardType="decimal-pad"
              error={!!errors.freightValue}
              editable={!isSubmitting}
            />
          )}
        />
      </SimpleFormField>
    </FormCard>
  );
}

const styles = StyleSheet.create({
  // Add any specific styles here if needed
});