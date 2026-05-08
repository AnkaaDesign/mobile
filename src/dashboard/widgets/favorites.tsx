// Favorites widget — bookmarks chosen by the user via the page-level "star"
// toggle. Reuses FavoritesContext + getIconInfoByPath so the tile reads
// identically to the existing favourites block on the home screen, but is now
// addable / removable / reorderable like any other widget.

import { z } from "zod";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { IconStar } from "@tabler/icons-react-native";
import { useFavorites } from "@/contexts/favorites-context";
import { getIconInfoByPath } from "@/utils/page-icons";
import { useTheme } from "@/lib/theme";
import { Section, ToggleRow } from "./_shared";
import { Input } from "@/components/ui/input";
import { WidgetCard } from "../components/widget-card";
import {
  AccentPicker,
  makeAccentSchema,
  resolveAccent,
  borderHexFor,
  type WidgetAccentColor,
  type WidgetAccentIcon,
  type WidgetBorderColor,
} from "../components/widget-accent";
import type {
  WidgetConfigProps,
  WidgetDefinition,
  WidgetRenderProps,
} from "../types";

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Favoritos"),
  showHeader: z.boolean().default(true),
  /** Cards per row at mobile widths. Anything > 3 is illegible. */
  itemsPerRow: z.number().int().min(2).max(3).default(2),
  accent: makeAccentSchema({ color: "yellow", icon: "Star", borderColor: "none" }),
});
type Config = z.infer<typeof configSchema>;

function Render({ config }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const router = useRouter();
  const { favorites } = useFavorites();
  const itemsPerRow = config.itemsPerRow;
  const widthPercent = `${100 / itemsPerRow - 2}%` as const;
  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
  const HeaderIcon = accent.Icon;

  if (favorites.length === 0) {
    return (
      <WidgetCard
        title={config.title || "Favoritos"}
        icon={<HeaderIcon size={16} color={accent.hex} />}
        showHeader={config.showHeader}
        borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
      >
        <View style={{ padding: 16, alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: "center" }}>
            Nenhum favorito ainda. Toque na estrela em qualquer página para
            adicioná-la aqui.
          </Text>
        </View>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title={config.title || "Favoritos"}
      icon={<HeaderIcon size={16} color={accent.hex} />}
      showHeader={config.showHeader}
      count={favorites.length}
      borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
    >
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          padding: 12,
        }}
      >
        {favorites.map((fav) => {
          const iconInfo = getIconInfoByPath(fav.path);
          const IconComponent = iconInfo.icon;
          return (
            <Pressable
              key={fav.id}
              onPress={() => router.push(fav.path as any)}
              style={({ pressed }) => ({
                backgroundColor: colors.muted,
                padding: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                width: widthPercent,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  backgroundColor: iconInfo.color,
                  padding: 6,
                  borderRadius: 6,
                  alignSelf: "flex-start",
                  marginBottom: 4,
                }}
              >
                <IconComponent size={14} color="#ffffff" />
              </View>
              <Text
                numberOfLines={2}
                style={{
                  color: colors.foreground,
                  fontSize: 11,
                  fontWeight: "600",
                }}
              >
                {fav.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </WidgetCard>
  );
}

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const { colors } = useTheme();
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    onChange({ ...config, [key]: value });

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 12, color: colors.foreground }}>Título</Text>
        <Input
          value={config.title}
          onChangeText={(v: string) => set("title", v)}
          placeholder="Favoritos"
        />
      </View>
      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "yellow") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "Star") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
          }}
          onChange={(next) => set("accent", next as Config["accent"])}
        />
        <Text style={{ fontSize: 12, color: colors.foreground, marginTop: 8 }}>
          Cards por linha
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[2, 3].map((n) => {
            const active = config.itemsPerRow === n;
            return (
              <Pressable
                key={n}
                onPress={() => set("itemsPerRow", n)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primary : colors.card,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: active ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {n} por linha
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>
      <Section title="Visibilidade">
        <ToggleRow
          label="Exibir cabeçalho"
          checked={config.showHeader}
          onCheckedChange={(v) => set("showHeader", v)}
        />
      </Section>
    </View>
  );
}

export const favoritesWidget: WidgetDefinition<Config> = {
  id: "home.favorites",
  name: "Favoritos",
  description:
    "Atalhos para as páginas marcadas como favoritas. Toque para navegar diretamente.",
  icon: IconStar,
  category: "other",
  allowedSectors: "*",
  defaultSize: { cols: 1, rows: 1 },
  minSize: { cols: 1, rows: 1 },
  maxSize: { cols: 1, rows: 3 },
  configSchema,
  defaultConfig: {
    title: "Favoritos",
    showHeader: true,
    itemsPerRow: 2,
    accent: { color: "yellow", icon: "Star", borderColor: "none" },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
