import type { TextProps, TextStyle, ViewStyle, TextInputProps } from "react-native";
import type React from "react";
import type { Icon } from "@tabler/icons-react-native";

// Button Component Props
export interface ButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
  style?: ViewStyle;
}

// Input Component Props
export interface InputProps extends Omit<TextInputProps, "style"> {
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  error?: boolean;
  withIcon?: boolean;
}

// Textarea Component Props
export interface TextareaProps extends Omit<TextInputProps, "style" | "multiline"> {
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  error?: boolean;
  numberOfLines?: number;
}

// Label Component Props
export interface LabelProps extends Omit<TextProps, "style"> {
  children?: React.ReactNode;
  style?: TextStyle;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
}

// Checkbox Component Props
export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

// Switch Component Props
export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

// Radio Group Props
export interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export interface RadioGroupItemProps {
  value: string;
  disabled?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}

// Badge Component Props
export interface BadgeProps {
  variant?: "default" | "secondary" | "destructive" | "outline";
  children?: React.ReactNode;
  style?: ViewStyle;
}

// Separator Component Props
export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
  style?: ViewStyle;
}

// Progress Component Props
export interface ProgressProps {
  value?: number;
  max?: number;
  style?: ViewStyle;
  trackStyle?: ViewStyle;
  indicatorStyle?: ViewStyle;
}

// Avatar Component Props
export interface AvatarProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export interface AvatarImageProps {
  source?: { uri: string } | number;
  style?: ViewStyle;
}

export interface AvatarFallbackProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

// Alert Component Props
export interface AlertProps {
  variant?: "default" | "destructive";
  children?: React.ReactNode;
  style?: ViewStyle;
}

// Skeleton Component Props
export interface SkeletonProps {
  style?: ViewStyle;
  duration?: number;
}

// Search Bar Props
export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

// Swipe Actions Props
export interface SwipeActionsProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  enabled?: boolean;
  deleteLabel?: string;
  editLabel?: string;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
}

// Dashboard Card Props
export interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: Icon;
  change?: number;
  changeLabel?: string;
  onPress?: () => void;
  style?: ViewStyle;
  loading?: boolean;
}

export interface QuickActionCardProps {
  title: string;
  icon: Icon;
  onPress: () => void;
  style?: ViewStyle;
  badge?: string | number;
}

// Themed View Props
export interface ThemedViewProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "card" | "transparent";
}

// Themed Safe Area View Props
export interface ThemedSafeAreaViewProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  edges?: ("top" | "right" | "bottom" | "left")[];
}

// Themed Status Bar Props
export interface ThemedStatusBarProps {
  style?: "light" | "dark" | "auto";
}

// Header Component Props
export interface HeaderProps {
  title?: string;
  subtitle?: string;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  centerComponent?: React.ReactNode;
  transparent?: boolean;
  style?: ViewStyle;
}

// Haptic Button Props
export interface HapticButtonProps extends ButtonProps {
  hapticType?: "impact" | "selection" | "notification";
  hapticIntensity?: "light" | "medium" | "heavy";
}

// Haptic Switch Props
export interface HapticSwitchProps extends SwitchProps {
  hapticEnabled?: boolean;
}

// Complex UI Components

// Tabs Component Props
export interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  activationMode?: "automatic" | "manual";
  children?: React.ReactNode;
  style?: ViewStyle;
}

export interface TabsListProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export interface TabsTriggerProps {
  value: string;
  disabled?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export interface TabsContentProps {
  value: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

// Dialog Component Props
export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export interface DialogTriggerProps {
  children?: React.ReactNode;
  asChild?: boolean;
}

export interface DialogCloseProps {
  children?: React.ReactNode;
  asChild?: boolean;
}

export interface DialogContentProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
}

// Table Component Props
export interface TableProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export interface TableHeaderProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export interface TableBodyProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export interface TableRowProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export interface TableCellProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  flex?: number;
}

export interface TableHeaderCellProps extends TableCellProps {
  sortable?: boolean;
  sorted?: "asc" | "desc" | false;
  onSort?: () => void;
}

// Card Component Props
export interface CardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

// Pagination Item Props
export interface PaginationItemProps {
  page: number;
  isActive?: boolean;
  onPress?: (page: number) => void;
  style?: ViewStyle;
}

// Icon Component Props
export interface IconProps {
  name: Icon;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

// Logo Component Props
export interface LogoProps {
  size?: number;
  style?: ViewStyle;
}

// FAB Component Props
export interface FABProps {
  onPress: () => void;
  icon?: Icon;
  label?: string;
  visible?: boolean;
  style?: ViewStyle;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

// Empty State Props
export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: Icon;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

// Under Construction Props
export interface UnderConstructionProps {
  title?: string;
  description?: string;
  style?: ViewStyle;
}

// Theme Toggle Props
export interface ThemeToggleProps {
  size?: number;
  style?: ViewStyle;
}

// Theme Provider Props (for UI component)
export interface UIThemeProviderProps {
  children: React.ReactNode;
  value?: {
    theme?: string;
    setTheme?: (theme: string) => void;
    systemTheme?: string;
  };
}

// Avatar Menu Props
export interface AvatarMenuProps {
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
  onSignOut?: () => void;
  style?: ViewStyle;
}

// Items Count Display Props
export interface ItemsCountDisplayProps {
  loadedCount: number;
  totalCount?: number;
  isLoading?: boolean;
  itemType?: string; // singular form: "item", "marca", "categoria"
  itemTypePlural?: string; // plural form: "itens", "marcas", "categorias"
}

// Active Sorts Bar Props
export interface ActiveSortsBarProps {
  sorts: Array<{
    key: string;
    label: string;
    direction: "asc" | "desc";
  }>;
  onRemoveSort: (key: string) => void;
  onClearAll: () => void;
  style?: ViewStyle;
}

// Optimized Touchable Props
export interface OptimizedTouchableProps {
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle;
  activeOpacity?: number;
  haptic?: boolean;
}

// Loading Components Props
export interface LoadingScreenProps {
  message?: string;
  style?: ViewStyle;
}

export interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  style?: ViewStyle;
}

export interface LoadingOverlayProps {
  visible?: boolean;
  message?: string;
  style?: ViewStyle;
}

export interface SkeletonTextProps {
  lines?: number;
  width?: string | number;
  height?: number;
  style?: ViewStyle;
}

export interface SkeletonCardProps {
  height?: number;
  style?: ViewStyle;
}

export interface SkeletonAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export interface PulseViewProps {
  children?: React.ReactNode;
  duration?: number;
  style?: ViewStyle;
}

// Error Components Props
export interface ErrorScreenProps {
  error?: any;
  title?: string;
  message?: string;
  detail?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export interface TableErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Generic Props for error boundaries
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}
