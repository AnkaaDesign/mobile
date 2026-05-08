// Bottom sheet to add a new widget to the dashboard. Filters the registry
// by the user's sector, groups the result by category, and lets the user
// tap a widget to drop it into the layout. Mirrors web's AddWidgetModal in
// purpose; the UX is mobile-native (sheet + scrollable category sections).

import { useMemo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { IconPlus, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { widgetRegistry } from "../registry";
import { WIDGET_CATEGORY_LABELS, type WidgetCategory } from "../types";

interface AddWidgetSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (widgetId: string) => void;
}

export function AddWidgetSheet({ open, onOpenChange, onAdd }: AddWidgetSheetProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const sector =
    (user?.sector?.privileges as SECTOR_PRIVILEGES | undefined) ?? null;

  const groups = useMemo(
    () => widgetRegistry.groupByCategory(sector),
    [sector],
  );

  // Stable category order matches WIDGET_CATEGORY_LABELS insertion order so
  // sectors that share several categories see them in the same sequence.
  const orderedGroups = useMemo(() => {
    const order: WidgetCategory[] = ["production", "hr", "inventory", "financial", "other"];
    return [...groups].sort(
      (a, b) => order.indexOf(a.category) - order.indexOf(b.category),
    );
  }, [groups]);

  const handleAdd = (widgetId: string) => {
    onAdd(widgetId);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} snapPoints={[0.85]} dragIndicator>
      <SheetContent>
        <SheetHeader>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.foreground,
              }}
            >
              Adicionar widget
            </Text>
            <Pressable
              onPress={() => onOpenChange(false)}
              hitSlop={8}
              style={({ pressed }) => ({
                padding: 4,
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <IconX size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </SheetHeader>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32, gap: 16 }}
        >
          {orderedGroups.length === 0 ? (
            <Text
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                textAlign: "center",
                padding: 24,
              }}
            >
              Nenhum widget disponível para o seu setor.
            </Text>
          ) : (
            orderedGroups.map((group) => (
              <View key={group.category} style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.mutedForeground,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                    paddingHorizontal: 4,
                  }}
                >
                  {WIDGET_CATEGORY_LABELS[group.category]}
                </Text>
                <View style={{ gap: 8 }}>
                  {group.widgets.map((def) => {
                    const Icon = def.icon;
                    return (
                      <Pressable
                        key={def.id}
                        onPress={() => handleAdd(def.id)}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          padding: 12,
                          borderRadius: 10,
                          backgroundColor: pressed
                            ? colors.muted
                            : colors.card,
                          borderWidth: 1,
                          borderColor: colors.border,
                        })}
                      >
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            backgroundColor: colors.muted,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "600",
                              color: colors.foreground,
                            }}
                          >
                            {def.name}
                          </Text>
                          <Text
                            numberOfLines={2}
                            style={{
                              fontSize: 11,
                              color: colors.mutedForeground,
                            }}
                          >
                            {def.description}
                          </Text>
                        </View>
                        <IconPlus size={18} color={colors.mutedForeground} />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SheetContent>
    </Sheet>
  );
}
