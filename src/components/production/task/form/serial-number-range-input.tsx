import { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Controller } from "react-hook-form";
import { ThemedText } from "@/components/ui/themed-text";
import { Input } from "@/components/ui/input";
import { FormFieldGroup } from "@/components/ui/form-section";
import { useTheme } from "@/lib/theme";
import { IconX } from "@tabler/icons-react-native";

interface SerialNumberRangeInputProps {
  control: any;
  disabled?: boolean;
}

export function SerialNumberRangeInput({ control, disabled }: SerialNumberRangeInputProps) {
  const { colors } = useTheme();
  const [newRange, setNewRange] = useState("");

  return (
    <Controller
      control={control}
      name="serialNumbers"
      render={({ field, fieldState }) => {
        const serialNumbers: number[] = field.value || [];

        const handleGenerateRange = () => {
          const trimmedValue = newRange.trim();

          if (!trimmedValue) {
            return;
          }

          // Parse input - split by whitespace and convert to numbers
          const parts = trimmedValue.split(/\s+/);
          const numbers = parts
            .map((p) => parseInt(p, 10))
            .filter((n) => !isNaN(n));

          if (numbers.length === 0) {
            setNewRange("");
            return;
          }

          let newNumbers: number[] = [];

          if (numbers.length === 1) {
            // Single number
            newNumbers = [numbers[0]];
          } else {
            // Multiple numbers - create range from min to max
            const from = Math.min(...numbers);
            const to = Math.max(...numbers);

            for (let i = from; i <= to; i++) {
              newNumbers.push(i);
            }
          }

          // Filter out duplicates and numbers already in the list
          const uniqueNewNumbers = newNumbers.filter(
            (num) => !serialNumbers.includes(num)
          );

          if (uniqueNewNumbers.length > 0) {
            // Add new numbers and sort
            const updatedNumbers = [...serialNumbers, ...uniqueNewNumbers].sort(
              (a, b) => a - b
            );
            field.onChange(updatedNumbers);
          }

          setNewRange("");
        };

        const handleRemoveNumber = (index: number) => {
          const updatedNumbers = serialNumbers.filter((_, i) => i !== index);
          field.onChange(updatedNumbers);
        };

        return (
          <FormFieldGroup
            label="Números de Série"
            error={fieldState.error?.message}
          >
            <Input
              value={newRange}
              onChangeText={setNewRange}
              onSubmitEditing={handleGenerateRange}
              placeholder="Ex: 10 14"
              disabled={disabled}
              keyboardType="numeric"
              returnKeyType="done"
              blurOnSubmit={false}
            />

            {serialNumbers.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.badgesContainer}
                contentContainerStyle={styles.badgesContent}
              >
                {serialNumbers.map((num, index) => (
                  <View
                    key={`${num}-${index}`}
                    style={[
                      styles.badge,
                      {
                        backgroundColor: colors.secondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <ThemedText style={styles.badgeText}>{num}</ThemedText>
                    <TouchableOpacity
                      onPress={() => handleRemoveNumber(index)}
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
