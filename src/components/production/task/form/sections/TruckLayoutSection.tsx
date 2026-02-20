/**
 * Truck Layout Section Component
 * Handles truck layout configuration for each side (driver, passenger, back)
 *
 * Layout changes are tracked OUTSIDE react-hook-form's dirty system (matching web).
 * The parent (TaskForm) passes onLayoutChange callback to collect modified layout data.
 */

import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { ThemedText } from '@/components/ui/themed-text';
import { LayoutForm } from '@/components/production/layout/layout-form';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme';
import { SECTOR_PRIVILEGES } from '@/constants';

interface TruckLayoutSectionProps {
  isSubmitting?: boolean;
  errors?: any;
  existingLayouts?: any;
  onLayoutChange?: (side: string, data: any) => void;
}

export default function TruckLayoutSection({
  isSubmitting = false,
  errors = {},
  existingLayouts,
  onLayoutChange,
}: TruckLayoutSectionProps) {
  const { control } = useFormContext();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | 'back'>('left');

  // Track initial state emissions to distinguish from real user changes (matching web pattern)
  const initialStateEmittedRef = useRef<Record<string, boolean>>({});

  // Watch nested truck object to determine if a truck is associated
  const truck = useWatch({ control, name: 'truck' });
  const hasTruck = !!(truck?.plate || truck?.category || truck?.chassisNumber);

  // Only show for Admin, Logistic, and Production team leaders
  const userPrivilege = user?.sector?.privileges;
  const isAdminUser = userPrivilege === SECTOR_PRIVILEGES.ADMIN;
  const isLogisticUser = userPrivilege === SECTOR_PRIVILEGES.LOGISTIC;
  const isProductionLeader = userPrivilege === SECTOR_PRIVILEGES.PRODUCTION && user?.managedSector;

  const canViewSection = isAdminUser || isLogisticUser || isProductionLeader;

  // Handle layout changes - filter out initial state emissions
  const handleLayoutChange = useCallback((side: string, data: any) => {
    const hasSavedLayout = existingLayouts?.[side]?.layoutSections?.length > 0;
    const isFirstEmit = !initialStateEmittedRef.current[side];

    // If no saved layout and this is the first emit, it's just initial state - don't mark as modified
    if (!hasSavedLayout && isFirstEmit) {
      initialStateEmittedRef.current[side] = true;
      return;
    }

    initialStateEmittedRef.current[side] = true;
    onLayoutChange?.(side, data);
  }, [existingLayouts, onLayoutChange]);

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
      <View style={[styles.sideSelector, { backgroundColor: colors.muted }]}>
        {(['left', 'right', 'back'] as const).map((side) => (
          <View
            key={side}
            style={[
              styles.sideSelectorItem,
              selectedSide === side && [styles.sideSelectorItemActive, { backgroundColor: colors.card }]
            ]}
            onTouchEnd={() => setSelectedSide(side)}
          >
            <ThemedText style={[
              styles.sideSelectorLabel,
              { color: colors.mutedForeground },
              selectedSide === side && { color: colors.foreground, fontWeight: '600' }
            ]}>
              {sideLabels[side]}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Layout Form for Selected Side — uses existingLayouts directly, not form state */}
      <LayoutForm
        layouts={existingLayouts || {}}
        selectedSide={selectedSide}
        onChange={handleLayoutChange}
        disabled={isSubmitting}
        embedded={true}
      />

    </FormCard>
  );
}

const styles = StyleSheet.create({
  sideSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
  },
  sideSelectorItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  sideSelectorItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sideSelectorLabel: {
    fontSize: 14,
  },
});
