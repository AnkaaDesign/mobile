import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ backgroundColor: colors.card, borderColor: colors.border }} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle style={{ color: colors.foreground }}>Finalizar Afastamento</DialogTitle>
          <DialogDescription style={{ color: colors.mutedForeground }}>
            {`Informe a data de retorno efetiva${leave?.user?.name ? ` do colaborador "${leave.user.name}"` : ""}. O afastamento será marcado como concluído.`}
          </DialogDescription>
        </DialogHeader>

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

        <DialogFooter>
          <Button variant="outline" onPress={() => onOpenChange(false)} disabled={finishLeave.isPending}>
            Cancelar
          </Button>
          <Button onPress={handleConfirm} disabled={!actualEndDate || finishLeave.isPending} loading={finishLeave.isPending}>
            Finalizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
