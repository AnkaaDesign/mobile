import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "./text";
import { Icon } from "./icon";
import { cn } from "@/lib/cn";

interface FormHeaderProps {
  title: string;
  subtitle?: string;
  onCancel?: () => void;
  onSave?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isSaving?: boolean;
  canSave?: boolean;
  showActions?: boolean;
  className?: string;
}

export function FormHeader({
  title,
  subtitle,
  onCancel,
  onSave,
  saveLabel = "Salvar",
  cancelLabel = "Cancelar",
  isSaving = false,
  canSave = true,
  showActions = true,
  className,
}: FormHeaderProps) {
  const router = useRouter();

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <View className={cn("bg-card border-b border-border", className)}>
      <View className="px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">
              {title}
            </Text>
            {subtitle && (
              <Text className="text-sm text-muted-foreground mt-0.5">
                {subtitle}
              </Text>
            )}
          </View>

          {showActions && (
            <View className="flex-row items-center space-x-3">
              <TouchableOpacity
                onPress={handleCancel}
                disabled={isSaving}
                className={cn(
                  "px-4 py-2 rounded-lg",
                  isSaving && "opacity-50"
                )}
                activeOpacity={0.7}
              >
                <Text className="text-sm font-medium text-muted-foreground">
                  {cancelLabel}
                </Text>
              </TouchableOpacity>

              {onSave && (
                <TouchableOpacity
                  onPress={onSave}
                  disabled={!canSave || isSaving}
                  className={cn(
                    "px-4 py-2 rounded-lg bg-primary",
                    (!canSave || isSaving) && "opacity-50"
                  )}
                  activeOpacity={0.7}
                >
                  <Text className="text-sm font-medium text-primary-foreground">
                    {isSaving ? "Salvando..." : saveLabel}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// Alternative style with larger header
export function FormHeaderLarge({
  title,
  subtitle,
  description,
  icon,
  onBack,
  actions,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ComponentProps<typeof Icon>["name"];
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View className={cn("bg-card border-b border-border", className)}>
      {/* Top bar */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={handleBack}
          className="p-1"
          activeOpacity={0.7}
        >
          <Icon name="IconArrowLeft" size={24} color="#6B7280" />
        </TouchableOpacity>

        {actions && (
          <View className="flex-row items-center">
            {actions}
          </View>
        )}
      </View>

      {/* Header content */}
      <View className="px-4 pb-4">
        <View className="flex-row items-start">
          {icon && (
            <View className="w-12 h-12 rounded-lg bg-primary/10 items-center justify-center mr-3">
              <Icon name={icon} size={24} color="#3B82F6" />
            </View>
          )}
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
        </View>
        {children}
      </View>
    </View>
  );
}

// Step indicator for multi-step forms
export function FormStepHeader({
  currentStep,
  totalSteps,
  stepTitle,
  stepSubtitle,
  onBack,
  onNext,
  onCancel,
  canGoNext = true,
  isLastStep = false,
  className,
}: {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  stepSubtitle?: string;
  onBack?: () => void;
  onNext?: () => void;
  onCancel?: () => void;
  canGoNext?: boolean;
  isLastStep?: boolean;
  className?: string;
}) {
  const router = useRouter();

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <View className={cn("bg-card border-b border-border", className)}>
      {/* Progress bar */}
      <View className="px-4 pt-3">
        <View className="flex-row items-center space-x-2 mb-3">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              className={cn(
                "flex-1 h-1 rounded-full",
                index < currentStep
                  ? "bg-primary"
                  : "bg-muted"
              )}
            />
          ))}
        </View>
      </View>

      {/* Header content */}
      <View className="px-4 pb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Etapa {currentStep} de {totalSteps}
            </Text>
            <Text className="text-lg font-semibold text-foreground">
              {stepTitle}
            </Text>
            {stepSubtitle && (
              <Text className="text-sm text-muted-foreground mt-0.5">
                {stepSubtitle}
              </Text>
            )}
          </View>

          <View className="flex-row items-center space-x-2">
            {currentStep > 1 && onBack && (
              <TouchableOpacity
                onPress={onBack}
                className="p-2 rounded-lg"
                activeOpacity={0.7}
              >
                <Icon name="IconChevronLeft" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleCancel}
              className="px-3 py-2 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-sm font-medium text-muted-foreground">
                Cancelar
              </Text>
            </TouchableOpacity>

            {onNext && (
              <TouchableOpacity
                onPress={onNext}
                disabled={!canGoNext}
                className={cn(
                  "px-4 py-2 rounded-lg bg-primary flex-row items-center",
                  !canGoNext && "opacity-50"
                )}
                activeOpacity={0.7}
              >
                <Text className="text-sm font-medium text-primary-foreground">
                  {isLastStep ? "Concluir" : "Próximo"}
                </Text>
                {!isLastStep && (
                  <Icon
                    name="IconChevronRight"
                    size={16}
                    color="#FFFFFF"
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}