
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { PPE_TYPE_LABELS, PPE_DELIVERY_MODE_LABELS } from "@/constants";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import type { Item } from '../../../../types';

interface PpeCardProps {
  item: Item;
}

export function PpeCard({ item }: PpeCardProps) {
  const { colors } = useTheme();

  if (!item.ppeType) {
    return null;
  }

  return (
    <DetailCard title="Informações do EPI" icon="shield">
      <DetailField
        label="Tipo de EPI"
        icon="shield"
        value={
          <Badge variant="default">
            <ThemedText style={{ color: colors.primaryForeground }}>
              {PPE_TYPE_LABELS[item.ppeType as keyof typeof PPE_TYPE_LABELS]}
            </ThemedText>
          </Badge>
        }
      />

      {item.ppeDeliveryMode && (
        <DetailField
          label="Modo de Entrega"
          icon="truck"
          value={
            <Badge variant="secondary">
              <ThemedText style={{ color: colors.secondaryForeground }}>
                {PPE_DELIVERY_MODE_LABELS[item.ppeDeliveryMode as keyof typeof PPE_DELIVERY_MODE_LABELS]}
              </ThemedText>
            </Badge>
          }
        />
      )}

      {item.ppeCA && (
        <DetailField
          label="CA (Certificado de Aprovação)"
          icon="certificate"
          value={item.ppeCA}
        />
      )}

      {item.ppeStandardQuantity && (
        <DetailField
          label="Quantidade Padrão"
          icon="hash"
          value={`${item.ppeStandardQuantity} unidade${item.ppeStandardQuantity > 1 ? "s" : ""}`}
        />
      )}
    </DetailCard>
  );
}
