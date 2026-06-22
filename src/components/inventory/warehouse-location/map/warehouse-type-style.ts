import {
  IconLayoutGrid,
  IconLayoutColumns,
  IconLayoutKanban,
  IconLayoutDistributeVertical,
  IconStack2,
  type Icon as TablerIcon,
} from "@tabler/icons-react-native";
import { WAREHOUSE_LOCATION_TYPE } from "@/constants";

/**
 * Read-only mobile port of the web warehouse map styling. Colors are kept identical to the
 * web `warehouse-type-style.ts` so the floor plan reads the same on both platforms:
 * estante / kanban / dupla = gray steel, painel = white board, palete = wood.
 */
export interface WarehouseTypeStyle {
  /** Representative accent (front-view chip, legend). */
  color: string;
  /** Translucent fill (front-view header chip). */
  fill: string;
  /** Solid material body fill. */
  body: string;
  /** Body when the structure is selected/highlighted (slightly lighter). */
  bodySel: string;
  /** Material outline. */
  border: string;
  /** Detail color (slats, bins, holes). */
  detail: string;
  /** Tabler (react-native) icon representing the structure type. */
  icon: TablerIcon;
}

export const WAREHOUSE_TYPE_STYLE: Record<WAREHOUSE_LOCATION_TYPE, WarehouseTypeStyle> = {
  [WAREHOUSE_LOCATION_TYPE.ESTANTE]: {
    color: "#9ca3af",
    fill: "rgba(156, 163, 175, 0.2)",
    body: "#5c6573",
    bodySel: "#6d7787",
    border: "#aab2bf",
    detail: "#363d49",
    icon: IconLayoutGrid,
  },
  [WAREHOUSE_LOCATION_TYPE.ESTANTE_DUPLA]: {
    color: "#9ca3af",
    fill: "rgba(156, 163, 175, 0.2)",
    body: "#535c6b",
    bodySel: "#646e7e",
    border: "#aab2bf",
    detail: "#363d49",
    icon: IconLayoutColumns,
  },
  [WAREHOUSE_LOCATION_TYPE.ESTANTE_KANBAN]: {
    color: "#9ca3af",
    fill: "rgba(156, 163, 175, 0.2)",
    body: "#5c6573",
    bodySel: "#6d7787",
    border: "#aab2bf",
    detail: "#1f2530", // near-black kanban bins
    icon: IconLayoutKanban,
  },
  [WAREHOUSE_LOCATION_TYPE.PAINEL]: {
    color: "#e5e7eb",
    fill: "rgba(226, 232, 240, 0.2)",
    body: "#cbd5e1", // white board
    bodySel: "#e2e8f0",
    border: "#94a3b8",
    detail: "#94a3b8", // pegboard holes
    icon: IconLayoutDistributeVertical,
  },
  [WAREHOUSE_LOCATION_TYPE.PALETE]: {
    color: "#d9b683",
    fill: "rgba(217, 182, 131, 0.2)",
    body: "#6f5230",
    bodySel: "#80603a",
    border: "#564023",
    detail: "#ddbd8c", // natural pine deck boards
    icon: IconStack2,
  },
};

export const HIGHLIGHT_COLOR = "#ef4444";

/** Per-level column override (kanban racks may have a different caixa count per shelf). */
export function columnsForLevel(location: { columns: number; columnsPerLevel?: number[] | null }, level: number): number {
  const override = location.columnsPerLevel?.[level - 1];
  return override && override > 0 ? override : location.columns;
}
