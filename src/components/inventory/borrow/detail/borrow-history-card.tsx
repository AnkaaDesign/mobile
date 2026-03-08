
import { DetailCard } from "@/components/ui/detail-page-layout";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import type { Borrow } from "@/types";

interface BorrowHistoryCardProps {
  borrow: Borrow & {
    item?: { name: string };
    user?: { name: string };
  };
  maxHeight?: number;
}

export function BorrowHistoryCard({ borrow, maxHeight = 500 }: BorrowHistoryCardProps) {
  return (
    <DetailCard title="Histórico do Empréstimo" icon="history">
      <ChangelogTimeline
        entityType={CHANGE_LOG_ENTITY_TYPE.BORROW}
        entityId={borrow.id}
        entityName={`Empréstimo #${borrow.id.slice(0, 8)}`}
        entityCreatedAt={borrow.createdAt}
        maxHeight={maxHeight}
        limit={50}
      />
    </DetailCard>
  );
}
