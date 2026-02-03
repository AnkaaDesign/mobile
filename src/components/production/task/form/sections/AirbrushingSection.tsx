/**
 * Airbrushing Section Component
 * Handles airbrushing configuration for tasks
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { SimpleFormField } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ThemedText } from '@/components/ui/themed-text';
import { Button } from '@/components/ui/button';
import { IconPlus, IconTrash } from '@tabler/icons-react-native';
import { useAuth } from '@/hooks/useAuth';
import { SECTOR_PRIVILEGES } from '@/constants';
import { useTheme } from '@/lib/theme';

interface AirbrushingItem {
  id?: string;
  name: string;
  description: string;
  area?: number;
}

interface AirbrushingSectionProps {
  isSubmitting?: boolean;
  errors?: any;
  initialAirbrushings?: AirbrushingItem[];
}

export default function AirbrushingSection({
  isSubmitting = false,
  errors = {},
  initialAirbrushings = []
}: AirbrushingSectionProps) {
  const { control, setValue, watch } = useFormContext();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [airbrushingCount, setAirbrushingCount] = useState(initialAirbrushings.length);

  // Hide for Warehouse, Financial, Designer, Logistic, Commercial users
  const userPrivilege = user?.sector?.privileges;
  const hideSection =
    userPrivilege === SECTOR_PRIVILEGES.WAREHOUSE ||
    userPrivilege === SECTOR_PRIVILEGES.FINANCIAL ||
    userPrivilege === SECTOR_PRIVILEGES.DESIGNER ||
    userPrivilege === SECTOR_PRIVILEGES.LOGISTIC ||
    userPrivilege === SECTOR_PRIVILEGES.COMMERCIAL;

  if (hideSection) {
    return null;
  }

  const airbrushings = watch('airbrushings') || [];

  const addAirbrushing = () => {
    const newAirbrushing: AirbrushingItem = {
      name: '',
      description: '',
      area: 0
    };

    const updated = [...airbrushings, newAirbrushing];
    setValue('airbrushings', updated);
    setAirbrushingCount(updated.length);
  };

  const removeAirbrushing = (index: number) => {
    const updated = airbrushings.filter((_: any, i: number) => i !== index);
    setValue('airbrushings', updated);
    setAirbrushingCount(updated.length);
  };

  return (
    <FormCard
      title="Aerografias"
      icon="IconSpray"
      badge={airbrushingCount > 0 ? airbrushingCount : undefined}
    >
      {/* List of Airbrushings */}
      {airbrushings.map((airbrushing: AirbrushingItem, index: number) => (
        <View key={index} style={styles.airbrushingItem}>
          <View style={styles.airbrushingHeader}>
            <ThemedText style={styles.airbrushingTitle}>
              Aerografia {index + 1}
            </ThemedText>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => removeAirbrushing(index)}
              disabled={isSubmitting}
            >
              <IconTrash size={18} color={colors.destructive} />
            </Button>
          </View>

          <SimpleFormField label="Nome" error={errors.airbrushings?.[index]?.name}>
            <Controller
              control={control}
              name={`airbrushings.${index}.name`}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Nome da aerografia"
                  editable={!isSubmitting}
                  error={!!errors.airbrushings?.[index]?.name}
                />
              )}
            />
          </SimpleFormField>

          <SimpleFormField label="Descrição" error={errors.airbrushings?.[index]?.description}>
            <Controller
              control={control}
              name={`airbrushings.${index}.description`}
              render={({ field: { onChange, onBlur, value } }) => (
                <Textarea
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Descrição da aerografia"
                  numberOfLines={3}
                  editable={!isSubmitting}
                  error={!!errors.airbrushings?.[index]?.description}
                />
              )}
            />
          </SimpleFormField>

          <SimpleFormField label="Área (m²)" error={errors.airbrushings?.[index]?.area}>
            <Controller
              control={control}
              name={`airbrushings.${index}.area`}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value ? String(value) : ''}
                  onChangeText={(text) => {
                    const numValue = parseFloat(text);
                    onChange(isNaN(numValue) ? '' : numValue);
                  }}
                  onBlur={onBlur}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  editable={!isSubmitting}
                  error={!!errors.airbrushings?.[index]?.area}
                />
              )}
            />
          </SimpleFormField>
        </View>
      ))}

      {/* Add Button */}
      <Button
        variant="outline"
        onPress={addAirbrushing}
        disabled={isSubmitting}
        style={styles.addButton}
      >
        <IconPlus size={18} color={colors.primary} />
        <ThemedText style={{ marginLeft: 8 }}>Adicionar Aerografia</ThemedText>
      </Button>
    </FormCard>
  );
}

const styles = StyleSheet.create({
  airbrushingItem: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  airbrushingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  airbrushingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});