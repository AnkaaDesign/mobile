import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Combobox } from '@/components/ui/combobox';
import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize } from '@/constants/design-system';
import {
  getGaragesAvailability,
  type GarageAvailability,
  type LaneAvailability,
} from '@/api-client/truck';
import { TRUCK_SPOT } from '@/constants';

type GarageId = 'B1' | 'B2' | 'B3';
type LaneId = 'F1' | 'F2' | 'F3';
type SpotNumber = 1 | 2 | 3;

interface SpotSelectorProps {
  truckLength: number | null;
  currentSpot: TRUCK_SPOT | null;
  truckId?: string;
  onSpotChange: (spot: TRUCK_SPOT | null) => void;
  disabled?: boolean;
}

const GARAGE_LABELS: Record<GarageId, string> = {
  B1: 'Barracão 1',
  B2: 'Barracão 2',
  B3: 'Barracão 3',
};

const LANE_LABELS: Record<LaneId, string> = {
  F1: 'Faixa 1',
  F2: 'Faixa 2',
  F3: 'Faixa 3',
};

const SPOT_LABELS: Record<SpotNumber, string> = {
  1: 'Vaga 1',
  2: 'Vaga 2',
  3: 'Vaga 3',
};

function parseSpot(spot: TRUCK_SPOT | null): {
  garage: GarageId | null;
  lane: LaneId | null;
  spotNumber: SpotNumber | null;
} {
  if (!spot) {
    return { garage: null, lane: null, spotNumber: null };
  }

  const match = spot.match(/^B(\d)_F(\d)_V(\d)$/);
  if (!match) {
    return { garage: null, lane: null, spotNumber: null };
  }

  return {
    garage: `B${match[1]}` as GarageId,
    lane: `F${match[2]}` as LaneId,
    spotNumber: parseInt(match[3], 10) as SpotNumber,
  };
}

function buildSpot(garage: GarageId, lane: LaneId, spotNumber: SpotNumber): TRUCK_SPOT {
  const key = `${garage}_${lane}_V${spotNumber}` as keyof typeof TRUCK_SPOT;
  return TRUCK_SPOT[key];
}

