import React from "react";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { fontSize } from "@/constants/design-system";
import type { Borrow } from '../../../../types';

interface BorrowItemInfoCardProps {
  borrow: Borrow & {
    item?: {
      name: string;
      uniCode: string | null;
      brand?: {
        name: string;
      };
      category?: {
        name: string;
      };
      supplier?: {
        fantasyName?: string;
        corporateName?: string;
        name?: string;
      };
    };
  };
}

export const BorrowItemInfoCard: React.FC<BorrowItemInfoCardProps> = ({ borrow }) => {
  const { colors } = useTheme();

  if (!borrow.item) {
    return (
      <DetailCard title="Informações do Item" icon="package">
        <ThemedText style={{ fontSize: fontSize.sm, fontStyle: "italic", color: colors.mutedForeground }}>
          Item não encontrado
        </ThemedText>
      </DetailCard>
    );
  }

  const { item } = borrow;

  return (
    <DetailCard title="Informações do Item" icon="package">
      {/* Item Name */}
      <DetailField label="Nome" value={item.name} icon="package" />

      {/* UniCode */}
      {item.uniCode && (
        <DetailField label="Código" value={item.uniCode} icon="barcode" monospace />
      )}

      {/* Brand */}
      <DetailField label="Marca" value={item.brand ? item.brand.name : "-"} icon="tag" />

      {/* Category */}
      <DetailField label="Categoria" value={item.category ? item.category.name : "-"} icon="tags" />

      {/* Supplier */}
      {item.supplier && (
        <DetailField
          label="Fornecedor"
          value={item.supplier.fantasyName || item.supplier.corporateName || "-"}
          icon="truck"
        />
      )}
    </DetailCard>
  );
};
