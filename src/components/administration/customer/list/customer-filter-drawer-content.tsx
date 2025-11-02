import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconFilter, IconX, IconCheck } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StringFilter, BooleanFilter } from '@/components/common/filters';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { Input } from '@/components/ui/input';
import { BRAZILIAN_STATES, BRAZILIAN_STATE_NAMES } from '@/constants';
import { spacing } from '@/constants/design-system';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';

interface CustomerFilterDrawerContentProps {
  filters: {
    states?: string[];
    city?: string;
    tags?: string[];
    hasCNPJ?: boolean;
    hasCPF?: boolean;
  };
  onFiltersChange: (filters: any) => void;
  onClear: () => void;
  activeFiltersCount: number;
}

export function CustomerFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
}: CustomerFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  const setFilters = (updater: (prev: any) => any) => {
    onFiltersChange(updater(filters));
  };

  const handleClear = () => {
    onClear();
  };

  const handleApply = () => {
    closeFilterDrawer();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: Math.max(insets.top, spacing.lg),
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
    },
    description: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginTop: spacing.xs,
    },
    closeButton: {
      padding: 4,
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    sectionGap: {
      gap: spacing.md,
    },
    footer: {
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom + spacing.sm, spacing.lg),
      paddingHorizontal: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    actionRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <IconFilter size={24} color={colors.foreground} />
            <Text style={styles.title}>Filtros de Clientes</Text>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                <Text style={{ fontSize: 12, fontWeight: '600' }}>
                  {activeFiltersCount}
                </Text>
              </Badge>
            )}
          </View>
          <Button
            variant="ghost"
            size="sm"
            onPress={closeFilterDrawer}
            style={styles.closeButton}
          >
            <IconX size={20} color={colors.mutedForeground} />
          </Button>
        </View>
        <Text style={styles.description}>Configure os filtros para refinar sua busca</Text>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.sectionGap}>
          <FilterSection
            title="Localização"
            defaultOpen={true}
            badge={(filters.states?.length || 0) + (filters.city ? 1 : 0)}
          >
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Estados</Text>
              <Input
                value={filters.states?.join(", ") || ""}
                onChangeText={(value) => setFilters(prev => ({
                  ...prev,
                  states: value ? value.split(",").map(s => s.trim()).filter(Boolean) : undefined
                }))}
                placeholder="Ex: SP, RJ, MG"
              />
            </View>
            <StringFilter
              label="Cidade"
              value={filters.city}
              onChange={(value) => setFilters(prev => ({ ...prev, city: value as string | undefined }))}
              placeholder="Digite o nome da cidade"
            />
          </FilterSection>

          <Separator />

          <FilterSection
            title="Documentos"
            defaultOpen={false}
            badge={(filters.hasCNPJ ? 1 : 0) + (filters.hasCPF ? 1 : 0)}
          >
            <BooleanFilter
              label="Possui CNPJ"
              description="Mostrar apenas clientes com CNPJ cadastrado"
              value={!!filters.hasCNPJ}
              onChange={(value) => setFilters(prev => ({ ...prev, hasCNPJ: value || undefined }))}
            />
            <BooleanFilter
              label="Possui CPF"
              description="Mostrar apenas clientes com CPF cadastrado"
              value={!!filters.hasCPF}
              onChange={(value) => setFilters(prev => ({ ...prev, hasCPF: value || undefined }))}
            />
          </FilterSection>

          <Separator />

          <FilterSection
            title="Tags"
            defaultOpen={false}
            badge={filters.tags?.length || 0}
          >
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Tags</Text>
              <Input
                value={filters.tags?.join(", ") || ""}
                onChangeText={(value) => setFilters(prev => ({
                  ...prev,
                  tags: value ? value.split(",").map(t => t.trim()).filter(Boolean) : undefined
                }))}
                placeholder="Ex: importante, vip, premium"
              />
            </View>
          </FilterSection>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.actionRow}>
          <Button
            variant="outline"
            onPress={handleClear}
            style={styles.actionButton}
          >
            <IconX size={18} color={colors.foreground} />
            <Text style={{ marginLeft: spacing.xs }}>Limpar</Text>
          </Button>
          <Button
            variant="default"
            onPress={handleApply}
            style={styles.actionButton}
          >
            <IconCheck size={18} color={colors.background} />
            <Text style={{ marginLeft: spacing.xs, color: colors.background }}>
              Aplicar
            </Text>
          </Button>
        </View>
      </View>
    </View>
  );
}
