import type { ViewStyle } from "react-native";
import type { PpeDelivery, User } from '..';
import type { UseFormReturn } from "react-hook-form";
import type { PpeDeliveryCreateFormData } from '@/schemas';

// My PPE List Props
export interface MyPpeListProps {
  deliveries: PpeDelivery[];
  onDeliveryPress?: (delivery: PpeDelivery) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: ViewStyle;
}

// PPE Delivery Form Props
export interface PpeDeliveryFormProps {
  form: UseFormReturn<PpeDeliveryCreateFormData>;
  users: User[];
  onSubmit: (data: PpeDeliveryCreateFormData) => void;
  isSubmitting?: boolean;
}
