/**
 * Truck Layout Section Component
 * Handles truck layout configuration for each side (driver, passenger, back)
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { ThemedText } from '@/components/ui/themed-text';
import { LayoutForm } from '@/components/production/layout/layout-form';
import { useAuth } from '@/hooks/useAuth';
import { SECTOR_PRIVILEGES } from '@/constants';

interface TruckLayoutSectionProps {
  isSubmitting?: boolean;
  errors?: any;
  existingLayouts?: any;
}

export default function TruckLayoutSection({
  isSubmitting = false,
  errors = {},
  existingLayouts
}: TruckLayoutSectionProps) {
  const { control } = useFormContext();
  const { user } = useAuth();
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | 'back'>('left');

  // Watch nested truck object to determine if a truck is associated
  const truck = useWatch({ control, name: 'truck' });
  const hasTruck = !!(truck?.plate || truck?.category || truck?.chassisNumber);

  // Only show for Admin, Logistic, and Production team leaders
  const userPrivilege = user?.sector?.privileges;
  const isAdminUser = userPrivilege === SECTOR_PRIVILEGES.ADMIN;
  const isLogisticUser = userPrivilege === SECTOR_PRIVILEGES.LOGISTIC;
  const isProductionLeader = userPrivilege === SECTOR_PRIVILEGES.PRODUCTION && user?.managedSector;

  const canViewSection = isAdminUser || isLogisticUser || isProductionLeader;

  if (!canViewSection || !hasTruck) {
    return null;
  }

  const sideLabels = {
    left: 'Motorista',
    right: 'Sapo',
    back: 'Traseira'
  };

  return (
    <FormCard title="Layout do Caminhão" icon="IconTruck">
      {/* Side Selector */}
      <View style={styles.sideSelector}>
        {(['left', 'right', 'back'] as const).map((side) => (
          <View
            key={side}
            style={[
              styles.sideSelectorItem,
              selectedSide === side && styles.sideSelectorItemActive
            ]}
            onTouchEnd={() => setSelectedSide(side)}
          >
            <ThemedText style={[
              styles.sideSelectorLabel,
              selectedSide === side && styles.sideSelectorLabelActive
            ]}>
              {sideLabels[side]}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Layout Form for Selected Side */}
      <Controller
        control={control}
        name="layouts"
        render={({ field: { onChange, value } }) => (
          <LayoutForm
            layouts={value || {}}
            selectedSide={selectedSide}
            onChange={(side, data) => {
              onChange({
                ...value,
                [side]: data,
              });
            }}
            disabled={isSubmitting}
            embedded={true}
          />
        )}
      />

      {/* Total Length Display */}
      <View style={styles.totalLength}>
        <ThemedText style={styles.totalLengthLabel}>Comprimento Total:</ThemedText>
        <ThemedText style={styles.totalLengthValue}>
          {calculateTotalLength(useWatch({ control, name: 'layouts' }))} cm
        </ThemedText>
      </View>
    </FormCard>
  );
}

function calculateTotalLength(layouts: any): number {
  if (!layouts) return 0;

  let maxLength = 0;
  ['left', 'right', 'back'].forEach((side) => {
    const layout = layouts[side];
    if (layout?.layoutSections) {
      const sideLength = layout.layoutSections.reduce((sum: number, section: any) => {
        return sum + (section.width || 0);
      }, 0);
      maxLength = Math.max(maxLength, sideLength);
    }
  });

  return maxLength;
}

const styles = StyleSheet.create({
  sideSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    padding: 4,
  },
  sideSelectorItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  sideSelectorItemActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sideSelectorLabel: {
    fontSize: 14,
    color: '#666',
  },
  sideSelectorLabelActive: {
    color: '#000',
    fontWeight: '600',
  },
  totalLength: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLengthLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalLengthValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});