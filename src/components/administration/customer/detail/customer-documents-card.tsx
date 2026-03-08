
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { fontSize } from "@/constants/design-system";
import type { Customer } from '../../../../types';
import { formatCNPJ, formatCPF } from "@/utils";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";

interface CustomerDocumentsCardProps {
  customer: Customer;
}

export function CustomerDocumentsCard({ customer }: CustomerDocumentsCardProps) {
  const { colors } = useTheme();

  // Check if customer has any documents
  const hasDocs = customer.cnpj || customer.cpf;

  if (!hasDocs) {
    return (
      <DetailCard title="Documentos" icon="file-text">
        <ThemedText style={{ fontSize: fontSize.sm, textAlign: "center", color: colors.mutedForeground }}>
          Nenhum documento configurado
        </ThemedText>
      </DetailCard>
    );
  }

  return (
    <DetailCard title="Documentos" icon="file-text">
      {customer.cnpj && (
        <DetailField label="CNPJ" icon="building" value={formatCNPJ(customer.cnpj)} monospace />
      )}

      {customer.cpf && (
        <DetailField label="CPF" icon="id" value={formatCPF(customer.cpf)} monospace />
      )}
    </DetailCard>
  );
}
