import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "./text";
import { Icon } from "./icon";
import { Badge } from "./badge";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme";

interface DetailHeaderProps {
  title: string;
  subtitle?: string;
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
  };
  actions?: Array<{
    icon: React.ComponentProps<typeof Icon>["name"];
    onPress: () => void;
    disabled?: boolean;
  }>;
  onBack?: () => void;
  className?: string;
  showBackButton?: boolean;
}

export function DetailHeader({
  title,
  subtitle,
  badge,
  actions = [],
  onBack,
  className,
  showBackButton = true,
}: DetailHeaderProps) {
  const router = useRouter();
  const { colors } = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View className={cn("bg-card border-b border-border", className)}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-1 flex-row items-center">
          {showBackButton && (
            <TouchableOpacity
              onPress={handleBack}
              className="mr-3 p-1"
              activeOpacity={0.7}
            >
              <Icon name="arrowLeft" size={20} color={colors.foreground} />
            </TouchableOpacity>
          )}

          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>
                {title}
              </Text>
              {badge && (
                <Badge
                  variant={badge.variant}
                  className="ml-2"
                  size="sm"
                >
                  {badge.label}
                </Badge>
              )}
            </View>
            {subtitle && (
              <Text className="text-sm text-muted-foreground mt-0.5" numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {actions.length > 0 && (
          <View className="flex-row items-center space-x-2">
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={action.onPress}
                disabled={action.disabled}
                className={cn(
                  "p-2 rounded-lg",
                  action.disabled && "opacity-50"
                )}
                activeOpacity={0.7}
              >
                <Icon
                  name={action.icon}
                  size={20}
                  color={action.disabled ? colors.mutedForeground : colors.foreground}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// Alternative style with larger title area
export function DetailHeaderLarge({
  title,
  subtitle,
  description,
  badge,
  actions = [],
  onBack,
  className,
  showBackButton = true,
  children,
}: DetailHeaderProps & {
  description?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const { colors } = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View className={cn("bg-card border-b border-border", className)}>
      {/* Top bar with back button and actions */}
      <View className="flex-row items-center justify-between px-4 py-3">
        {showBackButton && (
          <TouchableOpacity
            onPress={handleBack}
            className="p-1"
            activeOpacity={0.7}
          >
            <Icon name="arrowLeft" size={24} color={colors.foreground} />
          </TouchableOpacity>
        )}

        <View className="flex-1" />

        {actions.length > 0 && (
          <View className="flex-row items-center space-x-2">
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={action.onPress}
                disabled={action.disabled}
                className={cn(
                  "p-2 rounded-lg",
                  action.disabled && "opacity-50"
                )}
                activeOpacity={0.7}
              >
                <Icon
                  name={action.icon}
                  size={20}
                  color={action.disabled ? colors.mutedForeground : colors.foreground}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Title area */}
      <View className="px-4 pb-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">
              {title}
            </Text>
            {subtitle && (
              <Text className="text-base text-muted-foreground mt-1">
                {subtitle}
              </Text>
            )}
            {description && (
              <Text className="text-sm text-muted-foreground mt-2">
                {description}
              </Text>
            )}
          </View>
          {badge && (
            <Badge
              variant={badge.variant}
              className="ml-3"
            >
              {badge.label}
            </Badge>
          )}
        </View>
        {children}
      </View>
    </View>
  );
}