import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { IconCalendarCheck } from "@tabler/icons-react-native";

import { StandardModal } from "@/components/ui/standard-modal";
import { DatePicker } from "@/components/ui/date-picker";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { Leave } from "@/types";
import { useFinishLeave } from "@/hooks/useLeave";

interface FinishLeaveDialogProps {
  leave: Leave | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinished?: () => void;
}

export function FinishLeaveDialog({ leave, open, onOpenChange, onFinished }: FinishLeaveDialogProps) {
  const { colors } = useTheme();
  const [actualEndDate, setActualEndDate] = useState<Date | null>(new Date());
  const finishLeave = useFinishLeave();

  // Reset the date whenever the dialog opens
  useEffect(() => {
    if (open) {
      setActualEndDate(new Date());
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!leave || !actualEndDate) return;
    try {
      await finishLeave.mutateAsync({ id: leave.id, actualEndDate });
      onOpenChange(false);
      onFinished?.();
    } catch {
      // Error toast is handled by the API client interceptor.
    }
  };

  return (
    <StandardModal
      visible={open}
      onClose={() => onOpenChange(false)}
      title="Finalizar Afastamento"
      subtitle={`Informe a data de retorno efetiva${leave?.user?.name ? ` do colaborador "${leave.user.name}"` : ""}. O afastamento será marcado como concluído.`}
      icon={IconCalendarCheck}
      actions={[
        { label: "Cancelar", variant: "outline", onPress: () => onOpenChange(false), disabled: finishLeave.isPending },
        {
          label: "Finalizar",
          onPress: handleConfirm,
          disabled: !actualEndDate || finishLeave.isPending,
          loading: finishLeave.isPending,
        },
      ]}
    >
      <View style={styles.field}>
        <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.foreground }])}>
          Data de Retorno Efetiva *
        </ThemedText>
        <DatePicker
          value={actualEndDate ?? undefined}
          onChange={(date: Date | undefined) => setActualEndDate(date ?? null)}
          placeholder="Selecionar data de retorno..."
          disabled={finishLeave.isPending}
        />
      </View>
    </StandardModal>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
