import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconCopy, IconTrash } from "@tabler/icons-react-native";
import type { ItemBrand } from "../../../../../types";
import { TableRowSwipe, SwipeAction } from "@/components/common/table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { canEditItems, canDeleteItems } from "@/utils/permissions/entity-permissions";
import { useTheme } from "@/lib/theme";

interface CustomSwipeAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  backgroundColor?: string;
  onPress: () => void;
  closeOnPress?: boolean;
}

interface BrandTableRowSwipeProps {
  brand: ItemBrand;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  customActions?: CustomSwipeAction[];
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const BrandTableRowSwipeComponent = ({
  brand,
  onEdit,
  onDelete,
  onDuplicate,
  customActions = [],
  children,
  style,
  disabled = false,
}: BrandTableRowSwipeProps) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const canEdit = canEditItems(user);
  const canDelete = canDeleteItems(user);

  // Build actions array
  const actions: SwipeAction[] = [];

  if (onEdit && canEdit) {
    actions.push({
      key: "edit",
      label: "Editar",
      icon: <IconEdit size={20} color="white" />,
      backgroundColor: colors.primary,
      onPress: onEdit,
      closeOnPress: true,
    });
  }

  // Add custom actions in the middle
  if (customActions && customActions.length > 0) {
    customActions.forEach((action) => {
      actions.push({
        key: action.key,
        label: action.label,
        icon: action.icon,
        backgroundColor: action.backgroundColor || colors.secondary,
        onPress: action.onPress,
        closeOnPress: action.closeOnPress !== false,
      });
    });
  }

  if (onDuplicate && canEdit) {
    actions.push({
      key: "duplicate",
      label: "Duplicar",
      icon: <IconCopy size={20} color="white" />,
      backgroundColor: colors.secondary,
      onPress: onDuplicate,
      closeOnPress: true,
    });
  }

  if (onDelete && canDelete) {
    actions.push({
      key: "delete",
      label: "Excluir",
      icon: <IconTrash size={20} color="white" />,
      backgroundColor: colors.error,
      onPress: onDelete,
      closeOnPress: false,
      confirmDelete: true,
    });
  }

  return (
    <TableRowSwipe
      entityId={brand.id}
      entityName={brand.name}
      actions={actions}
      canPerformActions={(user) => canEditItems(user) || canDeleteItems(user)}
      style={style}
      disabled={disabled}
      confirmDeleteMessage={`Tem certeza que deseja excluir a marca "${brand.name}"?`}
    >
      {children}
    </TableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
BrandTableRowSwipeComponent.displayName = "BrandTableRowSwipe";

export const BrandTableRowSwipe = React.memo(BrandTableRowSwipeComponent);
