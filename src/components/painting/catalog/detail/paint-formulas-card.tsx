import { View, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from '../../../../utils';
import type { Paint, PaintFormula } from '../../../../types';
import { routes, SECTOR_PRIVILEGES } from '@/constants';
import { routeToMobilePath } from '@/utils/route-mapper';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/contexts/auth-context';

interface PaintFormulasCardProps {
  paint: Paint;
  /** If false, formulas are displayed but not clickable */
  canNavigate?: boolean;
}

// Helper to get component count from either _count or components array
function getFormulaComponentCount(formula: PaintFormula): number {
  if (formula._count?.components !== undefined) {
    return formula._count.components;
  }
  return formula.components?.length || 0;
}

export function PaintFormulasCard({ paint, canNavigate = true }: PaintFormulasCardProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const userPrivilege = user?.sector?.privileges;

  const canSeePrices = userPrivilege === SECTOR_PRIVILEGES.COMMERCIAL ||
    userPrivilege === SECTOR_PRIVILEGES.ADMIN ||
    userPrivilege === SECTOR_PRIVILEGES.FINANCIAL;

  const hasFormulas = paint.formulas && paint.formulas.length > 0;

  const handleFormulaClick = (formulaId: string) => {
    router.push(routeToMobilePath(routes.painting.formulas.details(formulaId)) as any);
  };

  const handleFormulaCopy = async (formula: PaintFormula) => {
    try {
      const componentCount = getFormulaComponentCount(formula);
      let formulaText = `Formula: ${formula.description || 'Sem descricao'}
Componentes: ${componentCount}`;

      if (canSeePrices) {
        formulaText += `\nPreco/L: ${formula.pricePerLiter != null ? formatCurrency(Number(formula.pricePerLiter)) : '-'}`;
      }

      formulaText += `\nDensidade: ${formula.density != null ? `${Number(formula.density).toFixed(3)} g/ml` : '-'}`;

      await Clipboard.setStringAsync(formulaText);
      Alert.alert("Sucesso", "Formula copiada!");
    } catch (error) {
      Alert.alert("Erro", "Erro ao copiar");
    }
  };

  const handleShowAll = () => {
    router.push(`${routeToMobilePath(routes.painting.formulas.list)}?paintId=${paint.id}` as any);
  };

  const handleCreateFormula = () => {
    router.push(`${routeToMobilePath(routes.painting.catalog.edit(paint.id))}?step=2` as any);
  };

  return (
    <DetailCard title={`Formulas (${paint.formulas?.length || 0})`} icon="flask">
      {hasFormulas ? (
        <View className="gap-3">
          {/* Formula List */}
          {[...paint.formulas!].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((formula, index) => (
            <View key={formula.id}>
              <TouchableOpacity
                onPress={canNavigate ? () => handleFormulaClick(formula.id) : undefined}
                onLongPress={() => handleFormulaCopy(formula)}
                disabled={!canNavigate}
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)', borderColor: colors.border, borderWidth: 1 }}
                className="rounded-lg p-3 active:opacity-70"
              >
                {/* Formula Name */}
                <Text className="text-sm font-semibold text-foreground mb-2" numberOfLines={2}>
                  {formula.description || "Sem descricao"}
                </Text>

                {/* Component Count */}
                {(() => {
                  const count = getFormulaComponentCount(formula);
                  return (
                    <View className="flex-row items-center gap-2 mb-3">
                      <Icon name="package" size={14} className="text-muted-foreground" />
                      <Text className="text-xs text-muted-foreground">
                        {count} {count === 1 ? 'componente' : 'componentes'}
                      </Text>
                    </View>
                  );
                })()}

                {/* Metrics Row */}
                <View className="flex-row gap-4">
                  {canSeePrices && (
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1 mb-1">
                        <Icon name="currency-dollar" size={14} className="text-muted-foreground" />
                        <Text className="text-xs text-muted-foreground">Preco/L</Text>
                      </View>
                      <Text className="text-sm font-medium text-foreground">
                        {formula.pricePerLiter != null && formula.pricePerLiter !== undefined ? formatCurrency(Number(formula.pricePerLiter)) : '-'}
                      </Text>
                    </View>
                  )}

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
          {canNavigate && (
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
                  <Text className="text-sm">Nova Formula</Text>
                </View>
              </Button>
            </View>
          )}
        </View>
      ) : (
        <View className="items-center py-6 gap-3">
          <Icon name="flask" size={40} className="text-muted-foreground/50" />
          <Text className="text-sm text-muted-foreground">
            Nenhuma formula cadastrada
          </Text>
          {canNavigate && (
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
                  <Text className="text-sm">Nova Formula</Text>
                </View>
              </Button>
            </View>
          )}
        </View>
      )}
    </DetailCard>
  );
}
