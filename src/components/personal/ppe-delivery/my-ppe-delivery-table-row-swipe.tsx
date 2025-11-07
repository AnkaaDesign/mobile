import React from "react";
import { SwipeRow } from "@/components/ui/swipe-row";

interface MyPpeDeliveryTableRowSwipeProps {
  deliveryId: string;
  deliveryName: string;
  onEdit?: (deliveryId: string) => void;
  onDelete?: (deliveryId: string) => void;
  disabled?: boolean;
  children: (isActive: boolean) => React.ReactNode;
}

export function MyPpeDeliveryTableRowSwipe({ deliveryId, deliveryName, onEdit, onDelete, disabled, children }: MyPpeDeliveryTableRowSwipeProps) {
  return (
    <SwipeRow
      id={deliveryId}
      entityName={deliveryName}
      onEdit={onEdit ? () => onEdit(deliveryId) : undefined}
      onDelete={onDelete ? () => onDelete(deliveryId) : undefined}
      deleteConfirmTitle="Excluir entrega"
      deleteConfirmMessage={`Tem certeza que deseja excluir a entrega "${deliveryName}"?`}
      disabled={disabled}
    >
      {children}
    </SwipeRow>
  );
}