export function SpotSelector({
  truckLength,
  currentSpot,
  truckId,
  onSpotChange,
  disabled = false,
}: SpotSelectorProps) {
  const { colors } = useTheme();

  // Parse current spot to initialize state
  const parsedSpot = useMemo(() => parseSpot(currentSpot), [currentSpot]);

  const [selectedGarage, setSelectedGarage] = useState<GarageId | 'PATIO' | null>(
    parsedSpot.garage
  );
  const [selectedLane, setSelectedLane] = useState<LaneId | null>(parsedSpot.lane);
  const [selectedSpotNumber, setSelectedSpotNumber] = useState<SpotNumber | null>(parsedSpot.spotNumber);

  // Fetch garage availability when truck length is available
  const { data: garagesAvailability, isLoading } = useQuery({
    queryKey: ['garages-availability', truckLength, truckId],
    queryFn: () => getGaragesAvailability(truckLength!, truckId),
    enabled: !!truckLength && truckLength > 0,
  });

  // Get availability data
  const garages = garagesAvailability?.data || [];

  // Find selected garage data
  const selectedGarageData = useMemo(() => {
    if (!selectedGarage || selectedGarage === 'PATIO') return null;
    const garageToFind = selectedGarage as GarageId;
    return garages.find((g) => g.garageId === garageToFind) ?? null;
  }, [garages, selectedGarage]);

  // Find selected lane data
  const selectedLaneData = useMemo(() => {
    if (!selectedGarageData || !selectedLane) return null;
    return selectedGarageData.lanes.find((l) => l.laneId === selectedLane) ?? null;
  }, [selectedGarageData, selectedLane]);

  // Garage options (including Patio)
  const garageOptions = useMemo(() => {
    const options = [
      {
        value: 'PATIO',
        label: 'Patio (sem vaga)',
        disabled: false,
      },
    ];

    const garageIds: GarageId[] = ['B1', 'B2', 'B3'];
    for (const garageId of garageIds) {
      const garageData = garages.find((g) => g.garageId === garageId);
      const canFit = garageData?.canFit ?? true;

      // Count lanes that can fit this truck
      const availableLanes = garageData?.lanes.filter((l) => l.canFit).length ?? 0;

      // Build descriptive label
      let description: string;
      if (!garageData) {
        description = '';
      } else if (availableLanes === 0) {
        description = 'cheio';
      } else if (availableLanes === 1) {
        description = '1 faixa livre';
      } else {
        description = `${availableLanes} faixas livres`;
      }

      options.push({
        value: garageId,
        label: description ? `${GARAGE_LABELS[garageId]} (${description})` : GARAGE_LABELS[garageId],
        disabled: !canFit && garageId !== parsedSpot.garage,
      });
    }

    return options;
  }, [garages, parsedSpot.garage]);

  // Lane options for selected garage
  const laneOptions = useMemo(() => {
    if (!selectedGarageData) return [];

    return selectedGarageData.lanes.map((lane) => ({
      value: lane.laneId as string,
      label: `${LANE_LABELS[lane.laneId as LaneId]} (${lane.availableSpace.toFixed(1)}m livre)`,
      disabled: !lane.canFit && lane.laneId !== parsedSpot.lane,
    }));
  }, [selectedGarageData, parsedSpot.lane]);

  // Spot options for selected lane
  // Show V3 when: current task is at V3, OR (V1 and V2 are occupied AND at least 6m available)
  const spotOptions = useMemo(() => {
    if (!selectedLaneData || !selectedGarage || selectedGarage === 'PATIO') return [];

    const spots: { value: string; label: string; disabled: boolean }[] = [];
    const maxSpots = 2; // Only show V1 and V2 by default

    for (let i = 1; i <= maxSpots; i++) {
      const spotNum = i as SpotNumber;
      const isOccupied = selectedLaneData.occupiedSpots.includes(spotNum);
      const isCurrentSpot = parsedSpot.spotNumber === spotNum && parsedSpot.lane === selectedLane && parsedSpot.garage === selectedGarage;

      // Find who occupies this spot
      const occupant = selectedLaneData.spotOccupants?.find((o) => o.spotNumber === spotNum);

      // Build label with occupant info if occupied
      let label = SPOT_LABELS[spotNum];
      if (isOccupied && !isCurrentSpot && occupant) {
        const taskName = occupant.taskName || 'Sem tarefa';
        const truncatedName = taskName.length > 15 ? taskName.slice(0, 15) + '...' : taskName;
        label = `${SPOT_LABELS[spotNum]} - ${truncatedName}`;
      }

      spots.push({
        value: String(spotNum),
        label,
        disabled: isOccupied && !isCurrentSpot,
      });
    }

    // Show V3 when:
    // 1. Current task is already at V3, OR
    // 2. V1 and V2 are both occupied AND there's at least 6m of available space
    const isCurrentAtV3 = parsedSpot.spotNumber === 3 && parsedSpot.lane === selectedLane && parsedSpot.garage === selectedGarage;
    const v1Occupied = selectedLaneData.occupiedSpots.includes(1);
    const v2Occupied = selectedLaneData.occupiedSpots.includes(2);
    const hasEnoughSpace = !!truckLength && selectedLaneData.availableSpace >= truckLength + 2;
    const v3IsOccupied = selectedLaneData.occupiedSpots.includes(3);

    if (isCurrentAtV3) {
      spots.push({
        value: '3',
        label: `${SPOT_LABELS[3]} (atual)`,
        disabled: false,
      });
    } else if (v1Occupied && v2Occupied && hasEnoughSpace) {
      // V3 available when V1/V2 are full and there's 6m+ space
      const v3Occupant = selectedLaneData.spotOccupants?.find((o) => o.spotNumber === 3);
      let v3Label = SPOT_LABELS[3];
      if (v3IsOccupied && v3Occupant) {
        const taskName = v3Occupant.taskName || 'Sem tarefa';
        const truncatedName = taskName.length > 15 ? taskName.slice(0, 15) + '...' : taskName;
        v3Label = `${SPOT_LABELS[3]} - ${truncatedName}`;
      }
      spots.push({
        value: '3',
        label: v3Label,
        disabled: v3IsOccupied,
      });
    }

    return spots;
  }, [selectedLaneData, selectedGarage, selectedLane, parsedSpot, truckLength]);

  // Handle garage change
  const handleGarageChange = useCallback((value: string | string[] | null | undefined) => {
    const stringValue = Array.isArray(value) ? value[0] : value;
    if (stringValue === 'PATIO') {
      setSelectedGarage('PATIO');
      setSelectedLane(null);
      setSelectedSpotNumber(null);
      onSpotChange(null); // Clear spot when Patio is selected
    } else if (stringValue) {
      setSelectedGarage(stringValue as GarageId);
      setSelectedLane(null);
      setSelectedSpotNumber(null);
    } else {
      setSelectedGarage(null);
      setSelectedLane(null);
      setSelectedSpotNumber(null);
    }
  }, [onSpotChange]);

  // Handle lane change
  const handleLaneChange = useCallback((value: string | string[] | null | undefined) => {
    const stringValue = Array.isArray(value) ? value[0] : value;
    if (stringValue) {
      setSelectedLane(stringValue as LaneId);
      setSelectedSpotNumber(null);
    } else {
      setSelectedLane(null);
      setSelectedSpotNumber(null);
    }
  }, []);

  // Handle spot change
  const handleSpotChange = useCallback((value: string | string[] | null | undefined) => {
    const stringValue = Array.isArray(value) ? value[0] : value;
    if (stringValue && selectedGarage && selectedGarage !== 'PATIO' && selectedLane) {
      const spotNum = parseInt(stringValue, 10) as SpotNumber;
      setSelectedSpotNumber(spotNum);
      const newSpot = buildSpot(selectedGarage, selectedLane, spotNum);
      onSpotChange(newSpot);
    } else {
      setSelectedSpotNumber(null);
    }
  }, [selectedGarage, selectedLane, onSpotChange]);

  // Sync state when currentSpot changes externally
  useEffect(() => {
    const parsed = parseSpot(currentSpot);
    if (parsed.garage) {
      setSelectedGarage(parsed.garage);
      setSelectedLane(parsed.lane);
      setSelectedSpotNumber(parsed.spotNumber);
    }
  }, [currentSpot]);

  const isDisabled = disabled || !truckLength || truckLength <= 0;

  return (
    <View style={styles.container}>
      {!truckLength || truckLength <= 0 ? (
        <ThemedText style={[styles.placeholder, { color: colors.mutedForeground }]}>
          Preencha o layout do caminhao para selecionar o local
        </ThemedText>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Carregando disponibilidade...
          </ThemedText>
        </View>
      ) : (
        <View style={styles.selectorsContainer}>
          {/* Garage selector */}
          <Combobox
            value={selectedGarage ?? undefined}
            onValueChange={handleGarageChange}
            options={garageOptions}
            placeholder="Selecione o barracao"
            disabled={isDisabled}
            searchable={false}
          />

          {/* Lane selector */}
          <Combobox
            value={selectedLane ?? undefined}
            onValueChange={handleLaneChange}
            options={laneOptions}
            placeholder="Selecione a faixa"
            disabled={isDisabled || !selectedGarage || selectedGarage === 'PATIO'}
            searchable={false}
          />

          {/* Spot selector */}
          <Combobox
            value={selectedSpotNumber ? String(selectedSpotNumber) : undefined}
            onValueChange={handleSpotChange}
            options={spotOptions}
            placeholder="Selecione a vaga"
            disabled={isDisabled || !selectedLane}
            searchable={false}
          />
        </View>
      )}

      {/* Current spot display */}
      {currentSpot && (
        <ThemedText style={[styles.currentSpot, { color: colors.mutedForeground }]}>
          Local atual: {currentSpot.replace(/_/g, '-')}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  placeholder: {
    fontSize: fontSize.sm,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
  selectorsContainer: {
    gap: spacing.sm,
  },
  currentSpot: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});

export default SpotSelector;
