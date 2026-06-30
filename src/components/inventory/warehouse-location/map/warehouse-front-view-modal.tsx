import { StandardModal } from "@/components/ui/standard-modal";
import type { WarehouseLocation } from "@/types";
import { WarehouseLocationFrontView } from "./warehouse-location-front-view";

interface Props {
  visible: boolean;
  onClose: () => void;
  location: WarehouseLocation | null;
  highlightItemIds?: Set<string>;
}

/**
 * Structure detail shown on the canonical page-sheet modal (StandardModal — the bonus-modal
 * rules): OS-driven slide/backdrop/swipe-to-dismiss, themed body, safe-area aware. The body
 * (WarehouseLocationFrontView) renders its own identity header (type icon + code + count), so
 * the sheet keeps a generic "Vista Frontal" title to avoid duplicating it. The vertical
 * ScrollView is owned by StandardModal; the front-view body only lays out its shelves (and
 * scrolls horizontally for kanban).
 */
export function WarehouseFrontViewModal({ visible, onClose, location, highlightItemIds }: Props) {
  return (
    <StandardModal visible={visible} onClose={onClose} title="Vista Frontal">
      {location && <WarehouseLocationFrontView location={location} highlightItemIds={highlightItemIds} />}
    </StandardModal>
  );
}
