import React from "react";
import { View, Modal, Pressable, ScrollView, ViewStyle, StyleSheet} from "react-native";
import { ThemedText } from "./themed-text";
import { Button } from "./button";
import { Badge } from "./badge";
import { useTheme } from "@/lib/theme";
import { IconX } from "@tabler/icons-react-native";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  onApply?: () => void;
  onReset?: () => void;
  style?: ViewStyle;
}

export function FilterModal({
  visible,
  onClose,
  title = "Filtros",
  children,
  onApply,
  onReset,
  style,
}: FilterModalProps) {
  const { colors, spacing } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
        />
        <View
          style={StyleSheet.flatten([
            {
              backgroundColor: colors.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "80%",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 10,
            },
            style,
          ])}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <ThemedText size="lg" weight="semibold">
              {title}
            </ThemedText>
            <Pressable onPress={onClose}>
              <IconX size={24} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            style={{
              padding: spacing.md,
            }}
            contentContainerStyle={{
              paddingBottom: spacing.lg,
            }}
          >
            {children}
          </ScrollView>

          {/* Footer */}
          <View
            style={{
              flexDirection: "row",
              padding: spacing.md,
              gap: spacing.sm,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            {onReset && (
              <Button
                variant="outline"
                onPress={onReset}
                style={{ flex: 1 }}
              >
                Limpar
              </Button>
            )}
            <Button
              variant="default"
              onPress={() => {
                onApply?.();
                onClose();
              }}
              style={{ flex: 1 }}
            >
              Aplicar
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface FilterTagProps {
  label: string;
  value?: string | number;
  onRemove?: () => void;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function FilterTag({ label, value, onRemove, selected, onPress, style }: FilterTagProps) {
  const { colors, spacing } = useTheme();

  // If used as a selection filter (onPress provided)
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={style}>
        <Badge
          variant={selected ? "default" : "outline"}
          style={StyleSheet.flatten([
            {
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
            },
          ])}
        >
          <ThemedText size="xs" weight="medium">
            {label}
          </ThemedText>
        </Badge>
      </Pressable>
    );
  }

  // Standard filter tag with value and remove option
  return (
    <Badge
      variant="secondary"
      style={StyleSheet.flatten([
        {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          gap: spacing.xs,
        },
        style,
      ])}
    >
      <ThemedText size="xs" weight="medium">
        {label}: {value}
      </ThemedText>
      {onRemove && (
        <Pressable onPress={onRemove}>
          <IconX size={14} color={colors.mutedForeground} />
        </Pressable>
      )}
    </Badge>
  );
}