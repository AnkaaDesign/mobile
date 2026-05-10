// Bottom sheet to add a new widget to the dashboard. Mirrors web's
// `add-widget-modal.tsx`: a search input on top, a horizontal Tabs row
// (Todos + each populated category), and a 2-column grid of square cards
// with tinted icon tile + name + description + category tag.
//
// Mobile differences (intentional):
//   - Bottom sheet at 90% snap instead of centered Dialog max-w-3xl
//   - 2-col grid instead of 4-col (screen real-estate)
//   - Tabs scroll horizontally if there are many categories
//   - Card aspect-square is preserved so the visual rhythm matches web

import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  FlatList,
  useWindowDimensions,
  type ListRenderItem,
} from "react-native";
import {
  IconSearch,
  IconStar,
  IconX,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { Sheet } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { widgetRegistry } from "../registry";
import {
  WIDGET_CATEGORY_LABELS,
  type WidgetCategory,
  type WidgetDefinition,
} from "../types";

interface AddWidgetSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (widgetId: string) => void;
}

type CategoryFilter = "all" | WidgetCategory;

const CATEGORY_ORDER: WidgetCategory[] = [
  "production",
  "hr",
  "inventory",
  "financial",
  "other",
];

export function AddWidgetSheet({
  open,
  onOpenChange,
  onAdd,
}: AddWidgetSheetProps) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const sector =
    (user?.sector?.privileges as SECTOR_PRIVILEGES | undefined) ?? null;

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  const allWidgets = useMemo(
    () => widgetRegistry.getAvailableWidgets(sector),
    [sector],
  );

  // Categories present in the available set, in stable display order.
  const categories = useMemo(() => {
    const present = new Set(allWidgets.map((w) => w.category));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [allWidgets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allWidgets.filter((w) => {
      if (activeCategory !== "all" && w.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      const haystack = `${w.name} ${w.description ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allWidgets, activeCategory, query]);

  // Match the dashboard grid's breakpoints so the picker renders 2 columns on
  // phones, 3 on small tablets, 4 on large tablets — keeps cards a comfortable
  // tap target across screen sizes.
  const { width: viewportWidth } = useWindowDimensions();
  const numColumns = viewportWidth >= 900 ? 4 : viewportWidth >= 600 ? 3 : 2;

  const handleAdd = (widgetId: string) => {
    onAdd(widgetId);
    setQuery("");
    setActiveCategory("all");
    onOpenChange(false);
  };

  const renderCard: ListRenderItem<WidgetDefinition> = ({ item: def }) => {
    const Icon = def.icon;
    return (
      <Pressable
        onPress={() => handleAdd(def.id)}
        style={({ pressed }) => ({
          flex: 1,
          aspectRatio: 1,
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: pressed ? colors.primary : colors.border,
          backgroundColor: pressed
            ? colors.muted
            : colors.card,
          margin: 4,
          // shadow-sm equivalent so cards lift off the sheet surface
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 2,
          elevation: 1,
        })}
      >
        {/* Top-right category tag */}
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontWeight: "600",
              color: colors.mutedForeground,
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            {WIDGET_CATEGORY_LABELS[def.category]}
          </Text>
        </View>

        {/* Tinted icon tile (web `bg-primary/10 text-primary p-2.5 rounded-md`) */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            backgroundColor: colors.primary + "1f",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <Icon size={20} color={colors.primary} />
        </View>

        <Text
          numberOfLines={2}
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: colors.foreground,
            marginBottom: 4,
          }}
        >
          {def.name}
        </Text>
        <Text
          numberOfLines={3}
          style={{
            fontSize: 11,
            color: colors.mutedForeground,
            lineHeight: 14,
          }}
        >
          {def.description}
        </Text>
      </Pressable>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} snapPoints={[90]}>
      <View style={{ flex: 1 }}>
        {/* Header with title + close */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            gap: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "600",
                  color: colors.foreground,
                }}
              >
                Adicionar widget
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.mutedForeground,
                  marginTop: 2,
                }}
              >
                Escolha um widget para adicionar ao seu painel.
              </Text>
            </View>
            <Pressable
              onPress={() => onOpenChange(false)}
              hitSlop={10}
              accessibilityLabel="Fechar"
              style={({ pressed }) => ({
                padding: 8,
                borderRadius: 6,
                backgroundColor: pressed ? colors.muted : "transparent",
              })}
            >
              <IconX size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Search input — slim 32-px field with leading magnifying glass.
              Matches web's `pl-9 h-9 text-sm` field. */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              height: 36,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.04)"
                : "rgba(0,0,0,0.03)",
              paddingHorizontal: 10,
              gap: 8,
            }}
          >
            <IconSearch size={16} color={colors.mutedForeground} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar widget..."
              placeholderTextColor={colors.mutedForeground}
              style={{
                flex: 1,
                padding: 0,
                fontSize: 14,
                color: colors.foreground,
                minHeight: 0,
                textAlignVertical: "center",
                includeFontPadding: false,
              }}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>

          {/* Category tabs — horizontal scroll. Todos + each populated category.
              Active = solid card bg + primary text; inactive = muted text. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingRight: 16 }}
          >
            <CategoryTab
              active={activeCategory === "all"}
              label="Todos"
              count={allWidgets.length}
              onPress={() => setActiveCategory("all")}
            />
            {categories.map((cat) => (
              <CategoryTab
                key={cat}
                active={activeCategory === cat}
                label={WIDGET_CATEGORY_LABELS[cat]}
                count={allWidgets.filter((w) => w.category === cat).length}
                onPress={() => setActiveCategory(cat)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Grid */}
        {filtered.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
              gap: 8,
            }}
          >
            <IconStar
              size={32}
              color={colors.mutedForeground}
              opacity={0.4}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: colors.foreground,
                textAlign: "center",
              }}
            >
              Nenhum widget encontrado
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                textAlign: "center",
              }}
            >
              {query
                ? "Tente outro termo de busca."
                : "Nenhum widget disponível para o seu setor."}
            </Text>
          </View>
        ) : (
          <FlatList
            // FlatList requires re-key when numColumns changes (it's a layout
            // mode, not a re-renderable prop), hence `key={numColumns}`.
            key={numColumns}
            data={filtered}
            keyExtractor={(def) => def.id}
            numColumns={numColumns}
            renderItem={renderCard}
            contentContainerStyle={{
              padding: 12,
              paddingBottom: 32,
            }}
          />
        )}
      </View>
    </Sheet>
  );
}

function CategoryTab({
  active,
  label,
  count,
  onPress,
}: {
  active: boolean;
  label: string;
  count: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        height: 32,
        paddingHorizontal: 10,
        borderRadius: 6,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: active
          ? colors.primary + "1f"
          : pressed
            ? colors.muted
            : "transparent",
        borderWidth: 1,
        borderColor: active ? colors.primary + "55" : colors.border,
      })}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: active ? "600" : "500",
          color: active ? colors.primary : colors.foreground,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 10,
          fontWeight: "600",
          color: active ? colors.primary : colors.mutedForeground,
          fontVariant: ["tabular-nums"],
        }}
      >
        {count}
      </Text>
    </Pressable>
  );
}
