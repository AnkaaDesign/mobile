import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Text } from "./text";
import { Icon } from "./icon";
import { Separator } from "./separator";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme";

interface FormSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: React.ComponentProps<typeof Icon>["name"];
  action?: {
    label: string;
    onPress: () => void;
  };
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  showSeparator?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function FormSection({
  title,
  subtitle,
  description,
  icon,
  action,
  children,
  className,
  contentClassName,
  showSeparator = false,
  collapsible = false,
  defaultCollapsed = false,
}: FormSectionProps) {
  const { colors } = useTheme();
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const handleToggle = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const hasHeader = title || subtitle || icon || action || collapsible;

  return (
    <View className={cn("", className)}>
      {hasHeader && (
        <>
          <TouchableOpacity
            onPress={handleToggle}
            disabled={!collapsible}
            activeOpacity={collapsible ? 0.7 : 1}
            className="px-4 py-3"
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 flex-row items-start">
                {icon && (
                  <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center mr-3">
                    <Icon name={icon} size={18} color={colors.primary} />
                  </View>
                )}
                <View className="flex-1">
                  {title && (
                    <Text className="text-base font-semibold text-foreground">
                      {title}
                    </Text>
                  )}
                  {subtitle && (
                    <Text className="text-sm text-muted-foreground mt-0.5">
                      {subtitle}
                    </Text>
                  )}
                  {description && (
                    <Text className="text-sm text-muted-foreground mt-2">
                      {description}
                    </Text>
                  )}
                </View>
              </View>

              <View className="flex-row items-center">
                {action && !collapsible && (
                  <TouchableOpacity
                    onPress={action.onPress}
                    className="px-3 py-1.5 rounded-lg bg-primary/10"
                    activeOpacity={0.7}
                  >
                    <Text className="text-sm font-medium text-primary">
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                )}
                {collapsible && (
                  <Icon
                    name={isCollapsed ? "IconChevronDown" : "IconChevronUp"}
                    size={20}
                    color={colors.mutedForeground}
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>
          {showSeparator && !isCollapsed && <Separator className="mb-3" />}
        </>
      )}

      {(!collapsible || !isCollapsed) && (
        <View className={cn("px-4", hasHeader && "pb-3", contentClassName)}>
          {children}
        </View>
      )}
    </View>
  );
}

// Variant for form field grouping with less visual prominence
export function FormFieldGroup({
  label,
  helper,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={cn("mb-4", className)}>
      {label && (
        <View className="flex-row items-center mb-1.5">
          <Text className="text-sm font-medium text-foreground">
            {label}
          </Text>
          {required && (
            <Text className="text-sm text-destructive ml-1">*</Text>
          )}
        </View>
      )}
      {helper && !error && (
        <Text className="text-xs text-muted-foreground mb-2">
          {helper}
        </Text>
      )}
      {children}
      {error && (
        <Text className="text-xs text-destructive mt-1.5">
          {error}
        </Text>
      )}
    </View>
  );
}

// Card-style form section
export function FormCard({
  title,
  subtitle,
  children,
  className,
  contentClassName,
  action,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}) {
  return (
    <View className={cn("bg-card rounded-lg border border-border", className)}>
      {(title || subtitle || action) && (
        <View className="px-4 py-3 border-b border-border">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              {title && (
                <Text className="text-base font-semibold text-foreground">
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text className="text-sm text-muted-foreground mt-0.5">
                  {subtitle}
                </Text>
              )}
            </View>
            {action && (
              <TouchableOpacity
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <Text className="text-sm font-medium text-primary">
                  {action.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      <View className={cn("p-4", contentClassName)}>
        {children}
      </View>
    </View>
  );
}

// Row layout for form fields
export function FormRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={cn("flex-row space-x-3", className)}>
      {React.Children.map(children, (child, index) => (
        <View className="flex-1" key={index}>
          {child}
        </View>
      ))}
    </View>
  );
}

// Inline form field (label and value on same row)
export function FormInlineField({
  label,
  value,
  onPress,
  className,
}: {
  label: string;
  value: React.ReactNode;
  onPress?: () => void;
  className?: string;
}) {
  const { colors } = useTheme();
  const content = (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm text-muted-foreground">
        {label}
      </Text>
      <View className="flex-row items-center">
        {typeof value === "string" ? (
          <Text className="text-sm font-medium text-foreground">
            {value}
          </Text>
        ) : (
          value
        )}
        {onPress && (
          <Icon
            name="IconChevronRight"
            size={16}
            color={colors.mutedForeground}
          />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        className={cn("py-3", className)}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View className={cn("py-3", className)}>
      {content}
    </View>
  );
}