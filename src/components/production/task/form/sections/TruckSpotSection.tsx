/**
 * Truck Spot Section Component
 * Handles truck location/spot assignment
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { SimpleFormField } from '@/components/ui';
import { Combobox } from '@/components/ui/combobox';
import { useAuth } from '@/hooks/useAuth';
import { SECTOR_PRIVILEGES } from '@/constants';
import { getParkingSpots } from '@/api-client';

interface TruckSpotSectionProps {
  isSubmitting?: boolean;
  errors?: any;
}

export default function TruckSpotSection({
  isSubmitting = false,
  errors = {}
}: TruckSpotSectionProps) {
  const { control } = useFormContext();
  const { user } = useAuth();

  // Watch truck ID to enable/disable this section
  const truckId = useWatch({ control, name: 'truckId' });

  // Only show for Admin and Logistic users when truck is selected
  const userPrivilege = user?.sector?.privileges;
  const isAdminUser = userPrivilege === SECTOR_PRIVILEGES.ADMIN;
  const isLogisticUser = userPrivilege === SECTOR_PRIVILEGES.LOGISTIC;

  if (!isAdminUser && !isLogisticUser) {
    return null;
  }

  if (!truckId) {
    return null;
  }

  // Search function for spots
  const searchSpots = async (search: string, page: number = 1) => {
    try {
      const params: any = {
        orderBy: { name: 'asc' },
        page: page,
        take: 20,
        where: {}
      };

      if (search && search.trim()) {
        params.where.name = { contains: search, mode: 'insensitive' };
      }

      const response = await getParkingSpots(params);

      return {
        data: response?.data || [],
        hasMore: response?.meta?.hasNextPage || false,
      };
    } catch (error) {
      console.error('[TruckSpotSection] Error fetching spots:', error);
      return { data: [], hasMore: false };
    }
  };

  return (
    <FormCard title="Local do Caminhão" icon="IconMapPin">
      <SimpleFormField label="Local/Vaga" error={errors.spotId}>
        <Controller
          control={control}
          name="spotId"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Combobox
              value={value || ''}
              onValueChange={onChange}
              placeholder="Selecione o local do caminhão"
              searchPlaceholder="Buscar local..."
              emptyText="Nenhum local encontrado"
              disabled={isSubmitting || !truckId}
              error={error?.message}
              async={true}
              queryKey={['spots', 'search']}
              queryFn={searchSpots}
              getOptionLabel={(spot: any) => spot.name}
              getOptionValue={(spot: any) => spot.id}
              clearable={true}
              minSearchLength={0}
              pageSize={20}
              debounceMs={500}
              loadOnMount={false}
            />
          )}
        />
      </SimpleFormField>
    </FormCard>
  );
}

const styles = StyleSheet.create({
  // Add any specific styles if needed
});