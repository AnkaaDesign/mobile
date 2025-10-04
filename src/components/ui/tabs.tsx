import * as React from "react";
import { View, Pressable, Text, ViewStyle, TextStyle } from "react-native";

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
}

export const TabsList = React.forwardRef<View, TabsListProps>(({ children, style, className }, ref) => {
  const listStyles: ViewStyle = {
    flexDirection: "row",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#e5e5e5",
    padding: 4,
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
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext);
  const isSelected = selectedValue === value;

  const triggerStyles: ViewStyle = {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...(isSelected && {
      backgroundColor: "#ffffff",
      // Shadow for selected tab
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    }),
    ...(disabled && {
      opacity: 0.5,
    }),
    ...style,
  };

  const textStyles: TextStyle = {
    fontSize: 14,
    fontWeight: "500",
    color: isSelected ? "#171717" : "#737373",
    ...(disabled && {
      color: "#737373",
    }),
  };

  return (
    <Pressable ref={ref} style={triggerStyles} className={className} onPress={disabled ? undefined : () => onValueChange(value)} disabled={disabled}>
      {typeof children === "string" ? <Text style={textStyles}>{children}</Text> : children}
    </Pressable>
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
    marginTop: 8,
    ...style,
  };

  return (
    <View ref={ref} style={contentStyles} className={className}>
      {children}
    </View>
  );
});

TabsContent.displayName = "TabsContent";
