
import { View, TouchableOpacity } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { PAINT_FINISH_LABELS, TRUCK_MANUFACTURER_LABELS } from "@/constants";
import type { Paint } from '../../../../types';

interface PaintCatalogCardProps {
  paint: Paint;
  onPress?: () => void;
}

export function PaintCatalogCard({ paint, onPress }: PaintCatalogCardProps) {
  // Helper function to get contrasting text color
  const getContrastingTextColor = (hexColor: string) => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
  };

  // Get labels
  const paintTypeLabel = paint.paintType?.name || "";
  const finishLabel = PAINT_FINISH_LABELS[paint.finish] || paint.finish;
  const brandLabel = paint.paintBrand?.name || "";
  const manufacturerLabel = paint.manufacturer ? TRUCK_MANUFACTURER_LABELS[paint.manufacturer] || paint.manufacturer : null;

  const textColor = getContrastingTextColor(paint.hex);
  const formulaCount = paint.formulas?.length || 0;
  const taskCount = (paint._count?.logoTasks || 0) + (paint._count?.generalPaintings || 0);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card className="overflow-hidden">
        {/* Color Preview */}
        <View className="h-24 relative" style={{ backgroundColor: paint.hex }}>
          {/* Gradient overlay for finish effect */}
          {paint.finish && (
            <LinearGradient
              colors={
                paint.finish === 'METALLIC'
                  ? ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.1)']
                  : paint.finish === 'MATTE'
                  ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                  : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.05)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
          )}
          {/* Hex code overlay */}
          <View
            className="absolute bottom-2 right-2 px-2 py-1 rounded"
            style={{
              backgroundColor: textColor === "#FFFFFF" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)",
            }}
          >
            <Text className="text-xs font-mono" style={{ color: textColor }}>
              {paint.hex}
            </Text>
          </View>
        </View>

        {/* Card Content */}
        <View className="p-4 gap-3">
          {/* Name */}
          <View>
            <Text className="text-base font-semibold text-foreground" numberOfLines={2}>
              {paint.name}
            </Text>
          </View>

          {/* Badges */}
          <View className="flex-row flex-wrap gap-1">
            {paintTypeLabel && (
              <Badge variant="secondary" className="flex-row items-center gap-1">
                <Icon name="droplet" size={12} />
                <Text className="text-xs">{paintTypeLabel}</Text>
              </Badge>
            )}

            <Badge variant="secondary" className="flex-row items-center gap-1">
              <Icon name="sparkles" size={12} />
              <Text className="text-xs">{finishLabel}</Text>
            </Badge>

            {brandLabel && (
              <Badge variant="outline">
                <Text className="text-xs">{brandLabel}</Text>
              </Badge>
            )}

            {manufacturerLabel && (
              <Badge variant="outline" className="flex-row items-center gap-1">
                <Icon name="truck" size={12} />
                <Text className="text-xs">{manufacturerLabel}</Text>
              </Badge>
            )}
          </View>

          {/* Tags */}
          {paint.tags && paint.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-1">
              {paint.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex-row items-center gap-1">
                  <Icon name="tag" size={12} />
                  <Text className="text-xs">{tag}</Text>
                </Badge>
              ))}
              {paint.tags.length > 3 && (
                <Badge variant="secondary">
                  <Text className="text-xs">+{paint.tags.length - 3}</Text>
                </Badge>
              )}
            </View>
          )}

          {/* Formula Quantity */}
          <View className="flex-row items-center gap-2">
            <Icon
              name="flask"
              size={16}
              className={formulaCount > 0 ? "text-green-600" : "text-red-600"}
            />
            <Text className={formulaCount > 0 ? "text-sm text-foreground" : "text-sm text-muted-foreground"}>
              {formulaCount} fórmula{formulaCount !== 1 ? "s" : ""}
            </Text>
          </View>

          {/* Task Count */}
          <View className="flex-row items-center gap-2">
            <Icon
              name="clipboard-list"
              size={16}
              className={taskCount > 0 ? "text-blue-600" : "text-muted-foreground"}
            />
            <Text className={taskCount > 0 ? "text-sm text-foreground" : "text-sm text-muted-foreground"}>
              {taskCount} tarefa{taskCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
