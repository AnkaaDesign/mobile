import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Drawer, DrawerHeader, DrawerContent, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { IconFilter, IconX, IconCheck, IconDeviceFloppy } from '@tabler/icons-react-native';
import { useTheme } from '@/lib/theme';
import { spacing } from '@/constants/design-system';
import { FilterSection } from './FilterSection';

/**
 * BaseFilterDrawer Component
 *
 * A unified, reusable filter drawer that provides:
 * - Organized filter sections with collapsible UI
 * - Active filter count badge
 * - Apply/Clear actions
 * - Optional filter preset save/load
 *
 * This component replaces all the inconsistent Modal/Drawer filter
 * implementations across the app with a single, standardized pattern.
 *
 * @example
 * ```tsx
 * // Define filter sections
 * const filterSections = [
 *   {
 *     id: 'basic',
 *     title: 'Informações Básicas',
 *     badge: 2,
 *     content: (
 *       <>
 *         <StringFilter
 *           label="Nome"
 *           value={filters.name}
 *           onChange={(v) => setFilters({...filters, name: v})}
 *         />
 *         <StringFilter
 *           label="Email"
 *           value={filters.email}
 *           onChange={(v) => setFilters({...filters, email: v})}
 *         />
 *       </>
 *     ),
 *   },
 *   {
 *     id: 'dates',
 *     title: 'Datas',
 *     badge: 1,
 *     content: (
 *       <DateRangeFilter
 *         label="Data de Criação"
 *         value={filters.createdDate}
 *         onChange={(v) => setFilters({...filters, createdDate: v})}
 *       />
 *     ),
 *   },
 * ];
 *
 * // Use the drawer
 * <BaseFilterDrawer
 *   open={isFilterDrawerOpen}
 *   onOpenChange={setIsFilterDrawerOpen}
 *   sections={filterSections}
 *   onApply={handleApplyFilters}
 *   onClear={handleClearFilters}
 *   activeFiltersCount={3}
 * />
 * ```
 */

export interface FilterSectionConfig {
  /** Unique section ID */
  id: string;
  /** Section title */
  title: string;
  /** Optional description */
  description?: string;
  /** Filter components to render in this section */
  content: React.ReactNode;
  /** Whether section is open by default */
  defaultOpen?: boolean;
  /** Badge count (e.g., number of active filters in section) */
  badge?: number;
}

export interface BaseFilterDrawerProps {
  /** Whether drawer is open */
  open: boolean;
  /** Callback when drawer open state changes */
  onOpenChange: (open: boolean) => void;
  /** Filter sections to display */
  sections: FilterSectionConfig[];
  /** Callback when apply button is pressed */
  onApply?: () => void;
  /** Callback when clear button is pressed */
  onClear?: () => void;
  /** Callback when save preset button is pressed */
  onSavePreset?: () => void;
  /** Callback when load preset button is pressed */
  onLoadPreset?: () => void;
  /** Total count of active filters (shown in header badge) */
  activeFiltersCount?: number;
  /** Custom title (default: "Filtros") */
  title?: string;
  /** Custom description */
  description?: string;
  /** Whether to show action buttons (apply/clear) */
  showActions?: boolean;
  /** Whether to show preset buttons */
  showPresets?: boolean;
  /** Apply button text */
  applyButtonText?: string;
  /** Clear button text */
  clearButtonText?: string;
}

export function BaseFilterDrawer({
  open,
  onOpenChange,
  sections,
  onApply,
  onClear,
  onSavePreset,
  onLoadPreset,
  activeFiltersCount = 0,
  title = 'Filtros',
  description = 'Configure os filtros para refinar sua busca',
  showActions = true,
  showPresets = false,
  applyButtonText = 'Aplicar',
  clearButtonText = 'Limpar',
}: BaseFilterDrawerProps) {
  const { colors } = useTheme();

  const handleApply = () => {
    onApply?.();
    onOpenChange(false);
  };

  const handleClear = () => {
    onClear?.();
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const styles = StyleSheet.create({
    headerContainer: {
      gap: spacing.sm,
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
      lineHeight: 20,
    },
    closeButton: {
      padding: 4,
    },
    contentContainer: {
      gap: spacing.md,
    },
    scrollContent: {
      paddingBottom: spacing.xl,
    },
    footerActions: {
      gap: spacing.sm,
    },
    actionRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
    presetRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    presetButton: {
      flex: 1,
    },
  });

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      width="90%"
      closeOnBackdropPress={true}
      closeOnSwipe={true}
    >
      <DrawerHeader>
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <IconFilter size={24} color={colors.foreground} />
              <Text style={styles.title}>{title}</Text>
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
              onPress={handleClose}
              style={styles.closeButton}
            >
              <IconX size={20} color={colors.mutedForeground} />
            </Button>
          </View>
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
        </View>
      </DrawerHeader>

      <DrawerContent>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.contentContainer}>
            {sections.map((section, index) => (
              <React.Fragment key={section.id}>
                <FilterSection
                  title={section.title}
                  description={section.description}
                  defaultOpen={section.defaultOpen}
                  badge={section.badge}
                >
                  {section.content}
                </FilterSection>
                {index < sections.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </View>
        </ScrollView>
      </DrawerContent>

      {showActions && (
        <DrawerFooter>
          <View style={styles.footerActions}>
            <View style={styles.actionRow}>
              {onClear && (
                <Button
                  variant="outline"
                  onPress={handleClear}
                  style={styles.actionButton}
                >
                  <IconX size={18} color={colors.foreground} />
                  <Text style={{ marginLeft: spacing.xs }}>{clearButtonText}</Text>
                </Button>
              )}
              {onApply && (
                <Button
                  variant="default"
                  onPress={handleApply}
                  style={styles.actionButton}
                >
                  <IconCheck size={18} color={colors.background} />
                  <Text style={{ marginLeft: spacing.xs, color: colors.background }}>
                    {applyButtonText}
                  </Text>
                </Button>
              )}
            </View>

            {showPresets && (onSavePreset || onLoadPreset) && (
              <View style={styles.presetRow}>
                {onSavePreset && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={onSavePreset}
                    style={styles.presetButton}
                  >
                    <IconDeviceFloppy size={16} color={colors.foreground} />
                    <Text style={{ marginLeft: spacing.xs, fontSize: 13 }}>
                      Salvar preset
                    </Text>
                  </Button>
                )}
                {onLoadPreset && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={onLoadPreset}
                    style={styles.presetButton}
                  >
                    <Text style={{ fontSize: 13 }}>Carregar preset</Text>
                  </Button>
                )}
              </View>
            )}
          </View>
        </DrawerFooter>
      )}
    </Drawer>
  );
}
