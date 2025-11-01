import { useState, useEffect } from "react";
import { Text, View } from "react-native";
import { Switch } from "./switch";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Card } from "./card";
import { useHaptics, selectionHaptic } from "@/utils/haptics";
import { useTheme } from "@/lib/theme";

/**
 * Haptic feedback settings component
 *
 * @example
 * ```tsx
 * // In settings screen
 * <HapticSettings />
 * ```
 */
export function HapticSettings() {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const [enabled, setEnabled] = useState(haptics.settings.enabled);
  const [intensity, setIntensity] = useState(haptics.settings.intensity);

  useEffect(() => {
    setEnabled(haptics.settings.enabled);
    setIntensity(haptics.settings.intensity);
  }, [haptics.settings]);

  const handleToggleEnabled = async (value: boolean) => {
    setEnabled(value);
    await haptics.toggle(value);
    if (value) {
      // Provide feedback when enabling
      await selectionHaptic();
    }
  };

  const handleIntensityChange = async (value: string) => {
    const newIntensity = value as "light" | "medium" | "heavy";
    setIntensity(newIntensity);
    await haptics.setIntensity(newIntensity);

    // Provide feedback with the new intensity
    switch (newIntensity) {
      case "light":
        await haptics.lightImpact();
        break;
      case "medium":
        await haptics.impact();
        break;
      case "heavy":
        await haptics.heavyImpact();
        break;
    }
  };

  return (
    <Card style={{ padding: 16, gap: 16 }}>
      <View style={{ gap: 12 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.foreground,
          }}
        >
          Feedback Tátil
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: colors.foreground,
            }}
          >
            Ativar vibração
          </Text>
          <Switch checked={enabled} onCheckedChange={handleToggleEnabled} />
        </View>
      </View>

      {enabled && (
        <View style={{ gap: 12 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "500",
              color: colors.foreground,
            }}
          >
            Intensidade
          </Text>

          <RadioGroup
            value={intensity}
            onValueChange={handleIntensityChange}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <RadioGroupItem value="light" />
              <Text style={{ fontSize: 16, color: colors.foreground }}>Leve</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <RadioGroupItem value="medium" />
              <Text style={{ fontSize: 16, color: colors.foreground }}>Médio</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <RadioGroupItem value="heavy" />
              <Text style={{ fontSize: 16, color: colors.foreground }}>Forte</Text>
            </View>
          </RadioGroup>

          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              fontStyle: "italic",
            }}
          >
            Toque em uma opção para sentir a intensidade
          </Text>
        </View>
      )}
    </Card>
  );
}
