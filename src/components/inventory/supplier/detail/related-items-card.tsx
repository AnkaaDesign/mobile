import { View, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Item } from "@/types";
import { formatCurrency, determineStockLevel, getStockLevelTextColor } from "@/utils";
import { STOCK_LEVEL_LABELS, routes } from "@/constants";
import { cn } from "@/lib/utils";

interface RelatedItemsCardProps {
  items?: Item[];
  supplierId?: string;
  className?: string;
}

export function RelatedItemsCard({ items, supplierId, className }: RelatedItemsCardProps) {
  const safeItems = items || [];

  const handleItemPress = (itemId: string) => {
    router.push(routes.inventory.products.details(itemId));
  };

  const handleViewAll = () => {
    if (supplierId) {
      router.push(`${routes.inventory.products.list}?suppliers=${supplierId}`);
    }
  };

  if (safeItems.length === 0) {
    return (
      <Card className={cn("shadow-sm border border-border w-full", className)} level={1}>
        <CardHeader className="pb-4">
          <View className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl">
              <View className="p-2 rounded-lg bg-primary/10">
                <Icon name="package" size={20} className="text-primary" />
              </View>
              <Text className="text-xl font-semibold">Produtos Relacionados</Text>
            </CardTitle>
            {supplierId && (
              <Button variant="outline" size="sm" onPress={handleViewAll}>
                <Text>Ver todos</Text>
              </Button>
            )}
          </View>
        </CardHeader>
        <CardContent className="pt-0">
          <View className="text-center py-12">
            <Icon name="alert-circle" size={48} className="text-muted-foreground mx-auto mb-4" />
            <Text className="text-muted-foreground">Nenhum produto associado a este fornecedor.</Text>
          </View>
        </CardContent>
      </Card>
    );
  }

  // Show first 10 items
  const displayItems = safeItems.slice(0, 10);

  return (
    <Card className={cn("shadow-sm border border-border w-full", className)} level={1}>
      <CardHeader className="pb-4">
        <View className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <View className="p-2 rounded-lg bg-primary/10">
              <Icon name="package" size={20} className="text-primary" />
            </View>
            <Text className="text-xl font-semibold">Produtos Relacionados</Text>
          </CardTitle>
          {supplierId && (
            <Button variant="outline" size="sm" onPress={handleViewAll}>
              <Text>Ver todos</Text>
            </Button>
          )}
        </View>
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollView className="space-y-2" showsVerticalScrollIndicator={false}>
          {displayItems.map((item) => {
            const stockLevel = determineStockLevel(
              item.quantity,
              item.minimumQuantity,
              item.maximumQuantity
            );
            const stockLevelColor = getStockLevelTextColor(stockLevel);

            return (
              <Pressable
                key={item.id}
                onPress={() => handleItemPress(item.id)}
                className="border border-border rounded-lg p-4 mb-2 bg-card active:bg-muted/50"
              >
                <View className="flex flex-row justify-between items-start mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="font-semibold text-foreground mb-1">{item.name}</Text>
                    <Text className="text-sm text-muted-foreground">
                      {item.uniCode || "Sem código"}
                    </Text>
                  </View>
                  <Badge
                    variant="outline"
                    className={cn("ml-2", stockLevelColor)}
                  >
                    <Text className="text-xs">{STOCK_LEVEL_LABELS[stockLevel]}</Text>
                  </Badge>
                </View>

                <View className="flex flex-row justify-between items-center">
                  <View className="flex flex-row gap-4">
                    {item.brand && (
                      <Text className="text-sm text-muted-foreground">
                        <Text className="font-medium">Marca:</Text> {item.brand.name}
                      </Text>
                    )}
                    {item.category && (
                      <Text className="text-sm text-muted-foreground">
                        <Text className="font-medium">Cat.:</Text> {item.category.name}
                      </Text>
                    )}
                  </View>
                </View>

                <View className="flex flex-row justify-between items-center mt-2 pt-2 border-t border-border/50">
                  <Text className="text-sm font-medium text-muted-foreground">
                    Qtd: <Text className="text-foreground font-semibold">{item.quantity}</Text>
                  </Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {formatCurrency(item.price)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {safeItems.length > 10 && (
          <View className="mt-4 pt-4 border-t border-border">
            <Text className="text-sm text-muted-foreground text-center">
              Mostrando 10 de {safeItems.length} produtos
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
