import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';

import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { IconChevronDown } from '@tabler/icons-react-native';
import { useTheme } from '@/lib/theme';
import { spacing } from '@/constants/design-system';

/**
 * FilterSection Component
 *
 * A collapsible section wrapper for filter inputs.
 * Used to organize multiple filters into logical groups.
 *
 * @example
 * ```tsx
 * <FilterSection
 *   title="Informações Básicas"
 *   description="Filtrar por nome, email, etc."
 *   defaultOpen={true}
 *   badge={2}
 * >
 *   <StringFilter label="Nome" value={filters.name} onChange={(v) => setFilters({...filters, name: v})} />
 *   <StringFilter label="Email" value={filters.email} onChange={(v) => setFilters({...filters, email: v})} />
 * </FilterSection>
 * ```
 */
export interface FilterSectionProps {
  /** Section title */
  title: string;
  /** Optional description shown below title when collapsed */
  description?: string;
  /** Child filter components */
  children: React.ReactNode;
  /** Whether section is open by default */
  defaultOpen?: boolean;
  /** Optional badge count (e.g., number of active filters in section) */
  badge?: number;
  /** Optional external control of open state */
  isOpen?: boolean;
  /** Optional callback when open state changes */
  onOpenChange?: (isOpen: boolean) => void;
}

export function FilterSection({
  title,
  description,
  children,
  defaultOpen = true,
  badge,
  isOpen,
  onOpenChange,
}: FilterSectionProps) {
  const { colors } = useTheme();
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);

  const open = isOpen !== undefined ? isOpen : internalOpen;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    triggerButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.card,
    },
    triggerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
    },
    description: {
      fontSize: 13,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    chevronIcon: {
      color: colors.mutedForeground,
      transform: [{ rotate: open ? '180deg' : '0deg' }],
    },
    content: {
      paddingTop: spacing.md,
      paddingHorizontal: spacing.sm,
      gap: spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      <Collapsible open={open} onOpenChange={handleOpenChange}>
        <CollapsibleTrigger asChild>
          <View style={styles.triggerButton}>
            <View style={styles.triggerContent}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{title}</Text>
                {description && !open && (
                  <Text style={styles.description}>{description}</Text>
                )}
              </View>
              {badge !== undefined && badge > 0 && (
                <Badge variant="secondary">
                  <Text style={{ fontSize: 12 }}>{badge}</Text>
                </Badge>
              )}
            </View>
            <IconChevronDown size={20} style={styles.chevronIcon} />
          </View>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <View style={styles.content}>
            {children}
          </View>
        </CollapsibleContent>
      </Collapsible>
    </View>
  );
}
