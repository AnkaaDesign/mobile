import React, { useState, useEffect, useMemo } from "react";
import { Modal, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronUp, IconChevronDown, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { usePositions, useSectors } from '../../../../hooks';
import { USER_STATUS, USER_STATUS_LABELS } from '../../../../constants';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Switch } from "@/components/ui/switch";
import type { UserGetManyFormData } from '../../../../schemas';

interface UserFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<UserGetManyFormData>) => void;
  currentFilters: Partial<UserGetManyFormData>;
}

interface FilterState {
  // Status filters
  statuses?: string[];

  // Entity filters
  positionIds?: string[];
  sectorIds?: string[];
  managedSectorIds?: string[];

  // Boolean filters
  verified?: boolean;
  hasManagedSector?: boolean;
}

export function UserFilterModal({ visible, onClose, onApply, currentFilters }: UserFilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["status", "entities"]));

  // Load filter options
  const { data: positionsData } = usePositions({ limit: 100, orderBy: { name: "asc" } });
  const { data: sectorsData } = useSectors({ limit: 100, orderBy: { name: "asc" } });

  const positions = positionsData?.data || [];
  const sectors = sectorsData?.data || [];

  // Reset filters when modal opens
  useEffect(() => {
    setFilters(currentFilters || {});
  }, [currentFilters, visible]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.statuses?.length) count++;
    if (filters.positionIds?.length) count++;
    if (filters.sectorIds?.length) count++;
    if (filters.managedSectorIds?.length) count++;
    if (filters.verified !== undefined) count++;
    if (filters.hasManagedSector !== undefined) count++;

    return count;
  }, [filters]);

  // Filter handlers
  const handleArrayChange = (key: keyof FilterState, value: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value.length > 0 ? value : undefined,
    }));
  };

  const handleBooleanChange = (key: keyof FilterState, value: boolean | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Section toggle
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Convert filters to query format
  const convertToQueryFormat = (filterState: FilterState): Partial<UserGetManyFormData> => {
    const queryFilters: Partial<UserGetManyFormData> = {};

    // Build where clause
    const where: any = {};

    if (filterState.statuses?.length) {
      where.status = { in: filterState.statuses };
    }

    if (filterState.positionIds?.length) {
      where.positionId = { in: filterState.positionIds };
    }

    if (filterState.sectorIds?.length) {
      where.sectorId = { in: filterState.sectorIds };
    }

    if (filterState.managedSectorIds?.length) {
      where.managedSectorId = { in: filterState.managedSectorIds };
    }

    if (filterState.verified !== undefined) {
      where.verified = filterState.verified;
    }

    if (filterState.hasManagedSector !== undefined) {
      where.hasManagedSector = filterState.hasManagedSector;
    }

    if (Object.keys(where).length > 0) {
      queryFilters.where = where;
    }

    return queryFilters;
  };

  const handleApply = () => {
    const queryFilters = convertToQueryFormat(filters);
    onApply(queryFilters);
  };

  const handleClear = () => {
    setFilters({});
    onApply({});
  };

  // Collapsible section component
  const Section = ({ title, sectionKey, children }: { title: string; sectionKey: string; children: React.ReactNode }) => {
    const isExpanded = expandedSections.has(sectionKey);

    return (
      <View style={styles.section}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(sectionKey)}>
          <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
          {isExpanded ? <IconChevronUp size={20} color={colors.foreground} /> : <IconChevronDown size={20} color={colors.foreground} />}
        </TouchableOpacity>
        {isExpanded && <View style={styles.sectionContent}>{children}</View>}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <ThemedText style={styles.title}>Filtros</ThemedText>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" size="sm" style={styles.filterBadge}>
                <ThemedText style={styles.filterBadgeText}>{activeFilterCount}</ThemedText>
              </Badge>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconX size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Filter Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status Section */}
          <Section title="Status" sectionKey="status">
            <View style={styles.fieldGroup}>
              <Label>Status do Usuário</Label>
              <MultiCombobox
                options={Object.values(USER_STATUS).map((status) => ({
                  label: USER_STATUS_LABELS[status],
                  value: status,
                }))}
                selectedValues={filters.statuses || []}
                onChange={(values) => handleArrayChange("statuses", values)}
                placeholder="Selecione status..."
                emptyText="Nenhum status disponível"
              />
            </View>
          </Section>

          <Separator />

          {/* Entity Filters Section */}
          <Section title="Cargo e Setor" sectionKey="entities">
            <View style={styles.fieldGroup}>
              <Label>Cargos</Label>
              <MultiCombobox
                options={positions.map((position) => ({
                  label: position.name,
                  value: position.id,
                }))}
                selectedValues={filters.positionIds || []}
                onChange={(values) => handleArrayChange("positionIds", values)}
                placeholder="Selecione cargos..."
                emptyText="Nenhum cargo disponível"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Label>Setores</Label>
              <MultiCombobox
                options={sectors.map((sector) => ({
                  label: sector.name,
                  value: sector.id,
                }))}
                selectedValues={filters.sectorIds || []}
                onChange={(values) => handleArrayChange("sectorIds", values)}
                placeholder="Selecione setores..."
                emptyText="Nenhum setor disponível"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Label>Setores Gerenciados</Label>
              <MultiCombobox
                options={sectors.map((sector) => ({
                  label: sector.name,
                  value: sector.id,
                }))}
                selectedValues={filters.managedSectorIds || []}
                onChange={(values) => handleArrayChange("managedSectorIds", values)}
                placeholder="Selecione setores gerenciados..."
                emptyText="Nenhum setor disponível"
              />
            </View>
          </Section>

          <Separator />

          {/* Verification & Permissions Section */}
          <Section title="Verificação e Permissões" sectionKey="verification">
            <View style={styles.fieldGroup}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Label>Usuário Verificado</Label>
                  <ThemedText style={styles.switchDescription}>Filtrar por usuários com email verificado</ThemedText>
                </View>
                <View style={styles.switchControl}>
                  <Switch
                    checked={filters.verified}
                    onCheckedChange={(checked) => handleBooleanChange("verified", checked ? true : undefined)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Label>Gerencia Setor</Label>
                  <ThemedText style={styles.switchDescription}>Filtrar por usuários que gerenciam setores</ThemedText>
                </View>
                <View style={styles.switchControl}>
                  <Switch
                    checked={filters.hasManagedSector}
                    onCheckedChange={(checked) => handleBooleanChange("hasManagedSector", checked ? true : undefined)}
                  />
                </View>
              </View>
            </View>
          </Section>
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button variant="outline" onPress={handleClear} style={styles.footerButton}>
            <ThemedText>Limpar Filtros</ThemedText>
          </Button>
          <Button onPress={handleApply} style={styles.footerButton}>
            <ThemedText style={{ color: colors.primaryForeground }}>Aplicar Filtros</ThemedText>
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  filterBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    paddingVertical: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  sectionContent: {
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    flex: 1,
    gap: spacing.xs,
  },
  switchDescription: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  switchControl: {
    marginLeft: spacing.md,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});
