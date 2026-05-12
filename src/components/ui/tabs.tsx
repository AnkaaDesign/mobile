import * as React from "react";
import { View, Pressable, Text, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "@/lib/theme";

// Tabs Context
interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue>({
  value: "",
  onValueChange: () => {},
});

// Tabs Root
interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, defaultValue, children, style, className }) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");

  const currentValue = value !== undefined ? value : internalValue;
  const currentOnValueChange = onValueChange || setInternalValue;

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: currentOnValueChange }}>
      <View style={style} className={className}>{children}</View>
    </TabsContext.Provider>
  );
};

// Tabs List
interface TabsListProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
  /** When true, the list is horizontally scrollable. Useful when there are
   *  many tabs that don't fit on a phone viewport. */
  scrollable?: boolean;
}

export const TabsList = React.forwardRef<View, TabsListProps>(({ children, style, className }, ref) => {
  const { colors, isDark } = useTheme();
  const listStyles: ViewStyle = {
    flexDirection: "row",
    minHeight: 42,
    alignItems: "stretch",
    borderRadius: 10,
    backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
    borderWidth: 1,
    borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
    padding: 4,
    gap: 4,
    ...style,
  };

  return (
    <View ref={ref} style={listStyles} className={className}>
      {children}
    </View>
  );
});

TabsList.displayName = "TabsList";

// Tabs Trigger
interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  className?: string;
}

export const TabsTrigger = React.forwardRef<View, TabsTriggerProps>(({ value, children, disabled = false, style, className }, ref) => {
  const { colors, isDark } = useTheme();
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext);
  const isSelected = selectedValue === value;

  const outerStyle: ViewStyle = {
    flex: 1,
    minWidth: 84,
    ...style,
  };

  const innerStyle = ({ pressed }: { pressed: boolean }): ViewStyle => ({
    flex: 1,
    minHeight: 34,
    borderRadius: 7,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isSelected
      ? colors.card
      : pressed
        ? isDark
          ? "rgba(255,255,255,0.06)"
          : "rgba(0,0,0,0.04)"
        : "transparent",
    ...(isSelected && {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 3,
      elevation: 3,
    }),
    ...(disabled && {
      opacity: 0.5,
    }),
  });

  const textStyles: TextStyle = {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: isSelected ? "700" : "600",
    color: isSelected ? colors.primary : colors.mutedForeground,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
    ...(disabled && {
      color: colors.mutedForeground,
    }),
  };

  return (
    <View style={outerStyle}>
      <Pressable
        ref={ref}
        style={innerStyle}
        className={className}
        onPress={disabled ? undefined : () => onValueChange(value)}
        disabled={disabled}
      >
        {typeof children === "string" ? (
          <Text style={textStyles} numberOfLines={1}>{children}</Text>
        ) : (
          children
        )}
      </Pressable>
    </View>
  );
});

TabsTrigger.displayName = "TabsTrigger";

// Tabs Content
interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

export const TabsContent = React.forwardRef<View, TabsContentProps>(({ value, children, style, className }, ref) => {
  const { value: selectedValue } = React.useContext(TabsContext);

  if (selectedValue !== value) {
    return null;
  }

  const contentStyles: ViewStyle = {
    marginTop: 12,
    gap: 12,
    ...style,
  };

  return (
    <View ref={ref} style={contentStyles} className={className}>
      {children}
    </View>
  );
});

TabsContent.displayName = "TabsContent";
