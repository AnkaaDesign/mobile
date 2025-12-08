import { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconAlertTriangle, IconCalendarPlus, IconInfoCircle } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { NOTIFICATION_IMPORTANCE, NOTIFICATION_IMPORTANCE_LABELS, ALERT_TYPE, ALERT_TYPE_LABELS } from "@/constants";
import { Combobox } from '@/components/ui/combobox';
import { DateRangeFilter } from '@/components/common/filters';

export interface AlertFilters {
  severities?: NOTIFICATION_IMPORTANCE[];
  types?: ALERT_TYPE[];
  showAcknowledged?: boolean;
  showResolved?: boolean;
  showUnresolved?: boolean;
  sources?: string[];
  dateRange?: { start?: Date; end?: Date };
}

interface AlertFilterDrawerContentProps {
  filters: AlertFilters;
  onFiltersChange: (filters: AlertFilters) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterState {
  severities?: NOTIFICATION_IMPORTANCE[];
  types?: ALERT_TYPE[];
  showAcknowledged?: boolean;
  showResolved?: boolean;
  showUnresolved?: boolean;
  sources?: string[];
  dateAfter?: Date;
  dateBefore?: Date;
}

export function AlertFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: AlertFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const handleClose = onClose || (() => {});

  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    severities: filters.severities || [],
    types: filters.types || [],
    showAcknowledged: filters.showAcknowledged,
    showResolved: filters.showResolved,
    showUnresolved: filters.showUnresolved,
    sources: filters.sources || [],
    dateAfter: filters.dateRange?.start,
    dateBefore: filters.dateRange?.end,
  }));

  const handleApply = useCallback(() => {
    const newFilters: AlertFilters = {};

    if (localFilters.severities && localFilters.severities.length > 0) {
      newFilters.severities = localFilters.severities;
    }

    if (localFilters.types && localFilters.types.length > 0) {
      newFilters.types = localFilters.types;
    }

    if (localFilters.showAcknowledged !== undefined) {
      newFilters.showAcknowledged = localFilters.showAcknowledged;
    }

    if (localFilters.showResolved !== undefined) {
      newFilters.showResolved = localFilters.showResolved;
    }

    if (localFilters.showUnresolved !== undefined) {
      newFilters.showUnresolved = localFilters.showUnresolved;
    }

    if (localFilters.sources && localFilters.sources.length > 0) {
      newFilters.sources = localFilters.sources;
    }

    if (localFilters.dateAfter || localFilters.dateBefore) {
      newFilters.dateRange = {
        start: localFilters.dateAfter,
        end: localFilters.dateBefore,
      };
    }

    onFiltersChange(newFilters);
    handleClose();
  }, [localFilters, onFiltersChange, handleClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const severityOptions = useMemo(
    () =>
      Object.values(NOTIFICATION_IMPORTANCE).map((severity) => ({
        value: severity,
        label: NOTIFICATION_IMPORTANCE_LABELS[severity],
      })),
    []
  );

  const typeOptions = useMemo(
    () =>
      Object.values(ALERT_TYPE).map((type) => ({
        value: type,
        label: ALERT_TYPE_LABELS[type] || type,
      })),
    []
  );

  const sourceOptions = useMemo(
    () => [
      { value: "Sistema", label: "Sistema" },
      { value: "Serviços", label: "Serviços" },
      { value: "Backup", label: "Backup" },
      { value: "Rede", label: "Rede" },
      { value: "Hardware", label: "Hardware" },
      { value: "Estoque", label: "Estoque" },
      { value: "Pedidos", label: "Pedidos" },
      { value: "Tarefas", label: "Tarefas" },
    ],
    []
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
          <ThemedText style={styles.title}>Filtros de Alertas</ThemedText>
          {activeFiltersCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.destructive }]}>
              <ThemedText style={[styles.countText, { color: colors.destructiveForeground }]}>
                {activeFiltersCount}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
        showsVerticalScrollIndicator={true}
      >
        {/* Severity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconAlertTriangle size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Severidade
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Severidades
            </ThemedText>
            <Combobox
              options={severityOptions}
              value={localFilters.severities || []}
              mode="multiple"
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, severities: (Array.isArray(values) ? values : values ? [values] : []) as NOTIFICATION_IMPORTANCE[] }))}
              placeholder="Todas as severidades"
              searchPlaceholder="Buscar severidades..."
              emptyMessage="Nenhuma severidade encontrada"
            />
          </View>
        </View>

        {/* Alert Type */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconInfoCircle size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tipo de Alerta
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Tipos
            </ThemedText>
            <Combobox
              options={typeOptions}
              value={localFilters.types || []}
              mode="multiple"
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, types: (Array.isArray(values) ? values : values ? [values] : []) as ALERT_TYPE[] }))}
              placeholder="Todos os tipos"
              searchPlaceholder="Buscar tipos..."
              emptyMessage="Nenhum tipo encontrado"
            />
          </View>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconInfoCircle size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, showAcknowledged: !prev.showAcknowledged || undefined }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Exibir Reconhecidos</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Incluir alertas reconhecidos
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.showAcknowledged ?? false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, showAcknowledged: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.showAcknowledged ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, showResolved: !prev.showResolved || undefined }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Exibir Resolvidos</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Incluir alertas resolvidos
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.showResolved ?? false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, showResolved: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.showResolved ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, showUnresolved: !prev.showUnresolved || undefined }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Apenas Não Resolvidos</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas alertas não resolvidos
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.showUnresolved ?? true}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, showUnresolved: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.showUnresolved ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>

        {/* Source */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconInfoCircle size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Origem
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Origens
            </ThemedText>
            <Combobox
              options={sourceOptions}
              value={localFilters.sources || []}
              mode="multiple"
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, sources: Array.isArray(values) ? values : values ? [values] : [] }))}
              placeholder="Todas as origens"
              searchPlaceholder="Buscar origens..."
              emptyMessage="Nenhuma origem encontrada"
            />
          </View>
        </View>

        {/* Date Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Período
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Alertas"
            value={{
              from: localFilters.dateAfter,
              to: localFilters.dateBefore
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                dateAfter: range?.from,
                dateBefore: range?.to
              }))
            }
          />
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
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterTouchable: {
    flex: 1,
    paddingRight: 16,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  filterDescription: {
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
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
