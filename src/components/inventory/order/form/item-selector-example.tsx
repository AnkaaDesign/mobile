/**
 * OrderItemSelector Example Usage
 *
 * This component demonstrates how to use the OrderItemSelector and OrderMultiItemSelector
 * components with advanced filtering capabilities.
 */

import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { OrderItemSelector } from "./item-selector";
import { OrderMultiItemSelector } from "./multi-item-selector";
import { ItemFilterModal, ItemFilters } from "./item-filter-modal";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

export function OrderItemSelectorExample() {
  const { colors } = useTheme();

  // Single item selection state
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();

  // Multi item selection state
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Filter state
  const [filters, setFilters] = useState<ItemFilters>({
    categoryIds: [],
    brandIds: [],
    supplierIds: [],
    showInactive: false,
  });

  // Filter modal state
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Calculate active filter count
  const activeFilterCount = [
    filters.categoryIds.length > 0 ? 1 : 0,
    filters.brandIds.length > 0 ? 1 : 0,
    filters.supplierIds.length > 0 ? 1 : 0,
    filters.showInactive ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleApplyFilters = (newFilters: ItemFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      categoryIds: [],
      brandIds: [],
      supplierIds: [],
      showInactive: false,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Order Item Selectors</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Advanced item selection with filtering and pagination
          </ThemedText>
        </View>

        {/* Filter Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Filtros</ThemedText>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">
                <ThemedText style={styles.badgeText}>{activeFilterCount} ativo(s)</ThemedText>
              </Badge>
            )}
          </View>
          <View style={styles.filterActions}>
            <Button
              variant="outline"
              onPress={() => setFilterModalVisible(true)}
              style={styles.filterButton}
            >
              <Icon name="filter" size={16} color={colors.foreground} />
              <ThemedText>Filtros</ThemedText>
              {activeFilterCount > 0 && (
                <Badge variant="secondary">
                  <ThemedText style={styles.badgeText}>{activeFilterCount}</ThemedText>
                </Badge>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                onPress={handleClearFilters}
                style={styles.clearButton}
              >
                <Icon name="x" size={16} color={colors.foreground} />
                <ThemedText>Limpar</ThemedText>
              </Button>
            )}
          </View>
        </View>

        {/* Single Item Selector Example */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Seleção Simples</ThemedText>
          <ThemedText style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
            Selecione um único item para o pedido
          </ThemedText>
          <OrderItemSelector
            value={selectedItemId}
            onValueChange={setSelectedItemId}
            label="Item do Pedido"
            required
            categoryIds={filters.categoryIds}
            brandIds={filters.brandIds}
            supplierIds={filters.supplierIds}
            showInactive={filters.showInactive}
          />
          {selectedItemId && (
            <View style={[styles.infoBox, { backgroundColor: colors.muted }]}>
              <ThemedText style={styles.infoText}>
                Item selecionado: {selectedItemId}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Multi Item Selector Example */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Seleção Múltipla</ThemedText>
          <ThemedText style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
            Selecione múltiplos itens para adicionar ao pedido em lote
          </ThemedText>
          <OrderMultiItemSelector
            value={selectedItemIds}
            onValueChange={(value) => setSelectedItemIds(value || [])}
            label="Itens do Pedido"
            categoryIds={filters.categoryIds}
            brandIds={filters.brandIds}
            supplierIds={filters.supplierIds}
            showInactive={filters.showInactive}
          />
          {selectedItemIds.length > 0 && (
            <View style={[styles.infoBox, { backgroundColor: colors.muted }]}>
              <ThemedText style={styles.infoText}>
                {selectedItemIds.length} item(ns) selecionado(s)
              </ThemedText>
            </View>
          )}
        </View>

        {/* Features List */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Recursos Implementados</ThemedText>
          <View style={styles.featureList}>
            <FeatureItem
              icon="check"
              text="Paginação assíncrona com carregamento incremental"
            />
            <FeatureItem
              icon="check"
              text="Busca por nome, código, marca e categoria"
            />
            <FeatureItem
              icon="check"
              text="Filtros multi-seleção (categorias, marcas, fornecedores)"
            />
            <FeatureItem
              icon="check"
              text="Toggle para mostrar itens inativos"
            />
            <FeatureItem
              icon="check"
              text="Exibição de informações de estoque"
            />
            <FeatureItem
              icon="check"
              text="Exibição de preços e fornecedores"
            />
            <FeatureItem
              icon="check"
              text="UI otimizada para toque (mobile-first)"
            />
            <FeatureItem
              icon="check"
              text="Integração com React Query para cache"
            />
            <FeatureItem
              icon="check"
              text="Suporte para seleção simples e múltipla"
            />
          </View>
        </View>
      </View>

      {/* Filter Modal */}
      <ItemFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />
    </ScrollView>
  );
}

interface FeatureItemProps {
  icon: string;
  text: string;
}

function FeatureItem({ icon, text }: FeatureItemProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.featureItem}>
      <Icon name={icon} size={16} color={colors.success} />
      <ThemedText style={styles.featureText}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
  },
  subtitle: {
    fontSize: fontSize.base,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: "600",
  },
  sectionDescription: {
    fontSize: fontSize.sm,
  },
  filterActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  infoBox: {
    padding: spacing.md,
    borderRadius: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  featureList: {
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  featureText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
});
