import { useState, useCallback, useMemo } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Controller } from "react-hook-form";
import { ThemedText } from "@/components/ui/themed-text";
import { Input } from "@/components/ui/input";
import { FormFieldGroup } from "@/components/ui/form-section";
import { useTheme } from "@/lib/theme";
import { useTasks } from "@/hooks";
import { useDebounce } from "@/hooks/useDebouncedSearch";

interface TaskNameAutocompleteProps {
  control: any;
  disabled?: boolean;
}

export function TaskNameAutocomplete({ control, disabled }: TaskNameAutocompleteProps) {
  const { colors } = useTheme();
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Debounce the search query
  const debouncedSearch = useDebounce(inputValue, 300);

  // Fetch task suggestions based on search
  const { data: tasksData, isLoading } = useTasks({
    searchingFor: debouncedSearch,
    limit: 100,
    enabled: debouncedSearch.length >= 2,
  });

  // Extract unique task names from the results
  const suggestions = useMemo(() => {
    if (!tasksData?.data) return [];

    const uniqueSet = new Set<string>();

    tasksData.data.forEach((task) => {
      if (task.name && task.name.trim().length > 0) {
        uniqueSet.add(task.name.trim());
      }
    });

    // Convert to array, sort alphabetically, and limit to 20 suggestions
    return Array.from(uniqueSet)
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 20);
  }, [tasksData]);

  const handleSelect = useCallback(
    (suggestion: string, onChange: (value: string) => void) => {
      setInputValue(suggestion);
      onChange(suggestion);
      setIsOpen(false);
    },
    []
  );

  return (
    <Controller
      control={control}
      name="name"
      render={({ field, fieldState }) => (
        <View>
          <FormFieldGroup label="Nome da Tarefa" error={fieldState.error?.message}>
            <View style={styles.inputContainer}>
              <Input
                value={inputValue}
                onChangeText={(text) => {
                  const value = text ?? '';
                  setInputValue(value);
                  field.onChange(value);
                  // Show dropdown when typing 2+ characters
                  if (value.length >= 2) {
                    setIsOpen(true);
                  } else {
                    setIsOpen(false);
                  }
                }}
                onFocus={() => {
                  // Reopen dropdown if we have valid criteria
                  if (inputValue.length >= 2 && suggestions.length > 0) {
                    setIsOpen(true);
                  }
                }}
                onBlur={() => {
                  // Delay closing to allow suggestion selection
                  setTimeout(() => {
                    setIsOpen(false);
                  }, 200);
                }}
                placeholder="Ex: Pintura completa do caminhão"
                disabled={disabled}
                error={fieldState.error?.message}
              />
              {isLoading && (
                <View style={styles.loadingIndicator}>
                  <ActivityIndicator size="small" color={colors.mutedForeground} />
                </View>
              )}
            </View>
          </FormFieldGroup>

          {/* Suggestions Dropdown */}
          {isOpen && suggestions.length > 0 && (
            <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <FlatList
                data={suggestions}
                keyExtractor={(item, index) => `${item}-${index}`}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleSelect(item, field.onChange)}
                  >
                    <ThemedText style={styles.suggestionText}>{item}</ThemedText>
                  </TouchableOpacity>
                )}
                style={styles.suggestionsList}
                showsVerticalScrollIndicator={true}
              />
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    position: "relative",
  },
  loadingIndicator: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -10,
  },
  dropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 240,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionsList: {
    flexGrow: 0,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
  },
});
