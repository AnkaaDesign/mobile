import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconFilter, IconX, IconCalendarPlus, IconScissors, IconMapPin, IconUsers, IconBriefcase } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { DatePicker } from '@/components/ui/date-picker';
import { CUT_STATUS, CUT_STATUS_LABELS, CUT_TYPE, CUT_TYPE_LABELS, CUT_ORIGIN, CUT_ORIGIN_LABELS, SECTOR_PRIVILEGES } from '@/constants';
import { useSectors } from '@/hooks';
import { useAuth } from '@/contexts/auth-context';
import { isTeamLeader } from '@/utils/user';

// Special value for tasks without a sector
const UNDEFINED_SECTOR_VALUE = "__UNDEFINED__";

interface CutsFilterDrawerContentProps {
  filters: {
    status?: string[];
    type?: string[];
    origin?: string[];
    sectorIds?: string[];
    dateRange?: { gte?: Date; lte?: Date };
  };
  onFiltersChange: (filters: any) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

export function CutsFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: CutsFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState(() => filters || {});

  // Check if user is a team leader (they have automatic sector filtering)
  // Note: Team leadership is now determined by managedSector relationship (user.managedSector?.id)
  const shouldHideSectorFilter = useMemo(() => {
    return isTeamLeader(user);
  }, [user]);

