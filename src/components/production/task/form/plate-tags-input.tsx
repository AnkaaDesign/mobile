import { useState } from "react";
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

export function PlateTagsInput({ control, disabled }: PlateTagsInputProps) {
  const { colors } = useTheme();
  const [newPlate, setNewPlate] = useState("");

  return (
    <Controller
      control={control}
      name="plates"
      render={({ field, fieldState }) => {
        const plates: string[] = field.value || [];

        const handleAddPlate = () => {
          const trimmedPlate = newPlate.trim().toUpperCase();

          if (!trimmedPlate) {
            return;
          }

          // Check if plate already exists
          if (plates.includes(trimmedPlate)) {
            setNewPlate("");
            return;
          }

          // Add plate to array
          field.onChange([...plates, trimmedPlate]);
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
              onChangeText={(text) => setNewPlate(text.toUpperCase())}
              onSubmitEditing={handleAddPlate}
              placeholder="Digite a placa e pressione Enter"
              disabled={disabled}
              autoCapitalize="characters"
              returnKeyType="done"
              blurOnSubmit={false}
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
