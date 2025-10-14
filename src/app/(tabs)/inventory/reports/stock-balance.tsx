import { View, ScrollView, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useItems } from "@/hooks";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/api-client";

interface StockEntry {
  itemId: string;
  currentStock: number;
  newStock: string; // Keep as string to allow empty input
}

export default function StockBalanceReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get item IDs from URL params (comma-separated)
  const itemIds = params.ids ? String(params.ids).split(",").filter(Boolean) : [];

  // Fetch items
  const { data: itemsData, isLoading } = useItems(
    {
      where: {
        id: { in: itemIds },
      },
      include: {
        brand: true,
        category: true,
      },
    },
    {
      enabled: itemIds.length > 0,
    }
  );

  const items = itemsData?.data || [];

  // Initialize stock entries when items are loaded
  useEffect(() => {
    if (items.length > 0 && stockEntries.length === 0) {
      const entries: StockEntry[] = items.map((item: any) => ({
        itemId: item.id,
        currentStock: item.stock || 0,
        newStock: String(item.stock || 0),
      }));
      setStockEntries(entries);
    }
  }, [items, stockEntries.length]);

  const handleStockChange = (itemId: string, value: string) => {
    // Allow only numbers
    if (value && !/^\d*\.?\d*$/.test(value)) return;

    setStockEntries((prev) =>
      prev.map((entry) =>
        entry.itemId === itemId
          ? { ...entry, newStock: value }
          : entry
      )
    );
  };

  const handleSubmit = () => {
    // Validate that all entries have a value
    const hasEmptyValues = stockEntries.some(
      (entry) => !entry.newStock || entry.newStock.trim() === ""
    );

    if (hasEmptyValues) {
      Alert.alert(
        "Campos obrigatórios",
        "Por favor, informe a quantidade para todos os itens."
      );
      return;
    }

    // Check if there are any changes
    const hasChanges = stockEntries.some(
      (entry) => parseFloat(entry.newStock) !== entry.currentStock
    );

    if (!hasChanges) {
      Alert.alert(
        "Sem alterações",
        "Nenhuma alteração foi detectada nos estoques."
      );
      return;
    }

    Alert.alert(
      "Confirmar Balanço",
      "Deseja confirmar o balanço de estoque? Esta ação atualizará as quantidades em estoque.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              setIsSubmitting(true);

              // Prepare balance data
              const balanceData = stockEntries.map((entry) => ({
                itemId: entry.itemId,
                newStock: parseFloat(entry.newStock),
              }));

              // Submit balance to API
              await apiClient.post("/inventory/stock-balance", {
                entries: balanceData,
              });

              Alert.alert("Sucesso", "Balanço de estoque confirmado com sucesso");
              router.back();
            } catch (error: any) {
              Alert.alert(
                "Erro",
                error.response?.data?.message || "Falha ao confirmar balanço"
              );
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (itemIds.length === 0) {
    return (
      <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.WAREHOUSE}>
        <View className="flex-1 bg-background p-4">
          <EmptyState
            icon="clipboard-check"
            title="Nenhum produto selecionado"
            description="Nenhum produto foi selecionado para balanço de estoque"
            actionLabel="Voltar"
            onAction={() => router.back()}
          />
        </View>
      </PrivilegeGuard>
    );
  }

  if (isLoading) {
    return (
      <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.WAREHOUSE}>
        <LoadingScreen />
      </PrivilegeGuard>
    );
  }

  if (items.length === 0) {
    return (
      <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.WAREHOUSE}>
        <View className="flex-1 bg-background p-4">
          <EmptyState
            icon="alert-triangle"
            title="Produtos não encontrados"
            description="Os produtos selecionados não foram encontrados"
            actionLabel="Voltar"
            onAction={() => router.back()}
          />
        </View>
      </PrivilegeGuard>
    );
  }

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.WAREHOUSE}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="p-4 border-b border-border">
          <Text className="text-2xl font-bold mb-2">Balanço de Estoque</Text>
          <Text className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "itens"} selecionado{items.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
          {items.map((item: any, index: number) => {
            const entry = stockEntries.find((e) => e.itemId === item.id);
            if (!entry) return null;

            const hasChange = parseFloat(entry.newStock || "0") !== entry.currentStock;
            const difference = parseFloat(entry.newStock || "0") - entry.currentStock;

            return (
              <Card key={item.id} className="mb-3">
                <CardHeader>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <CardTitle className="text-lg mb-1">{item.name}</CardTitle>
                      {item.sku && (
                        <Text className="text-sm text-muted-foreground font-mono">
                          SKU: {item.sku}
                        </Text>
                      )}
                      <View className="flex-row items-center gap-2 mt-2 flex-wrap">
                        {item.category && (
                          <Badge variant="outline">{item.category.name}</Badge>
                        )}
                        {item.brand && (
                          <Badge variant="secondary">{item.brand.name}</Badge>
                        )}
                      </View>
                    </View>
                  </View>
                </CardHeader>

                <CardContent className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-muted-foreground">Estoque Atual:</Text>
                    <Text className="text-base font-semibold">
                      {entry.currentStock} {item.unit || "un"}
                    </Text>
                  </View>

                  <Separator />

                  <View>
                    <Text className="text-sm font-medium mb-2">
                      Nova Quantidade *
                    </Text>
                    <Input
                      value={entry.newStock}
                      onChangeText={(value) => handleStockChange(item.id, value)}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>

                  {hasChange && (
                    <>
                      <Separator />
                      <View
                        className={`flex-row items-center gap-2 p-2 rounded-md ${
                          difference > 0 ? "bg-green-50" : "bg-red-50"
                        }`}
                      >
                        <Icon
                          name={difference > 0 ? "trending-up" : "trending-down"}
                          className={`w-4 h-4 ${
                            difference > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        />
                        <Text
                          className={`text-sm font-medium ${
                            difference > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {difference > 0 ? "+" : ""}
                          {difference.toFixed(2)} {item.unit || "un"}
                        </Text>
                      </View>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </ScrollView>

        {/* Actions */}
        <View className="p-4 border-t border-border gap-2">
          <Button
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Icon name="check" className="w-4 h-4 mr-2" />
            <Text className="text-primary-foreground">
              {isSubmitting ? "Confirmando..." : "Confirmar Balanço"}
            </Text>
          </Button>
          <Button
            variant="outline"
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text>Cancelar</Text>
          </Button>
        </View>
      </View>
    </PrivilegeGuard>
  );
}
