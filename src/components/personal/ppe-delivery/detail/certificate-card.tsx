import React from "react";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import type { Item } from "@/types";

interface CertificateCardProps {
  item?: Item;
}

export function CertificateCard({ item }: CertificateCardProps) {
  if (!item?.ppeCA) {
    return null;
  }

  return (
    <DetailCard title="Certificado de Aprovação (CA)" icon="certificate">
      <DetailField
        label="Número do CA"
        icon="certificate"
        value={item.ppeCA}
      />
    </DetailCard>
  );
}
