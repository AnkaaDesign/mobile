import React, { useState, useRef } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, Modal } from "react-native";
import { IconX, IconChevronDown } from "@tabler/icons-react-native";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/contexts/theme-context";
export const MultiSelectCombobox = ({
  options = [],
  selectedValues = [],
  onValueChange,
  onCreate,
  placeholder = "Select items...",
  selectedText = "items selected",
  searchPlaceholder = "Search...",
  onSearchChange,
  onEndReached,
  isLoading = false,
  disabled = false,
  className = "",
}) => {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const selectRef = useRef(null);
  const [inputLayout, setInputLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  // Filter options based on search query
  const filteredOptions =
    searchText.trim() === ""
      ? options
      : options.filter((option) => {
          // Safely check if label exists and is a string before calling toLowerCase
          return option && typeof option.label === "string" && option.label.toLowerCase().includes((searchText || "").toLowerCase());
        });
  // Measure button position for proper dropdown placement
  const measureSelect = () => {
    selectRef.current?.measureInWindow((x, y, width, height) => {
      setInputLayout({ x, y, width, height });
    });
  };
  // Handle opening the dropdown
  const handleOpen = () => {
    if (disabled) return;
    measureSelect();
    setOpen(true);
    setSearchText("");
  };
  // Handle closing the dropdown
  const handleClose = () => {
    setOpen(false);
    setSearchText("");
  };
  // Handle option selection
  const handleSelect = (value) => {
    let newSelectedValues;
    if (selectedValues.includes(value)) {
      // Remove the value if already selected
      newSelectedValues = selectedValues.filter((v) => v !== value);
    } else {
      // Add the value if not already selected
      newSelectedValues = [...selectedValues, value];
    }
    onValueChange(newSelectedValues);
  };
  // Handle select all functionality
  const handleSelectAll = () => {
    const allFilteredSelected = filteredOptions.length > 0 && filteredOptions.every((option) => selectedValues.includes(option.value));

    if (allFilteredSelected) {
      // If all filtered options are selected, deselect them all
      const filteredValues = filteredOptions.map((option) => option.value);
      const newSelectedValues = selectedValues.filter((value) => !filteredValues.includes(value));
      onValueChange(newSelectedValues);
    } else {
      // Select all filtered options (keeping previously selected ones that aren't in filtered)
      const filteredValues = filteredOptions.map((option) => option.value);
      const existingNonFilteredValues = selectedValues.filter((value) => !filteredValues.includes(value));
      const newSelectedValues = [...existingNonFilteredValues, ...filteredValues];
      onValueChange(newSelectedValues);
    }
  };
  // Remove a selected item
  const removeItem = (value) => {
    const newSelectedValues = selectedValues.filter((v) => v !== value);
    onValueChange(newSelectedValues);
  };
  // Handle search input change
  const handleSearchChange = (text) => {
    setSearchText(text);
    if (onSearchChange) {
      onSearchChange(text);
    }
  };
  // Handle creating a new option
  const handleCreate = () => {
    if (onCreate && searchText.trim()) {
      onCreate(searchText.trim());
      setSearchText("");
    }
  };
  // Handle scroll to end for pagination
  const handleEndReached = () => {
    if (onEndReached) {
      onEndReached();
    }
  };
  // Get display text for the trigger button
  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    return `${selectedValues.length} ${
      selectedValues.length === 1
        ? selectedText.replace(/s$/, "") // Remove trailing 's' if singular
        : selectedText
    }`;
  };
  // Get label for an option by its value
  const getLabelByValue = (value) => {
    const option = options.find((opt) => opt && opt.value === value);
    return option?.label || String(value);
  };
  // Get select all checkbox state
  const getSelectAllState = () => {
    return filteredOptions.length > 0 && filteredOptions.every((option) => selectedValues.includes(option.value));
  };
  // Render selected badges
  const renderSelectedBadges = () => {
    if (selectedValues.length === 0) return null;
    return (
      <View
        style={{
          marginTop: 8,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 4,
        }}
      >
        {selectedValues.map((value) => (
          <Badge key={`selected-${value}`} label={getLabelByValue(value)} onRemove={() => removeItem(value)} />
        ))}
      </View>
    );
  };
  // Render option item
  const renderOptionItem = ({ item }) => {
    if (!item) return null;
    const isSelected = selectedValues.includes(item.value);
    return (
      <TouchableOpacity
        onPress={() => handleSelect(item.value)}
        style={{
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 8,
          backgroundColor: colors.popover,
        }}
      >
        <Checkbox checked={isSelected} onCheckedChange={(checked) => handleSelect(item.value)} style={{ marginRight: 8 }} />
        <Text
          style={{
            flex: 1,
            color: colors.popoverForeground,
          }}
          numberOfLines={1}
        >
          {item.label || String(item.value)}
        </Text>
      </TouchableOpacity>
    );
  };
  // Calculate dropdown position
  const screenHeight = Dimensions.get("window").height;
  const listMaxHeight = 300; // Max height of the dropdown
  const spaceBelow = screenHeight - (inputLayout.y + inputLayout.height);
  const showBelow = spaceBelow >= Math.min(listMaxHeight, filteredOptions.length * 44 + 56);
  // Determine if we should show the create option
  const showCreateOption = onCreate && searchText.trim().length > 0 && !filteredOptions.some((o) => o.label.toLowerCase() === searchText.trim().toLowerCase());
  return (
    <View style={{ width: "100%", position: "relative" }}>
      {/* Trigger Button */}
      <TouchableOpacity
        ref={selectRef}
        onPress={handleOpen}
        disabled={disabled}
        style={{
          height: 40,
          borderWidth: 1,
          borderRadius: 6,
          borderColor: disabled ? colors.muted : colors.border,
          backgroundColor: disabled ? colors.muted : colors.input,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View style={{ paddingHorizontal: 16, justifyContent: "center", flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              color: disabled ? colors.mutedForeground : colors.foreground,
            }}
            numberOfLines={1}
          >
            {getDisplayText()}
          </Text>
        </View>
        <View style={{ position: "absolute", right: 12, top: "50%", marginTop: -8 }}>
          <IconChevronDown size={16} color={disabled ? colors.mutedForeground : colors.foreground} />
        </View>
      </TouchableOpacity>

      {/* Selected Badges */}
      {renderSelectedBadges()}

      {/* Modal for dropdown */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={handleClose}>
        <TouchableOpacity activeOpacity={1} onPress={handleClose} style={{ flex: 1 }}>
          {/* Dropdown Panel */}
          <View
            style={{
              position: "absolute",
              width: inputLayout.width,
              left: inputLayout.x,
              top: showBelow ? inputLayout.y + inputLayout.height + 4 : undefined,
              bottom: !showBelow ? screenHeight - inputLayout.y + 4 : undefined,
              maxHeight: listMaxHeight + 56,
              backgroundColor: colors.popover,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: isDark ? "#000" : "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.15,
              shadowRadius: 8,
              elevation: 5, // For Android
            }}
          >
            {/* Search Input */}
            <View style={{ overflow: "hidden", width: "100%", height: "100%", borderRadius: 6 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <TextInput
                  value={searchText}
                  onChangeText={handleSearchChange}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={colors.mutedForeground}
                  style={{
                    width: "100%",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    height: 48,
                    backgroundColor: colors.popover,
                    fontSize: 16,
                    color: colors.popoverForeground,
                  }}
                  autoCapitalize="none"
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchText("")} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }} style={{ position: "absolute", right: 12 }}>
                    <IconX size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Options List */}
              <FlatList
                data={filteredOptions}
                renderItem={renderOptionItem}
                keyExtractor={(item) => item?.key || String(item?.value) || `option-${Math.random()}`}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: listMaxHeight }}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={
                  filteredOptions.length > 0 ? (
                    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <TouchableOpacity
                        onPress={handleSelectAll}
                        style={{
                          minHeight: 44,
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          backgroundColor: colors.popover,
                        }}
                      >
                        <Checkbox checked={getSelectAllState()} onCheckedChange={handleSelectAll} style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 14, fontWeight: "500", color: colors.popoverForeground }}>Selecionar todos</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  <View style={{ padding: 16, alignItems: "center" }}>
                    {isLoading ? <ActivityIndicator color={colors.primary} /> : <Text style={{ fontSize: 14, color: colors.mutedForeground }}>No options found</Text>}
                  </View>
                }
                ListFooterComponent={
                  isLoading ? (
                    <View style={{ paddingVertical: 8, alignItems: "center", justifyContent: "center" }}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : null
                }
              />

              {/* Create Option Button (if onCreate is provided) */}
              {showCreateOption && (
                <TouchableOpacity
                  onPress={handleCreate}
                  style={{
                    minHeight: 44,
                    flexDirection: "row",
                    alignItems: "center",
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    backgroundColor: colors.popover,
                  }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontWeight: "600",
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {`Adicionar "${searchText.trim()}"`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
const Badge = ({ label, onRemove }) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: isDark ? "rgba(59, 130, 246, 0.2)" : "#dbeafe", // blue-100 light, blue-500 with 20% opacity dark
        borderWidth: 1,
        borderColor: isDark ? "rgba(59, 130, 246, 0.3)" : "#93c5fd", // blue-300 light, blue-500 with 30% opacity dark
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          color: isDark ? "#93c5fd" : "#1e40af", // blue-400 dark, blue-800 light
          marginRight: 4,
        }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <IconX size={14} color={isDark ? "#93c5fd" : "#2563eb"} />
      </TouchableOpacity>
    </View>
  );
};
const Chip = ({ label, onRemove }) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.primaryContainer,
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          color: colors.primary,
          marginRight: 4,
        }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }} style={{ padding: 2 }}>
        <IconX size={14} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
};
