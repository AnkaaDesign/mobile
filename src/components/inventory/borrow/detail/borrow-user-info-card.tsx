import React from "react";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { fontSize } from "@/constants/design-system";
import type { Borrow } from '../../../../types';

interface BorrowUserInfoCardProps {
  borrow: Borrow & {
    user?: {
      name: string;
      position?: {
        name: string;
      };
      sector?: {
        name: string;
      };
    };
  };
}

export const BorrowUserInfoCard: React.FC<BorrowUserInfoCardProps> = ({ borrow }) => {
  const { colors } = useTheme();

  if (!borrow.user) {
    return (
      <DetailCard title="Informações do Usuário" icon="user">
        <ThemedText style={{ fontSize: fontSize.sm, fontStyle: "italic", color: colors.mutedForeground }}>
          Usuário não encontrado
        </ThemedText>
      </DetailCard>
    );
  }

  const { user } = borrow;

  return (
    <DetailCard title="Informações do Usuário" icon="user">
      {/* User Name */}
      <DetailField label="Nome" value={user.name} icon="user" />

      {/* Position */}
      <DetailField label="Cargo" value={user.position ? user.position.name : "-"} icon="briefcase" />

      {/* Sector */}
      <DetailField label="Setor" value={user.sector ? user.sector.name : "-"} icon="building" />
    </DetailCard>
  );
};
