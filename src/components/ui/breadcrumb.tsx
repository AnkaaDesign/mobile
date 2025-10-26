import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "@/lib/theme";
import { Icon } from "./icon";
import { fontSize, spacing } from "@/constants/design-system";

interface BreadcrumbItem {
  label: string;
  onPress?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHomeIcon?: boolean;
  onHomePress?: () => void;
  separator?: "chevron" | "slash";
}

export function Breadcrumb({
  items,
  showHomeIcon = true,
  onHomePress,
  separator = "chevron",
}: BreadcrumbProps) {
  const { colors } = useTheme();

  if (!items || items.length === 0) {
    return null;
  }

  const SeparatorIcon = separator === "chevron" ? (
    <Icon name="chevron-right" size={14} color={colors.mutedForeground} />
  ) : (
    <Text style={[styles.separator, { color: colors.mutedForeground }]}>/</Text>
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* Home Icon */}
      {showHomeIcon && (
        <>
          <Pressable
            onPress={onHomePress}
            style={styles.itemContainer}
            android_ripple={{ color: colors.accent }}
          >
            <Icon name="home" size={14} color={colors.mutedForeground} />
            <Text style={[styles.itemText, { color: colors.mutedForeground }]}>
              Início
            </Text>
          </Pressable>
          {items.length > 0 && <View style={styles.separatorContainer}>{SeparatorIcon}</View>}
        </>
      )}

      {/* Breadcrumb Items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const canNavigate = item.onPress && !isLast;

        return (
          <React.Fragment key={index}>
            {canNavigate ? (
              <Pressable
                onPress={item.onPress}
                style={styles.itemContainer}
                android_ripple={{ color: colors.accent }}
              >
                <Text
                  style={[styles.itemText, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.itemContainer}>
                <Text
                  style={[
                    styles.itemText,
                    {
                      color: isLast ? colors.foreground : colors.mutedForeground,
                      fontWeight: isLast ? "600" : "400",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>
            )}

            {!isLast && <View style={styles.separatorContainer}>{SeparatorIcon}</View>}
          </React.Fragment>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 200,
  },
  itemText: {
    fontSize: fontSize.sm,
  },
  separatorContainer: {
    marginHorizontal: spacing.xs,
  },
  separator: {
    fontSize: fontSize.sm,
  },
});
