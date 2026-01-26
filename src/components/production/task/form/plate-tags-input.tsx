import { useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Controller } from "react-hook-form";
import { ThemedText } from "@/components/ui/themed-text";
import { Input } from "@/components/ui/input";
import { FormFieldGroup } from "@/components/ui/form-section";
import { useTheme } from "@/lib/theme";
import { IconX } from "@tabler/icons-react-native";

interface PlateTagsInputProps {
  control: any;
  disabled?: boolean;
}

/**
 * Format Brazilian license plate for display
 * Old format: ABC-1234 (3 letters + hyphen + 4 numbers)
 * Mercosul format: ABC-1D23 (3 letters + hyphen + 1 number + 1 letter + 2 numbers)
 */
const formatPlate = (val: string): string => {
  const clean = val.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (clean.length <= 3) {
    return clean;
  }
  // Add hyphen after first 3 characters
  return clean.slice(0, 3) + "-" + clean.slice(3, 7);
};

export function PlateTagsInput({ control, disabled }: PlateTagsInputProps) {
  const { colors } = useTheme();
  const [newPlate, setNewPlate] = useState("");

  const handlePlateChange = useCallback((text: string) => {
    // Clean and format as user types
    const formatted = formatPlate(text);
    setNewPlate(formatted);
  }, []);

  return (
    <Controller
      control={control}
      name="plates"
      render={({ field, fieldState }) => {
        const plates: string[] = field.value || [];

        const handleAddPlate = () => {
          const formattedPlate = formatPlate(newPlate.trim());

          if (!formattedPlate || formattedPlate.length < 4) {
            return;
          }

          // Check if plate already exists (compare without formatting differences)
          const cleanNewPlate = formattedPlate.replace(/-/g, "");
          const alreadyExists = plates.some(
            (p) => p.replace(/-/g, "") === cleanNewPlate
          );

          if (alreadyExists) {
            setNewPlate("");
            return;
          }

          // Add formatted plate to array
          field.onChange([...plates, formattedPlate]);
          setNewPlate("");
        };

        const handleRemovePlate = (index: number) => {
          const updatedPlates = plates.filter((_, i) => i !== index);
          field.onChange(updatedPlates);
        };

        return (
          <FormFieldGroup label="Placas" error={fieldState.error?.message}>
            <Input
              value={newPlate}
              onChangeText={handlePlateChange}
              onSubmitEditing={handleAddPlate}
              placeholder="Ex: ABC-1234"
              disabled={disabled}
              autoCapitalize="characters"
              returnKeyType="done"
              blurOnSubmit={false}
              maxLength={8}
            />

            {plates.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.badgesContainer}
                contentContainerStyle={styles.badgesContent}
              >
                {plates.map((plate, index) => (
                  <View
                    key={`${plate}-${index}`}
                    style={[
                      styles.badge,
                      {
                        backgroundColor: colors.secondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <ThemedText style={styles.badgeText}>{plate}</ThemedText>
                    <TouchableOpacity
                      onPress={() => handleRemovePlate(index)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      disabled={disabled}
                    >
                      <IconX size={16} color={colors.secondaryForeground} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </FormFieldGroup>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  badgesContainer: {
    marginTop: 8,
    maxHeight: 120,
  },
  badgesContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
