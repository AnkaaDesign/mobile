import React, { useState, useEffect } from "react";
import { View, ScrollView, Pressable, ActivityIndicator, ViewStyle } from "react-native";
import { useItems } from '../../../hooks';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { IconSearch } from "@tabler/icons-react-native";
import type { Item } from '../../../types';

interface ItemMultiSelectorProps {
  value?: string[];
  onValueChange?: (value: string[]) => void;
  supplierId?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function ItemMultiSelector({
  value = [],
  onValueChange,
  supplierId,
  disabled = false,
  style,
}: ItemMultiSelectorProps) {
  const { colors, spacing } = useTheme();
  const [selectedItems, setSelectedItems] = useState<string[]>(value);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useItems({
    where: {
      isActive: true,
      ...(supplierId && { supplierId }),
      ...(searchQuery && {
        name: { contains: searchQuery, mode: "insensitive" },
      }),
    },
    orderBy: { name: "asc" },
  });

  const items = data?.data || [];

  useEffect(() => {
    setSelectedItems(value);
  }, [value]);

  const handleToggleItem = (itemId: string) => {
    if (disabled) return;

    const newSelection = selectedItems.includes(itemId)
      ? selectedItems.filter((id) => id !== itemId)
      : [...selectedItems, itemId];

    setSelectedItems(newSelection);
    onValueChange?.(newSelection);
  };

  const handleSelectAll = () => {
    if (disabled) return;

    const allItemIds = items.map((item) => item.id);
    setSelectedItems(allItemIds);
    onValueChange?.(allItemIds);
  };

  const handleClearAll = () => {
    if (disabled) return;

    setSelectedItems([]);
    onValueChange?.([]);
  };

  if (isLoading) {
    return (
      <View
        style={[
          {
            padding: spacing.md,
            alignItems: "center",
            justifyContent: "center",
          },
          style,
        ]}
      >
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={style}>
      {/* Search */}
      <View style={{ marginBottom: spacing.md }}>
        <Input
          placeholder="Buscar produtos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          editable={!disabled}
        />
      </View>

      {/* Actions */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: spacing.sm,
        }}
      >
        <ThemedText variant="muted" size="sm">
          {selectedItems.length} de {items.length} selecionados
        </ThemedText>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable onPress={handleSelectAll} disabled={disabled}>
            <ThemedText variant="primary" size="sm" weight="medium">
              Selecionar todos
            </ThemedText>
          </Pressable>
          <Pressable onPress={handleClearAll} disabled={disabled}>
            <ThemedText variant="destructive" size="sm" weight="medium">
              Limpar
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Items List */}
      <ScrollView
        style={{
          maxHeight: 300,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          padding: spacing.sm,
        }}
      >
        {items.length === 0 ? (
          <View style={{ padding: spacing.md, alignItems: "center" }}>
            <ThemedText variant="muted">Nenhum produto encontrado</ThemedText>
          </View>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleToggleItem(item.id)}
              disabled={disabled}
            >
              <Card
                style={{
                  padding: spacing.sm,
                  marginBottom: spacing.xs,
                  backgroundColor: selectedItems.includes(item.id)
                    ? colors.primary + "10"
                    : colors.card,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                  }}
                >
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => handleToggleItem(item.id)}
                    disabled={disabled}
                  />
                  <View style={{ flex: 1 }}>
                    <ThemedText weight="medium">{item.name}</ThemedText>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: spacing.xs,
                        marginTop: spacing.xs,
                      }}
                    >
                      {item.uniCode && (
                        <Badge variant="secondary">
                          <ThemedText size="xs">C�digo: {item.uniCode}</ThemedText>
                        </Badge>
                      )}
                      <Badge variant="outline">
                        <ThemedText size="xs">Estoque: {item.quantity}</ThemedText>
                      </Badge>
                    </View>
                  </View>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}