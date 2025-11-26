import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Text } from "./text";
import { Icon } from "./icon";
import { Separator } from "./separator";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme";
import { formSpacing, formTypography, formLayout } from "@/constants/form-styles";

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

// Variant for form field grouping with standardized styling
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
  const { colors } = useTheme();

  return (
    <View style={fieldGroupStyles.container} className={className}>
      {label && (
        <View style={fieldGroupStyles.labelRow}>
          <Text
            style={[
              fieldGroupStyles.label,
              { color: error ? colors.destructive : colors.foreground },
            ]}
          >
            {label}
          </Text>
          {required && (
            <Text style={[fieldGroupStyles.required, { color: colors.destructive }]}>
              {" *"}
            </Text>
          )}
        </View>
      )}
      {helper && !error && (
        <Text style={[fieldGroupStyles.helper, { color: colors.mutedForeground }]}>
          {helper}
        </Text>
      )}
      {children}
      {error && (
        <Text style={[fieldGroupStyles.error, { color: colors.destructive }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const fieldGroupStyles = StyleSheet.create({
  container: {
    marginBottom: formSpacing.fieldGap, // 16px
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: formSpacing.labelInputGap, // 4px
  },
  label: {
    fontSize: formTypography.label.fontSize, // 14px
    fontWeight: formTypography.label.fontWeight as any, // 500
  },
  required: {
    fontSize: formTypography.label.fontSize,
    fontWeight: formTypography.label.fontWeight as any,
  },
  helper: {
    fontSize: formTypography.helper.fontSize, // 12px
    marginBottom: formSpacing.helperGap, // 4px
  },
  error: {
    fontSize: formTypography.error.fontSize, // 12px
    fontWeight: formTypography.error.fontWeight as any, // 500
    marginTop: formSpacing.errorGap, // 4px
  },
});

// Card-style form section with standardized styling
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
  const { colors } = useTheme();

  return (
    <View
      style={[
        cardStyles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      className={className}
    >
      {(title || subtitle || action) && (
        <View
          style={[
            cardStyles.header,
            { borderBottomColor: colors.border },
          ]}
        >
          <View style={cardStyles.headerContent}>
            <View style={cardStyles.headerText}>
              {title && (
                <Text
                  style={[
                    cardStyles.title,
                    { color: colors.foreground },
                  ]}
                >
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text
                  style={[
                    cardStyles.subtitle,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {subtitle}
                </Text>
              )}
            </View>
            {action && (
              <TouchableOpacity
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "500" }}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      <View style={cardStyles.content} className={contentClassName}>
        {children}
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    borderRadius: formLayout.cardBorderRadius, // 12px
    borderWidth: formLayout.borderWidth, // 1px
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: formSpacing.cardPadding, // 16px
    paddingVertical: formSpacing.cardHeaderContentGap + 4, // 12px
    borderBottomWidth: formLayout.borderWidth,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: formTypography.cardTitle.fontSize, // 16px
    fontWeight: formTypography.cardTitle.fontWeight as any, // 600
  },
  subtitle: {
    fontSize: formTypography.cardSubtitle.fontSize, // 14px
    fontWeight: formTypography.cardSubtitle.fontWeight as any, // 400
    marginTop: 2,
  },
  content: {
    padding: formSpacing.cardPadding, // 16px
    gap: formSpacing.fieldGap, // 16px - gap between form fields
  },
});

// Row layout for form fields with standardized spacing
export function FormRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View style={rowStyles.container} className={className}>
      {React.Children.map(children, (child, index) => (
        <View style={rowStyles.item} key={index}>
          {child}
        </View>
      ))}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: formSpacing.rowGap, // 8px - consistent gap between columns
  },
  item: {
    flex: 1,
  },
});

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