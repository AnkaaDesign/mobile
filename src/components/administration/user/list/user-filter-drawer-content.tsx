import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconFilter, IconX, IconCheck } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getFilterIcon } from '@/lib/filter-icon-mapping';
import {
  BooleanFilter,
  MultiSelectFilter,
} from '@/components/common/filters';
import { usePositions, useSectors } from "@/hooks";
import { USER_STATUS, USER_STATUS_LABELS } from "@/constants";
import { spacing } from '@/constants/design-system';
import type { UserGetManyFormData } from '../../../../schemas';

interface UserFilterDrawerContentProps {
  filters: Partial<UserGetManyFormData>;
  onFiltersChange: (filters: Partial<UserGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterState {
  statuses?: string[];
  positionIds?: string[];
  sectorIds?: string[];
  managedSectorIds?: string[];
  verified?: boolean;
  hasManagedSector?: boolean;
}

export function UserFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: UserFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const handleClose = onClose || (() => {});

  // Load filter options
  const { data: positionsData } = usePositions({ limit: 100, orderBy: { name: 'asc' } });
  const { data: sectorsData } = useSectors({ limit: 100, orderBy: { name: 'asc' } });

  const positions = positionsData?.data || [];
  const sectors = sectorsData?.data || [];

  // Initialize localFilters from current filters
  const [localFilters, setLocalFilters] = useState<FilterState>(() => {
    const where = filters.where || {};
    return {
      statuses: where.status?.in || [],
      positionIds: where.positionId?.in || [],
      sectorIds: where.sectorId?.in || [],
      managedSectorIds: where.managedSectorId?.in || [],
      verified: where.verified,
      hasManagedSector: where.hasManagedSector,
    };
  });

  const handleApply = useCallback(() => {
    const newFilters: Partial<UserGetManyFormData> = {};
    const where: any = {};

    if (localFilters.statuses && localFilters.statuses.length > 0) {
      where.status = { in: localFilters.statuses };
    }

    if (localFilters.positionIds && localFilters.positionIds.length > 0) {
      where.positionId = { in: localFilters.positionIds };
    }

    if (localFilters.sectorIds && localFilters.sectorIds.length > 0) {
      where.sectorId = { in: localFilters.sectorIds };
    }

    if (localFilters.managedSectorIds && localFilters.managedSectorIds.length > 0) {
      where.managedSectorId = { in: localFilters.managedSectorIds };
    }

    if (localFilters.verified !== undefined) {
      where.verified = localFilters.verified;
    }

    if (localFilters.hasManagedSector !== undefined) {
      where.hasManagedSector = localFilters.hasManagedSector;
    }

    if (Object.keys(where).length > 0) {
      newFilters.where = where;
    }

    onFiltersChange(newFilters);
    handleClose();
  }, [localFilters, onFiltersChange, handleClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const statusOptions = useMemo(
    () =>
      Object.values(USER_STATUS).map((status) => ({
        value: status,
        label: USER_STATUS_LABELS[status],
      })),
    []
  );

  const positionOptions = useMemo(
    () =>
      positions.map((position) => ({
        value: position.id,
        label: position.name,
      })),
    [positions]
  );

  const sectorOptions = useMemo(
    () =>
      sectors.map((sector) => ({
        value: sector.id,
        label: sector.name,
      })),
    [sectors]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        paddingTop: 18
      }]}>
        <View style={styles.headerContent}>
          <IconFilter size={24} color={colors.foreground} />
          <Text style={styles.title}>Filtros de Usuários</Text>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">
              <Text style={{ fontSize: 12, fontWeight: '600' }}>
                {activeFiltersCount}
              </Text>
            </Badge>
          )}
        </View>
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Filter List - Flat structure with icons */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, {
          paddingBottom: Math.max(insets.bottom, 16) + 90,
          gap: spacing.lg
        }]}
        showsVerticalScrollIndicator={true}
      >
        {/* Multi-Select: Status */}
        <MultiSelectFilter
          label="Status do Usuário"
          icon={getFilterIcon('status')}
          value={localFilters.statuses || []}
          onChange={(values) => setLocalFilters((prev) => ({ ...prev, statuses: values.length > 0 ? values : undefined }))}
          options={statusOptions}
          placeholder="Todos os status"
        />

        <Separator />

        {/* Multi-Select: Positions */}
        <MultiSelectFilter
          label="Cargos"
          icon={getFilterIcon('positionIds')}
          value={localFilters.positionIds || []}
          onChange={(values) => setLocalFilters((prev) => ({ ...prev, positionIds: values.length > 0 ? values : undefined }))}
          options={positionOptions}
          placeholder={positions.length === 0 ? 'Carregando cargos...' : 'Todos os cargos'}
        />

        <Separator />

        {/* Multi-Select: Sectors */}
        <MultiSelectFilter
          label="Setores"
          icon={getFilterIcon('sectorIds')}
          value={localFilters.sectorIds || []}
          onChange={(values) => setLocalFilters((prev) => ({ ...prev, sectorIds: values.length > 0 ? values : undefined }))}
          options={sectorOptions}
          placeholder={sectors.length === 0 ? 'Carregando setores...' : 'Todos os setores'}
        />

        <Separator />

        {/* Multi-Select: Managed Sectors */}
        <MultiSelectFilter
          label="Setores Gerenciados"
          icon={getFilterIcon('managedSectorIds')}
          value={localFilters.managedSectorIds || []}
          onChange={(values) => setLocalFilters((prev) => ({ ...prev, managedSectorIds: values.length > 0 ? values : undefined }))}
          options={sectorOptions}
          placeholder={sectors.length === 0 ? 'Carregando setores...' : 'Todos os setores gerenciados'}
        />

        <Separator />

        {/* Boolean: Verified */}
        <BooleanFilter
          label="Usuário Verificado"
          icon={getFilterIcon('verified')}
          description="Filtrar por usuários com email verificado"
          value={localFilters.verified === true}
          onChange={(value) => setLocalFilters((prev) => ({ ...prev, verified: value ? true : undefined }))}
        />

        <Separator />

        {/* Boolean: Has Managed Sector */}
        <BooleanFilter
          label="Gerencia Setor"
          icon={getFilterIcon('hasManagedSector')}
          description="Filtrar por usuários que gerenciam setores"
          value={localFilters.hasManagedSector === true}
          onChange={(value) => setLocalFilters((prev) => ({ ...prev, hasManagedSector: value ? true : undefined }))}
        />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 16)
      }]}>
        <Button
          variant="outline"
          onPress={handleClear}
          style={styles.footerButton}
        >
          <IconX size={18} color={colors.foreground} />
          <Text style={{ marginLeft: spacing.xs }}>Limpar</Text>
        </Button>
        <Button
          variant="default"
          onPress={handleApply}
          style={styles.footerButton}
        >
          <IconCheck size={18} color={colors.background} />
          <Text style={{ marginLeft: spacing.xs, color: colors.background }}>
            Aplicar
          </Text>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});
