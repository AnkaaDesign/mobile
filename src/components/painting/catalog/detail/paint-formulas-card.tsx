
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from '../../../../utils';
import type { Paint, Formula } from '../../../../types';
import { routes } from '@/constants';
import { routeToMobilePath } from '@/utils/route-mapper';
import * as Clipboard from 'expo-clipboard';
import { showToast } from '@/components/ui/toast';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize } from '@/constants/design-system';

interface PaintFormulasCardProps {
  paint: Paint;
}

export function PaintFormulasCard({ paint }: PaintFormulasCardProps) {
  const { colors } = useTheme();
  const hasFormulas = paint.formulas && paint.formulas.length > 0;

  const handleFormulaClick = (formulaId: string) => {
    router.push(routeToMobilePath(routes.painting.formulas.details(formulaId)) as any);
  };

  const handleFormulaCopy = async (formula: Formula) => {
    try {
      const formulaText = `Fórmula: ${formula.description || 'Sem descrição'}
Componentes: ${formula.components?.length || 0}
Preço/L: ${formula.pricePerLiter != null ? formatCurrency(Number(formula.pricePerLiter)) : '-'}
Densidade: ${formula.density != null ? `${Number(formula.density).toFixed(3)} g/ml` : '-'}`;

      await Clipboard.setStringAsync(formulaText);
      showToast({
        title: 'Fórmula copiada!',
        variant: 'success',
        duration: 3000,
      });
    } catch (error) {
      showToast({
        title: 'Erro ao copiar',
        variant: 'error',
        duration: 3000,
      });
    }
  };

  const handleShowAll = () => {
    router.push(`${routeToMobilePath(routes.painting.formulas.list)}?paintId=${paint.id}` as any);
  };

  const handleCreateFormula = () => {
    router.push(`${routeToMobilePath(routes.painting.catalog.edit(paint.id))}?step=2` as any);
  };

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Icon name="flask" size={20} style={{ color: colors.mutedForeground }} />
          <Text style={styles.title}>
            Fórmulas ({paint.formulas?.length || 0})
          </Text>
        </View>
      </View>

      <View style={styles.content}>
      {hasFormulas ? (
        <View className="gap-3">
          {/* Formula List */}
          {paint.formulas!.map((formula, index) => (
            <View key={formula.id}>
              <TouchableOpacity
                onPress={() => handleFormulaClick(formula.id)}
                onLongPress={() => handleFormulaCopy(formula)}
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)', borderColor: colors.border, borderWidth: 1 }}
                className="rounded-lg p-3 active:opacity-70"
              >
                {/* Formula Name */}
                <Text className="text-sm font-semibold text-foreground mb-2" numberOfLines={2}>
                  {formula.description || "Sem descrição"}
                </Text>

                {/* Component Count */}
                <View className="flex-row items-center gap-2 mb-3">
                  <Icon name="package" size={14} className="text-muted-foreground" />
                  <Text className="text-xs text-muted-foreground">
                    {formula.components?.length || 0} {(formula.components?.length || 0) === 1 ? 'componente' : 'componentes'}
                  </Text>
                </View>

                {/* Metrics Row */}
                <View className="flex-row gap-4">
                  {/* Price per Liter */}
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1 mb-1">
                      <Icon name="currency-dollar" size={14} className="text-muted-foreground" />
                      <Text className="text-xs text-muted-foreground">Preço/L</Text>
                    </View>
                    <Text className="text-sm font-medium text-foreground">
                      {formula.pricePerLiter != null && formula.pricePerLiter !== undefined ? formatCurrency(Number(formula.pricePerLiter)) : '-'}
                    </Text>
                  </View>

                  {/* Density */}
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1 mb-1">
                      <Icon name="weight" size={14} className="text-muted-foreground" />
                      <Text className="text-xs text-muted-foreground">Densidade</Text>
                    </View>
                    <Text className="text-sm font-medium text-foreground font-mono">
                      {formula.density != null && formula.density !== undefined ? `${Number(formula.density).toFixed(3)} g/ml` : '-'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {index < paint.formulas!.length - 1 && (
                <Separator className="my-3" />
              )}
            </View>
          ))}

          {/* Actions */}
          <View className="flex-row gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onPress={handleShowAll}
              className="flex-1"
            >
              <View className="flex-row items-center gap-2">
                <Icon name="list" size={16} />
                <Text className="text-sm">Mostrar Todos</Text>
              </View>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={handleCreateFormula}
              className="flex-1"
            >
              <View className="flex-row items-center gap-2">
                <Icon name="plus" size={16} />
                <Text className="text-sm">Nova Fórmula</Text>
              </View>
            </Button>
          </View>
        </View>
      ) : (
        <View className="items-center py-6 gap-3">
          <Icon name="flask" size={40} className="text-muted-foreground/50" />
          <Text className="text-sm text-muted-foreground">
            Nenhuma fórmula cadastrada
          </Text>
          <View className="flex-row gap-2">
            <Button variant="outline" size="sm" onPress={handleShowAll}>
              <View className="flex-row items-center gap-2">
                <Icon name="list" size={16} />
                <Text className="text-sm">Mostrar Todos</Text>
              </View>
            </Button>
            <Button variant="outline" size="sm" onPress={handleCreateFormula}>
              <View className="flex-row items-center gap-2">
                <Icon name="plus" size={16} />
                <Text className="text-sm">Nova Fórmula</Text>
              </View>
            </Button>
          </View>
        </View>
      )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
});
