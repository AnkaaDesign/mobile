import * as React from "react";
import { ActivityIndicator, Animated, Keyboard,
  Platform, Pressable, StyleSheet, TextInput,
  TextStyle, View, ViewStyle } from "react-native";
import { useTheme } from "@/lib/theme";
import { Icon } from "./icon";
import { borderRadius, fontSize, transitions } from "@/constants/design-system";

export interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSearch?: (text: string) => void;
  placeholder?: string;
  loading?: boolean;
  debounceMs?: number;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  editable?: boolean;
  showClearButton?: boolean;
  returnKeyType?: "search" | "done" | "go" | "next" | "send";
  onSubmitEditing?: () => void;
  testID?: string;
}

const SearchBar = React.forwardRef<TextInput, SearchBarProps>(
  (
    {
      value = "",
      onChangeText,
      onSearch,
      placeholder = "Pesquisar...",
      loading = false,
      debounceMs = 300,
      autoFocus = false,
      onFocus,
      onBlur,
      style,
      inputStyle,
      editable = true,
      showClearButton = true,
      returnKeyType = "search",
      onSubmitEditing,
      testID,
    },
    ref,
  ) => {
    const { colors, isDark } = useTheme();
    const [isFocused, setIsFocused] = React.useState(false);
    const [localValue, setLocalValue] = React.useState(value);

    // Animation values
    const borderColorAnim = React.useRef(new Animated.Value(0)).current;
    const clearButtonScale = React.useRef(new Animated.Value(0)).current;

    // Debounce timer ref
    const debounceTimer = React.useRef<NodeJS.Timeout | undefined>(undefined);

    // Update local value when prop changes
    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    // Animate focus state
    React.useEffect(() => {
      Animated.timing(borderColorAnim, {
        toValue: isFocused ? 1 : 0,
        duration: transitions.fast,
        useNativeDriver: false,
      }).start();
    }, [isFocused, borderColorAnim]);

    // Animate clear button
    React.useEffect(() => {
      Animated.spring(clearButtonScale, {
        toValue: localValue.length > 0 && showClearButton ? 1 : 0,
        friction: 10,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }, [localValue, showClearButton, clearButtonScale]);

    // Handle text change with debounce
    const handleChangeText = React.useCallback(
      (text: string) => {
        setLocalValue(text);
        onChangeText?.(text);

        // Clear existing timer
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }

        // Set new timer for search callback
        if (onSearch) {
          debounceTimer.current = setTimeout(() => {
            onSearch(text);
          }, debounceMs);
        }
      },
      [onChangeText, onSearch, debounceMs],
    );

    // Handle clear button press
    const handleClear = React.useCallback(() => {
      setLocalValue("");
      onChangeText?.("");
      onSearch?.("");
      // Keep focus on input after clearing
      (ref as React.MutableRefObject<TextInput>)?.current?.focus();
    }, [onChangeText, onSearch, ref]);

    // Handle submit
    const handleSubmitEditing = React.useCallback(() => {
      onSubmitEditing?.();
      // Dismiss keyboard on submit
      Keyboard.dismiss();
    }, [onSubmitEditing]);

    // Clean up timer on unmount
    React.useEffect(() => {
      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      };
    }, []);

    // Animated styles
    const animatedBorderColor = borderColorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.border, colors.ring],
    });

    const containerStyles: ViewStyle = {
      width: "100%",
      ...style,
    };

    const searchBarStyles: ViewStyle = {
      flexDirection: "row",
      alignItems: "center",
      height: 48,
      paddingHorizontal: 12,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      backgroundColor: colors.input,
      ...(editable === false && {
        opacity: 0.5,
        backgroundColor: isDark ? colors.muted : colors.background,
      }),
    };

    const textInputStyles: TextStyle = {
      flex: 1,
      fontSize: fontSize.base,
      color: colors.foreground,
      paddingHorizontal: 8,
      paddingVertical: 0,
      // Platform specific adjustments
      ...(Platform.OS === "android" && {
        paddingVertical: 8,
      }),
      ...inputStyle,
    };

    const iconButtonStyles: ViewStyle = {
      padding: 4,
      borderRadius: borderRadius.sm,
    };

    return (
      <View style={containerStyles} testID={testID}>
        <Animated.View style={StyleSheet.flatten([searchBarStyles, { borderColor: animatedBorderColor }])}>
          {/* Search Icon */}
          <Icon name="search" size={20} color={isFocused ? colors.primary : colors.mutedForeground} />

            {/* Text Input */}
            <TextInput
              ref={ref}
              style={textInputStyles}
              value={localValue}
              onChangeText={handleChangeText}
              placeholder={placeholder}
              placeholderTextColor={colors.mutedForeground}
              editable={editable}
              autoFocus={autoFocus}
              returnKeyType={returnKeyType}
              onSubmitEditing={handleSubmitEditing}
              onFocus={(_e) => {
                setIsFocused(true);
                onFocus?.();
              }}
              onBlur={(_e) => {
                setIsFocused(false);
                onBlur?.();
              }}
              autoCapitalize="none"
              autoCorrect={false}
              underlineColorAndroid="transparent"
              selectionColor={colors.primary}
              keyboardAppearance={isDark ? "dark" : "light"}
              {...(Platform.OS === "ios" && {
                clearButtonMode: "never", // We use our custom clear button
              })}
            />

            {/* Loading Indicator / Clear Button */}
            <View style={{ width: 28, height: 28, justifyContent: "center", alignItems: "center" }}>
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} testID={`${testID}-loading`} />
              ) : (
                <Animated.View
                  style={{
                    transform: [{ scale: clearButtonScale }],
                    opacity: clearButtonScale,
                  }}
                >
                  <Pressable
                    onPress={handleClear}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={({ pressed }) => [iconButtonStyles, pressed && { backgroundColor: colors.accent }]}
                    testID={`${testID}-clear`}
                  >
                    <Icon name="x" size={16} color={colors.mutedForeground} />
                  </Pressable>
                </Animated.View>
              )}
            </View>
        </Animated.View>
      </View>
    );
  },
);

SearchBar.displayName = "SearchBar";

export { SearchBar };

