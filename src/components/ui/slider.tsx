
import { View, ViewStyle, Text , StyleSheet} from "react-native";
import SliderComponent from "@react-native-community/slider";
import { useTheme } from "@/lib/theme";
import { Label } from "./label";

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
}

export function Slider({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  label,
  showValue = false,
  style,
  disabled = false,
}: SliderProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      width: "100%",
    },
    sliderContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    slider: {
      flex: 1,
      height: 40,
    },
    valueText: {
      minWidth: 40,
      textAlign: "center",
      fontSize: 14,
      fontWeight: "500",
      color: colors.foreground,
    },
  });

  return (
    <View style={StyleSheet.flatten([styles.container, style])}>
      {label && <Label>{label}</Label>}
      <View style={styles.sliderContainer}>
        <SliderComponent
          style={styles.slider}
          value={value}
          onValueChange={onValueChange}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          step={step}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.muted}
          thumbTintColor={colors.primary}
          disabled={disabled}
        />
        {showValue && (
          <Text style={styles.valueText}>
            {Math.round(value)}
          </Text>
        )}
      </View>
    </View>
  );
}