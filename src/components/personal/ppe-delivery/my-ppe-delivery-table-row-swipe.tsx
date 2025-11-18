import React from "react";
import { SwipeRow } from "@/components/ui/swipe-row";
import { useAuth } from "@/contexts/auth-context";
import { canEditPpeDeliveries, canDeletePpeDeliveries } from "@/utils/permissions/entity-permissions";

interface MyPpeDeliveryTableRowSwipeProps {
  deliveryId: string;
  deliveryName: string;
  onEdit?: (deliveryId: string) => void;
  onDelete?: (deliveryId: string) => void;
  disabled?: boolean;
  children: (isActive: boolean) => React.ReactNode;
}

export function MyPpeDeliveryTableRowSwipe({ deliveryId, deliveryName, onEdit, onDelete, disabled, children }: MyPpeDeliveryTableRowSwipeProps) {
  const { user } = useAuth();
  const canEdit = canEditPpeDeliveries(user);
  const canDelete = canDeletePpeDeliveries(user);

  // Return early if no permissions
  if (!canEdit && !canDelete) {
    return children(false);
  }

  return (
    <SwipeRow
      id={deliveryId}
      entityName={deliveryName}
      onEdit={canEdit && onEdit ? () => onEdit(deliveryId) : undefined}
      onDelete={canDelete && onDelete ? () => onDelete(deliveryId) : undefined}
      deleteConfirmTitle="Excluir entrega"
      deleteConfirmMessage={`Tem certeza que deseja excluir a entrega "${deliveryName}"?`}
      disabled={disabled}
    >
      {children}
    </SwipeRow>
  );
}
