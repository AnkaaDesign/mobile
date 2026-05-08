// Per-widget container. Wraps the widget's RenderComponent with optional
// edit-mode chrome (gear + remove buttons in a floating toolbar). Mirrors
// web/src/dashboard/components/widget-tile.tsx with a single critical detail:
// the saved config is parsed through the widget's Zod schema before being
// passed to the render component, so newly-added config fields with .default()
// backfill cleanly on layouts saved before that field existed.

import { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import {
  IconAlertTriangle,
  IconSettings,
  IconTrash,
  IconGripVertical,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { widgetRegistry } from "../registry";
import { WIDGET_ROW_MAX_HEIGHT } from "../types";
import type { WidgetInstance, WidgetRows } from "../types";

interface WidgetTileProps {
  instance: WidgetInstance;
  isEditing: boolean;
  onRemove: () => void;
  /** Open the configuration modal for this instance. Wired by the parent
   *  screen which hosts the modal state — replaces the previous
   *  router.push('/dashboard/configure/...') flow. */
  onConfigure?: (instanceId: string) => void;
  /** Optional drag handle press handler — wired up by parent FlatList when
   *  draggable-flatlist support lands in Phase 4. Kept optional so Phase 1 can
   *  ship before reorder is wired. */
  onDragHandlePressIn?: () => void;
}

export function WidgetTile({
  instance,
  isEditing,
  onRemove,
  onConfigure,
  onDragHandlePressIn,
}: WidgetTileProps) {
  const { colors } = useTheme();
  const def = widgetRegistry.get(instance.widgetId);

  // Parse config through the widget's schema so new fields with .default()
  // backfill on layouts saved before the field existed. Without this, adding
  // a new sub-object like `display: { density, ... }` would crash render for
  // every existing instance until the user re-saved it.
  const parsedConfig = useMemo(() => {
    if (!def) return instance.config;
    const result = def.configSchema.safeParse(instance.config);
    return result.success ? result.data : def.defaultConfig;
  }, [def, instance.config]);

  if (!def) {
    return (
      <View
        style={{
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.05)",
          padding: 12,
          borderRadius: 8,
          gap: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <IconAlertTriangle size={16} color="#ef4444" />
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#ef4444" }}>
            Widget não encontrado
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
          ID “{instance.widgetId}” não está registrado.
        </Text>
        {isEditing && (
          <Pressable
            onPress={onRemove}
            style={{
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
              gap: 4,
              paddingVertical: 4,
              paddingHorizontal: 8,
            }}
          >
            <IconTrash size={14} color="#ef4444" />
            <Text style={{ fontSize: 12, color: "#ef4444" }}>Remover</Text>
          </Pressable>
        )}
      </View>
    );
  }

  const Render = def.RenderComponent;
  // Clamp the rendered widget body to the configured rows-height. Content
  // beyond this scrolls inside its own surface (each widget owns its scroll).
  // In edit mode we relax the cap so the user can see the whole widget while
  // dragging — the cap re-applies on Save.
  const rowsToken = (instance.size?.rows ?? def.defaultRows) as WidgetRows;
  const maxHeight = isEditing ? undefined : WIDGET_ROW_MAX_HEIGHT[rowsToken];

  return (
    <View
      style={{
        position: "relative",
        borderRadius: 12,
        borderWidth: isEditing ? 2 : 0,
        borderColor: isEditing ? colors.primary + "66" : "transparent",
      }}
    >
      <View style={{ maxHeight, overflow: "hidden", borderRadius: 12 }}>
        <Render
          instanceId={instance.instanceId}
          config={parsedConfig}
          size={instance.size}
          isEditing={isEditing}
        />
      </View>
      {isEditing && (
        <View
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: colors.card,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 4,
            paddingVertical: 4,
            zIndex: 20,
          }}
        >
          {onDragHandlePressIn && (
            <Pressable
              onPressIn={onDragHandlePressIn}
              accessibilityLabel={`Arrastar ${def.name}`}
              hitSlop={8}
              style={({ pressed }) => ({
                padding: 4,
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <IconGripVertical size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
          {onConfigure && (
            <Pressable
              onPress={() => onConfigure(instance.instanceId)}
              accessibilityLabel="Configurar widget"
              hitSlop={8}
              style={({ pressed }) => ({
                padding: 4,
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <IconSettings size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
          <Pressable
            onPress={onRemove}
            accessibilityLabel="Remover widget"
            hitSlop={8}
            style={({ pressed }) => ({
              padding: 4,
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <IconTrash size={16} color="#ef4444" />
          </Pressable>
        </View>
      )}
    </View>
  );
}
