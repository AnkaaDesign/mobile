/**
 * Paint Mix Presets — replicate of `web/src/constants/paint-mix-presets.ts`.
 *
 * Mobile keeps its own copy per the repo convention (schemas/types/utilities
 * are duplicated across packages, not imported from web/).
 *
 * Each preset maps a paint-type name keyword (case-insensitive `includes`)
 * to a list of mix slots. The default preset is used when no keyword matches.
 */

export interface MixSlot {
  /** Stable id used as React key + form field key. */
  id: string;
  /** Brazilian Portuguese label shown to the user. */
  label: string;
  /** Default parts (e.g. 3 for varnish in a 3:1:1 polyester mix). */
  defaultRatio: number;
  /**
   * Lowercase substrings used to rank items inside the slot's combobox.
   * Items whose name contains any keyword bubble to the top.
   */
  itemNameKeywords: string[];
}

export interface MixPreset {
  /** Lowercase substrings matched against the paint-type name. */
  matchKeywords: string[];
  slots: MixSlot[];
}

export const PAINT_MIX_PRESETS: MixPreset[] = [
  // Polyester: 3 varnish / 1 catalyst / 1 thinner
  {
    matchKeywords: ["poliéster", "poliester", "polyester"],
    slots: [
      { id: "varnish", label: "Verniz", defaultRatio: 3, itemNameKeywords: ["verniz"] },
      { id: "catalyst", label: "Catalisador", defaultRatio: 1, itemNameKeywords: ["catalisador", "endurecedor"] },
      { id: "thinner", label: "Diluente", defaultRatio: 1, itemNameKeywords: ["diluente", "thinner", "redutor"] },
    ],
  },
  // Acrylic: 3 paint / 1 catalyst / 1 thinner
  {
    matchKeywords: ["acrílica", "acrilica", "acrylic"],
    slots: [
      { id: "paint", label: "Tinta Acrílica", defaultRatio: 3, itemNameKeywords: ["acrílica", "acrilica"] },
      { id: "catalyst", label: "Catalisador", defaultRatio: 1, itemNameKeywords: ["catalisador", "endurecedor"] },
      { id: "thinner", label: "Diluente", defaultRatio: 1, itemNameKeywords: ["diluente", "thinner", "redutor"] },
    ],
  },
  // Lacquer
  {
    matchKeywords: ["laca", "lacquer"],
    slots: [
      { id: "paint", label: "Laca", defaultRatio: 3, itemNameKeywords: ["laca", "lacquer"] },
      { id: "catalyst", label: "Catalisador", defaultRatio: 1, itemNameKeywords: ["catalisador", "endurecedor"] },
      { id: "thinner", label: "Diluente", defaultRatio: 1, itemNameKeywords: ["diluente", "thinner", "redutor"] },
    ],
  },
  // Polyurethane: 4/1/1
  {
    matchKeywords: ["poliuretano", "polyurethane", "pu"],
    slots: [
      { id: "paint", label: "Tinta PU", defaultRatio: 4, itemNameKeywords: ["poliuretano", "pu"] },
      { id: "catalyst", label: "Catalisador", defaultRatio: 1, itemNameKeywords: ["catalisador", "endurecedor"] },
      { id: "thinner", label: "Diluente", defaultRatio: 1, itemNameKeywords: ["diluente", "thinner", "redutor"] },
    ],
  },
  // Epoxy: 4/1/1
  {
    matchKeywords: ["epóxi", "epoxi", "epoxy"],
    slots: [
      { id: "paint", label: "Tinta Epóxi", defaultRatio: 4, itemNameKeywords: ["epóxi", "epoxi", "epoxy"] },
      { id: "catalyst", label: "Catalisador", defaultRatio: 1, itemNameKeywords: ["catalisador", "endurecedor"] },
      { id: "thinner", label: "Diluente", defaultRatio: 1, itemNameKeywords: ["diluente", "thinner", "redutor"] },
    ],
  },
];

export const DEFAULT_PRESET: MixPreset = {
  matchKeywords: [],
  slots: [
    { id: "base", label: "Base", defaultRatio: 3, itemNameKeywords: [] },
    { id: "catalyst", label: "Catalisador", defaultRatio: 1, itemNameKeywords: ["catalisador", "endurecedor"] },
    { id: "thinner", label: "Diluente", defaultRatio: 1, itemNameKeywords: ["diluente", "thinner", "redutor"] },
  ],
};

export function findPresetForPaintType(name: string | null | undefined): MixPreset {
  if (!name) return DEFAULT_PRESET;
  const lower = name.toLowerCase();
  return (
    PAINT_MIX_PRESETS.find((p) => p.matchKeywords.some((k) => lower.includes(k))) ??
    DEFAULT_PRESET
  );
}