  // Fetch production sectors (only if not hidden)
  const { data: sectorsData } = useSectors({ limit: 100, enabled: !shouldHideSectorFilter });
  const sectors = useMemo(() => {
    if (shouldHideSectorFilter) return [];
    const items = sectorsData?.data || [];
    return items.filter((sector: any) => sector.privileges === SECTOR_PRIVILEGES.PRODUCTION);
  }, [sectorsData, shouldHideSectorFilter]);

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    const handleClose = onClose || (() => {}); handleClose();
  }, [localFilters, onFiltersChange, onClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  // Toggle a status in the status array
  const toggleStatus = useCallback((status: string) => {
    setLocalFilters(prev => {
      const currentStatuses = prev.status || [];
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter(s => s !== status)
        : [...currentStatuses, status];

      return {
        ...prev,
        status: newStatuses.length > 0 ? newStatuses : undefined
      };
    });
  }, []);

  // Toggle a type in the type array
  const toggleType = useCallback((type: string) => {
    setLocalFilters(prev => {
      const currentTypes = prev.type || [];
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type];

      return {
        ...prev,
        type: newTypes.length > 0 ? newTypes : undefined
      };
    });
  }, []);

  // Toggle an origin in the origin array
  const toggleOrigin = useCallback((origin: string) => {
    setLocalFilters(prev => {
      const currentOrigins = prev.origin || [];
      const newOrigins = currentOrigins.includes(origin)
        ? currentOrigins.filter(o => o !== origin)
        : [...currentOrigins, origin];

      return {
        ...prev,
        origin: newOrigins.length > 0 ? newOrigins : undefined
      };
    });
  }, []);

  // Toggle a sector in the sectorIds array
  const toggleSector = useCallback((sectorId: string) => {
    setLocalFilters(prev => {
      const currentSectors = prev.sectorIds || [];
      const newSectors = currentSectors.includes(sectorId)
        ? currentSectors.filter(s => s !== sectorId)
        : [...currentSectors, sectorId];

      return {
        ...prev,
        sectorIds: newSectors.length > 0 ? newSectors : undefined
      };
    });
  }, []);

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
          <ThemedText style={styles.title}>Filtros de Cortes</ThemedText>
          {activeFiltersCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.destructive }]}>
              <ThemedText style={[styles.countText, { color: colors.destructiveForeground }]}>
                {activeFiltersCount}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onClose || (() => {})} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
        showsVerticalScrollIndicator={true}
      >
        {/* Status Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBriefcase size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          <View style={styles.statusGrid}>
            {Object.values(CUT_STATUS).map((status) => {
              const isSelected = localFilters.status?.includes(status);
              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => toggleStatus(status)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={[
                    styles.statusChipText,
                    { color: isSelected ? colors.primaryForeground : colors.foreground }
                  ]}>
                    {CUT_STATUS_LABELS[status]}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Type Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconScissors size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tipo
            </ThemedText>
          </View>

          <View style={styles.statusGrid}>
            {Object.values(CUT_TYPE).map((type) => {
              const isSelected = localFilters.type?.includes(type);
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => toggleType(type)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={[
                    styles.statusChipText,
                    { color: isSelected ? colors.primaryForeground : colors.foreground }
                  ]}>
                    {CUT_TYPE_LABELS[type]}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Origin Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconMapPin size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Origem
            </ThemedText>
          </View>

          <View style={styles.statusGrid}>
            {Object.values(CUT_ORIGIN).map((origin) => {
              const isSelected = localFilters.origin?.includes(origin);
              return (
                <TouchableOpacity
                  key={origin}
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => toggleOrigin(origin)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={[
                    styles.statusChipText,
                    { color: isSelected ? colors.primaryForeground : colors.foreground }
                  ]}>
                    {CUT_ORIGIN_LABELS[origin]}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sector Filter - Hidden for team leaders who have automatic sector filtering */}
        {!shouldHideSectorFilter && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconUsers size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Setor da Tarefa
              </ThemedText>
            </View>

            <View style={styles.statusGrid}>
              {/* Indefinido option */}
              <TouchableOpacity
                key={UNDEFINED_SECTOR_VALUE}
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: localFilters.sectorIds?.includes(UNDEFINED_SECTOR_VALUE) ? colors.primary : colors.card,
                    borderColor: localFilters.sectorIds?.includes(UNDEFINED_SECTOR_VALUE) ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => toggleSector(UNDEFINED_SECTOR_VALUE)}
                activeOpacity={0.7}
              >
                <ThemedText style={[
                  styles.statusChipText,
                  { color: localFilters.sectorIds?.includes(UNDEFINED_SECTOR_VALUE) ? colors.primaryForeground : colors.foreground }
                ]}>
                  Indefinido
                </ThemedText>
              </TouchableOpacity>
              {/* Production sectors */}
              {sectors.map((sector: any) => {
                const isSelected = localFilters.sectorIds?.includes(sector.id);
                return (
                  <TouchableOpacity
                    key={sector.id}
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => toggleSector(sector.id)}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={[
                      styles.statusChipText,
                      { color: isSelected ? colors.primaryForeground : colors.foreground }
                    ]}>
                      {sector.name}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Date Range Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data de Criação
            </ThemedText>
          </View>

          <View style={styles.rangeInputs}>
            <View style={styles.rangeInput}>
              <ThemedText style={[styles.inputLabel, { color: colors.mutedForeground }]}>De</ThemedText>
              <DatePicker
                type="date"
                value={localFilters.dateRange?.gte}
                onChange={(date) => setLocalFilters(prev => ({
                  ...prev,
                  dateRange: {
                    ...prev.dateRange,
                    gte: date
                  }
                }))}
                placeholder="Data inicial"
              />
            </View>

            <View style={styles.rangeInput}>
              <ThemedText style={[styles.inputLabel, { color: colors.mutedForeground }]}>Até</ThemedText>
              <DatePicker
                type="date"
                value={localFilters.dateRange?.lte}
                onChange={(date) => setLocalFilters(prev => ({
                  ...prev,
                  dateRange: {
                    ...prev.dateRange,
                    lte: date
                  }
                }))}
                placeholder="Data final"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 16)
      }]}>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleClear}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.footerBtnText}>Limpar</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={handleApply}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.footerBtnText, { color: colors.primaryForeground }]}>Aplicar</ThemedText>
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  rangeInputs: {
    flexDirection: "row",
    gap: 12,
  },
  rangeInput: {
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footerBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
