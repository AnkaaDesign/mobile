import { View, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { PAINT_FINISH_LABELS, TRUCK_MANUFACTURER_LABELS } from "@/constants";
import type { Paint } from '../../../../types';
import { PaintPreview } from "@/components/painting/preview/painting-preview";
import { IconFlask, IconClipboardList } from "@tabler/icons-react-native";

interface PaintCatalogCardProps {
  paint: Paint;
  onPress?: () => void;
}

// Badge colors - unified neutral, more subtle (for type, brand, finish, manufacturer)
const BADGE_COLORS = {
  light: { bg: 'rgba(229, 229, 229, 0.7)', text: '#525252' },  // neutral-200/70, neutral-600
  dark: { bg: 'rgba(64, 64, 64, 0.5)', text: '#d4d4d4' },      // neutral-700/50, neutral-300
};
// Tag badge colors - inverted (dark in light mode, light in dark mode)
const TAG_BADGE_COLORS = {
  light: { bg: '#404040', text: '#f5f5f5' },  // neutral-700, neutral-100
  dark: { bg: '#d4d4d4', text: '#262626' },   // neutral-300, neutral-800
};

export function PaintCatalogCard({ paint, onPress }: PaintCatalogCardProps) {
  const { colors, isDark } = useTheme();
  const badgeStyle = isDark ? BADGE_COLORS.dark : BADGE_COLORS.light;
  const tagBadgeStyle = isDark ? TAG_BADGE_COLORS.dark : TAG_BADGE_COLORS.light;

  // Helper function to get contrasting text color based on luminance
  const getContrastingTextColor = (hexColor: string) => {
    if (!hexColor) return "#000000";
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
  };

  // Get adaptive background for paint code overlay
  // Dark colors need light background, light colors need dark background
  const getCodeOverlayStyle = (hexColor: string) => {
    const textColor = getContrastingTextColor(hexColor);
    // If text should be white (dark paint), use white bg with black text
    // If text should be black (light paint), use black bg with white text
    if (textColor === "#FFFFFF") {
      // Dark paint - use white/light background
      return { backgroundColor: "rgba(255,255,255,0.9)", color: "#000000" };
    } else {
      // Light paint - use dark background
      return { backgroundColor: "rgba(0,0,0,0.75)", color: "#FFFFFF" };
    }
  };

  // Get labels
  const paintTypeLabel = paint.paintType?.name || "";
  const finishLabel = PAINT_FINISH_LABELS[paint.finish] || paint.finish;
  const brandLabel = paint.paintBrand?.name || "";
  const manufacturerLabel = paint.manufacturer ? TRUCK_MANUFACTURER_LABELS[paint.manufacturer] || paint.manufacturer : null;

  // Only show paint code if available (no hex fallback)
  const codeOverlayStyle = getCodeOverlayStyle(paint.hex);

  const formulaCount = paint.formulas?.length || 0;
  const taskCount = (paint._count?.logoTasks || 0) + (paint._count?.generalPaintings || 0);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card className="overflow-hidden">
        {/* Color Preview - uses stored image if available, falls back to hex */}
        <View className="h-28 relative overflow-hidden">
          <PaintPreview
            paint={paint}
            baseColor={paint.hex}
            width={500}
            height={112}
            borderRadius={0}
            style={{ width: '100%', height: '100%' }}
          />
          {/* Paint code overlay - only shown if code exists */}
          {paint.code && (
            <View
              className="absolute bottom-2 right-2 px-2 py-1 rounded"
              style={{ backgroundColor: codeOverlayStyle.backgroundColor }}
            >
              <Text className="text-xs font-mono" style={{ color: codeOverlayStyle.color }}>
                {paint.code}
              </Text>
            </View>
          )}
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          {/* Name */}
          <Text className="text-base font-semibold text-foreground" numberOfLines={2}>
            {paint.name}
          </Text>

          {/* Badges - unified neutral style */}
          <View style={styles.badgeContainer}>
            {paintTypeLabel && (
              <Badge style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
                <Text style={[styles.badgeText, { color: badgeStyle.text }]}>
                  {paintTypeLabel}
                </Text>
              </Badge>
            )}

            <Badge style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
              <Text style={[styles.badgeText, { color: badgeStyle.text }]}>
                {finishLabel}
              </Text>
            </Badge>

            {brandLabel && (
              <Badge style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
                <Text style={[styles.badgeText, { color: badgeStyle.text }]}>
                  {brandLabel}
                </Text>
              </Badge>
            )}

            {manufacturerLabel && (
              <Badge style={[styles.badge, styles.manufacturerBadge, { backgroundColor: badgeStyle.bg }]}>
                <Text style={[styles.badgeText, { color: badgeStyle.text }]} numberOfLines={1}>
                  {manufacturerLabel}
                </Text>
              </Badge>
            )}
          </View>

          {/* Tags section - takes remaining space to push formula/tasks to bottom */}
          <View style={styles.tagsSection}>
            {paint.tags && paint.tags.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagsContent}
              >
                {paint.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    style={[styles.badge, { backgroundColor: tagBadgeStyle.bg }]}
                  >
                    <Text style={[styles.badgeText, { color: tagBadgeStyle.text }]}>
                      {tag}
                    </Text>
                  </Badge>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Formula and Task counts in a row */}
          <View style={styles.countsRow}>
            <View style={styles.countItem}>
              <IconFlask
                size={14}
                color={formulaCount > 0 ? "#16a34a" : "#ef4444"}
              />
              <Text style={[styles.countText, { color: formulaCount > 0 ? colors.foreground : colors.mutedForeground }]}>
                {formulaCount} fórmula{formulaCount !== 1 ? "s" : ""}
              </Text>
            </View>

            <View style={styles.countItem}>
              <IconClipboardList
                size={14}
                color={taskCount > 0 ? "#2563eb" : colors.mutedForeground}
              />
              <Text style={[styles.countText, { color: taskCount > 0 ? colors.foreground : colors.mutedForeground }]}>
                {taskCount} tarefa{taskCount !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContent: {
    flex: 1,
    padding: 12,
    gap: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "nowrap",
    overflow: "hidden",
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0,
  },
  manufacturerBadge: {
    maxWidth: 100,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  tagsSection: {
    flex: 1,
    justifyContent: "flex-end",
    marginTop: 8,
  },
  tagsContent: {
    gap: 4,
  },
  countsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  countItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
