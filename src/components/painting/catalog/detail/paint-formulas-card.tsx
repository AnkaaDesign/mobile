
import { View, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from '../../../../utils';
import type { Paint } from '../../../../types';

interface PaintFormulasCardProps {
  paint: Paint;
}

export function PaintFormulasCard({ paint }: PaintFormulasCardProps) {
  const hasFormulas = paint.formulas && paint.formulas.length > 0;

  const handleFormulaClick = (formulaId: string) => {
    router.push(`/painting/formulas/details/${formulaId}` as any);
  };

  const handleShowAll = () => {
    router.push(`/painting/formulas/list?paintId=${paint.id}` as any);
  };

  const handleCreateFormula = () => {
    router.push(`/painting/catalog/edit/${paint.id}?step=2` as any);
  };

  return (
    <Card className="p-4">
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-4">
        <View className="p-2 rounded-lg bg-primary/10">
          <Icon name="flask" size={20} className="text-primary" />
        </View>
        <Text className="text-lg font-semibold text-foreground">
          Fórmulas ({paint.formulas?.length || 0})
        </Text>
      </View>

      {hasFormulas ? (
        <View className="gap-3">
          {/* Formula List */}
          {paint.formulas!.map((formula, index) => (
            <View key={formula.id}>
              <TouchableOpacity
                onPress={() => handleFormulaClick(formula.id)}
                className="bg-muted/50 rounded-lg p-4 active:bg-muted/70"
              >
                <View className="mb-3">
                  <Text className="text-base font-medium text-foreground">
                    {formula.description}
                  </Text>
                </View>

                <View className="flex-row flex-wrap gap-4">
                  {/* Price per Liter */}
                  {typeof formula.pricePerLiter === 'number' && (
                    <View className="flex-row items-center gap-1">
                      <Icon name="currency-real" size={14} className="text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">
                        {formatCurrency(formula.pricePerLiter)}/L
                      </Text>
                    </View>
                  )}

                  {/* Density */}
                  {typeof formula.density === 'number' && (
                    <View className="flex-row items-center gap-1">
                      <Icon name="gauge" size={14} className="text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">
                        {formula.density.toFixed(3)} g/ml
                      </Text>
                    </View>
                  )}

                  {/* Components Count */}
                  <View className="flex-row items-center gap-1">
                    <Icon name="flask" size={14} className="text-muted-foreground" />
                    <Text className="text-sm text-muted-foreground">
                      {formula.components?.length || 0} componentes
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
        <View className="items-center py-8 gap-4">
          <Icon name="flask" size={48} className="text-muted-foreground/50" />
          <View className="items-center gap-2">
            <Text className="text-sm font-medium text-muted-foreground">
              Nenhuma fórmula cadastrada
            </Text>
            <Text className="text-xs text-muted-foreground text-center">
              Crie a primeira fórmula para esta tinta e comece a produzir
            </Text>
          </View>
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
                <Text className="text-sm">Criar Primeira Fórmula</Text>
              </View>
            </Button>
          </View>
        </View>
      )}
    </Card>
  );
}
