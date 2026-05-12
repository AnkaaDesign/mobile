# Mobile Dashboard Widgets — Authoritative Specification

> **Owner:** Agent 1 (this document is the contract for agents 2–16).
> **Goal:** Bring mobile dashboard widgets to feature/visual parity with web,
> while honouring mobile's deliberate divergences (3-slot layout, native
> primitives, touch-first edit UX). Every implementation agent MUST consult
> this file before writing code; if anything is ambiguous, escalate back to
> agent 1 — do not improvise.
>
> All paths are absolute from repo root (`/home/kennedy/Documents/repositories`).

---

## 1. Cardinal Constraints — DO NOT CHANGE

These are the rules that bound the rewrite. Violating any of them silently
breaks data, breaks the type system, or both.

### 1.1 Mobile size model is `{span, rows}` — NOT `{cols, rows}`

* **File:** `mobile/src/dashboard/types.ts`
* `WidgetSpan = 1 | 2 | 3` — slot count in a 3-slot row.
* `WidgetRows = 1 | 2 | 3 | 4` — discrete maxHeight token.
* `WidgetSize = { span, rows }`.
* The schema is at v3 (`DASHBOARD_LAYOUT_VERSION = 3`). v1 was `{cols, rows}`
  and is migrated in `hooks/use-dashboard-layout.ts` via `parseLegacyLayout()`.
* Web uses `{cols: 1|2|3|4, rows: 1|2|3|4}`. **Do not** unify — they're
  serialized to different storage keys and read by different schema parsers.

### 1.2 Persistence keys are platform-specific

* Mobile: `Preferences.dashboardLayoutMobile`.
* Web: `Preferences.dashboardLayoutWeb`.
* A web layout JSON cannot be parsed as a mobile layout (different shape) —
  by design.

### 1.3 Mobile is React Native — no Tailwind, no CSS grid, no `className`

* Style via `StyleSheet.create` or inline objects.
* `flexDirection: "row"` + `gap` for layout. There is no CSS grid.
* The few NativeWind classes that exist in the codebase are tolerated, but
  for the dashboard rewrite, prefer inline `style={{}}` keyed off the theme
  via `useTheme()` (see §1.5). This matches every existing widget file.

### 1.4 Use existing mobile UI primitives — `mobile/src/components/ui/`

The dashboard MUST NOT re-implement primitives that already exist there.
Files **agents are likely to import** (135 total in that directory; this is
the relevant subset):

| File | Use for |
| --- | --- |
| `button.tsx` | Standard buttons (variant: default / outline / ghost / destructive) |
| `input.tsx` | Single-line text fields. `keyboardType="number-pad"` for numeric. |
| `text-area.tsx` / `textarea.tsx` | Multi-line text (quick-note body). Prefer `text-area.tsx`. |
| `combobox.tsx` | Single + multi select. `mode="single"` / `mode="multiple"`. |
| `select.tsx` | Plain select when Combobox is overkill. |
| `multi-select.tsx` | Discrete multi-select with chips. |
| `switch.tsx` | Boolean toggle. Used by `ToggleRow`. |
| `checkbox.tsx` | Multi-pick lists where Switch is wrong. |
| `radio-group.tsx` | Mutually-exclusive small option sets (≤4). |
| `slider.tsx` | Numeric ranges (term-critical-hours, forecast days). |
| `date-picker.tsx` / `date-range-picker.tsx` | Calendar pickers for filters. |
| `time-picker.tsx` | Time-only fields. |
| `chip.tsx` | Bucket chips (installment-table), filter tags. |
| `badge.tsx` / `status-badge.tsx` | Status / count pills. |
| `card.tsx` | Generic card chrome (rarely needed — use `WidgetCard`). |
| `sheet.tsx` | Bottom sheets (add-widget, configure-widget, size-resize). `snapPoints` are integer percentages (e.g. `[90]`, NOT `[0.9]`). |
| `modal.tsx` | Centered modal. Prefer `Sheet` for dashboard surfaces. |
| `dialog.tsx` | Confirmation dialogs (delete-widget). |
| `alert-dialog.tsx` | Destructive confirmations with primary/destructive split. |
| `action-sheet.tsx` | Per-tile overflow menu (already used in `widget-tile.tsx`). |
| `tabs.tsx` | Category tabs in `add-widget-sheet`, config sub-tabs. |
| `accordion.tsx` / `collapsible.tsx` | DO NOT USE for `Section` — `_shared.tsx` already has its own collapsible. |
| `popover.tsx` (from `index.tsx`) | Inline pickers; rarely used on mobile. |
| `haptic-button.tsx` / `haptic-switch.tsx` | Feedback-bearing buttons. Prefer when adding new chrome. |
| `icon.tsx` | Lookup helper for tabler icons. Prefer importing from `@tabler/icons-react-native` directly. |
| `loading-spinner.tsx` / `loading.tsx` / `activity-indicator.tsx` | Loading states. |
| `skeleton.tsx` / `skeleton-card.tsx` / `dashboard-skeleton.tsx` / `list-skeleton.tsx` | Skeletons. The dashboard already has its own `widgets/_skeleton.tsx`. |
| `empty-state.tsx` | Empty state. |
| `error-screen.tsx` / `error-boundary.tsx` / `table-error-boundary.tsx` | Error states. The dashboard has `widgets/_error-state.tsx`. |
| `themed-text.tsx`, `themed-text-input.tsx`, `themed-view.tsx`, `themed-touchable-opacity.tsx`, `themed-scroll-view.tsx`, `themed-safe-area-view.tsx` | Theme-aware variants. Agents should generally NOT use these inside widgets — read `useTheme().colors` and inline. They exist for older non-dashboard code. |
| `pagination.tsx` / `infinite-scroll-footer.tsx` / `table-pagination-footer.tsx` | Paged data. Dashboard tables use `limit` instead — no pagination. |
| `add-button.tsx` / `fab.tsx` / `icon-button.tsx` / `close-button.tsx` | Common buttons. |

### 1.5 Theme access — `useTheme()` from `mobile/src/contexts/theme-context.tsx`

* The context file is now a re-export shim. Real source: `mobile/src/lib/theme/`.
* Hook returns:
  ```ts
  const { theme, setTheme, colors, spacing, isDark } = useTheme();
  ```
* `colors: ThemeColors` — see §2.4 for the complete token list.
* `spacing: ThemeSpacing` — `{ xs:4, sm:8, md:16, lg:24, xl:32, xxl:48 }`.
* `isDark: boolean` — for choosing between light/dark hex pairs.
* Extended brand-color scales (red/blue/violet/etc., 50→950) are NOT on the
  theme. Import them from `mobile/src/lib/theme/extended-colors.ts`:
  `extendedColors`, `badgeColors`, `stockStatusColors`, `interactiveStates`.
* Design tokens like spacing, radius, transitions are duplicated in
  `mobile/src/constants/design-system.ts` — that file is the older,
  more complete source for radii/shadows/transitions and is what
  `Sheet` / `Modal` already import. **Use it.**

### 1.6 Agent 1 owns the framework files — others request changes via report

* `mobile/src/dashboard/types.ts`
* `mobile/src/dashboard/registry.ts`
* `mobile/src/dashboard/schemas.ts`
* `mobile/src/dashboard/index.ts` (the public barrel)

If an agent thinks one of these MUST change to land their task, they note it
in their final report; agent 1 (or a follow-up coordinator turn) lands the
edit.

---

## 2. Design Tokens for Widgets

Use these — do not invent new tokens, do not hard-code raw values.

### 2.1 Spacing

Source: `mobile/src/constants/design-system.ts` `spacing` (canonical), with
identical values mirrored in `mobile/src/lib/theme/spacing.ts`.

| Token | Pixels | Use |
| --- | --- | --- |
| `xxs` | 2 | Inline icon-text gap on tight rows |
| `xs` | 4 | Vertical gap inside a row, `hitSlop` padding |
| `sm` | 8 | Inter-control gap, ToggleRow inner gap |
| `md` | 16 | Card padding, inter-section gap, screenPadding |
| `lg` | 24 | Section-to-section large gap, modal bottom padding |
| `xl` | 32 | Full-screen vertical paddings |
| `xxl` | 48 | Hero-section padding (rarely used in widgets) |
| `screenPadding` | 16 | Outer margin of dashboard list |
| `screenPaddingBottom` | 24 | Slack at bottom of scroll |

**Widget chrome paddings (already implemented in `widget-card.tsx`, do NOT
redefine):**

| Constant | Pixels | Source |
| --- | --- | --- |
| `HEADER_HEIGHT` | 36 | `widget-card.tsx:96` |
| `FOOTER_HEIGHT` | 28 | `widget-card.tsx:98` |
| `CARD_RADIUS` | 8 | `widget-card.tsx:100` |
| `ACCENT_STRIPE_HEIGHT` | 6 | `widget-card.tsx:102` |
| `HEADER_PADDING_X` | 12 | `widget-card.tsx:104` |

**Body padding (driven by density):** see `bodyPaddingFor()` in
`widget-card.tsx`:
* compact → `{x:10, y:6}`
* comfortable → `{x:12, y:8}` (default)
* spacious → `{x:14, y:12}`

**Row padding for tables:** `densityClasses()` in `widgets/_shared.tsx:219`:
* compact → `{rowPaddingY:6, rowPaddingX:10, fontSize:12, headerFontSize:12}`
* comfortable → `{rowPaddingY:8, rowPaddingX:12, fontSize:13, headerFontSize:12}`
* spacious → `{rowPaddingY:12, rowPaddingX:14, fontSize:14, headerFontSize:13}`

**Card-list padding:** `cardDensityClasses()` in `widgets/_shared.tsx:237`:
* compact → `{cardPaddingY:8, cardPaddingX:10, primaryFontSize:12, metaFontSize:11}`
* comfortable → `{cardPaddingY:10, cardPaddingX:12, primaryFontSize:13, metaFontSize:11}`
* spacious → `{cardPaddingY:12, cardPaddingX:14, primaryFontSize:14, metaFontSize:12}`

### 2.2 Border radius

Source: `mobile/src/constants/design-system.ts` `borderRadius`.

| Token | Pixels | Use |
| --- | --- | --- |
| `sm` | 4 | Tight chip / badge corners |
| `DEFAULT` / `md` | 6 | Buttons, Section frames, pickers |
| `lg` | 8 | Widget card chrome (matches `CARD_RADIUS`), modals top corners |
| `xl` | 12 | Sheet container if visually distinct from card |
| `full` | 9999 | Circular dots, pill chips |

### 2.3 Typography

Source: `mobile/src/constants/design-system.ts` `fontSize`, `fontWeight`,
`lineHeight`. **There is no shared font family** — RN uses the system
default; `fontVariant: ["tabular-nums"]` is the canonical way to ask for
proportional digits in tables (already used in task-table).

| Use | fontSize | fontWeight | Notes |
| --- | --- | --- | --- |
| Widget header title | 14 | 600 | `numberOfLines={1}`, color `colors.foreground` |
| Widget header count pill | 10 | 500 | `tabular-nums`, color `colors.mutedForeground`, bg `colors.muted` |
| Widget body row primary | 13 (comfortable) | 600 | density-driven |
| Widget body row meta | 11 (comfortable) | 400 | color `colors.mutedForeground` |
| Section header (config) | 14 | 500 | inside `Section` collapsible |
| Field label | 12 | 600 | LabeledField label |
| Field helper text | 11 | 400 | color `colors.mutedForeground` |
| Modal title | 18 | 600 | letterSpacing: -0.2 (matches `configure-widget-modal.tsx:152`) |
| Modal description | 13 | 400 | color `colors.mutedForeground`, lineHeight 18 |
| Footer "Ver todos" link | 11 | 500 | color `colors.mutedForeground` |
| Empty state | 12 | 400 | color `colors.mutedForeground`, centered |
| Skeleton | n/a | n/a | Use existing `widgets/_skeleton.tsx` |

### 2.4 Color tokens (from `useTheme().colors`)

Both light + dark variants live in `mobile/src/lib/theme/colors.ts`.
Use the semantic key, not the hex.

| Key | Use |
| --- | --- |
| `background` | Outer screen background |
| `foreground` / `text` | Primary text (use `foreground`; `text` is alias) |
| `mutedForeground` / `textSecondary` | Secondary / meta text |
| `card` / `surface` | **Widget container background** |
| `cardForeground` | Text on card |
| `surfaceVariant` | Alternating zebra row background |
| `popover` | Overlay surface (sheets, popovers) |
| `popoverForeground` | Text on popover |
| `primary` | Brand green (#15803d). Active/selected pills, primary CTAs. |
| `primaryForeground` / `onPrimary` | Text on primary (white) |
| `primaryContainer` | Soft branded container |
| `secondary` | Subtle alt surface |
| `accent` | Same as `primary` here. Use sparingly. |
| `muted` | Disabled / pressed feedback bg |
| `border` | Default 1px border between sections |
| `input` | Background of text inputs (slightly lighter than card in dark) |
| `ring` | Focus-ring color (matches primary) |
| `destructive` / `error` | Delete buttons, error banners. With `destructiveForeground` / `onError`. |
| `success` | Green for "ok" states |
| `warning` | Amber for non-critical alerts |
| `info` | Blue accent for informational chips |

**Edit-mode overlay** (used in `widget-tile.tsx` already):
* Primary ring: `colors.primary` at 0.4 alpha (mirror web `ring-primary/40`).
  In hex: `${primary}66` works for both themes.
* Inactive ring: none.
* Press-state background: `colors.muted`.

**Active drag tile state:**
* Lifted shadow: `shadow.md` from `design-system.ts` (`shadowOpacity: 0.1`,
  `shadowRadius: 8`, `elevation: 5`).
* Opacity stays 1.0 while picked up; the sibling tiles spring to make room.
  (Web sets opacity 0.6 on the `useSortable` source — RN's
  `sortable-grid.tsx` already inverts this; do not change it.)
* Z-index lift: 30.

**Widget-specific color tokens (the per-widget accent system)** —
see `mobile/src/dashboard/components/widget-accent.tsx`:
* `WidgetAccentColor` ∈ `gray | slate | red | orange | amber | yellow |
  lime | green | emerald | teal | cyan | sky | blue | indigo | violet |
  purple | fuchsia | pink | rose` (19 colors). Hex map at `widget-accent.tsx:62`.
* `WidgetBorderColor = WidgetAccentColor | "none"`.
* `WidgetAccentIcon` (29 icons) — same set as web.
* Always go through `resolveAccent({ color, icon, shade?, borderColor? })` —
  never hard-code hexes.
* **Status tones** (task / borrow / ppe / installment) — use `widgets/_status-tones.tsx`'s
  `toneForTaskStatus()` / `toneForBorrowStatus()` / etc., never raw hexes.

### 2.5 Animation timings

| Animation | Duration | Easing | Trigger |
| --- | --- | --- | --- |
| Drag pickup (long-press → lifted) | 350ms hold | n/a | `widget-tile.tsx:18` — DO NOT change |
| Drag drop animation | 220ms | `spring (default)` | `sortable-grid.tsx` — RN spring |
| Jiggle half-cycle | 220ms | `Easing.inOut(Easing.ease)` | `widget-tile.tsx:117` |
| Section collapse/expand | 160ms | `Easing.inOut(Easing.ease)` | `_shared.tsx:63` — DO NOT diverge |
| Sheet slide-in | RN default spring | spring | `Sheet` primitive |
| Sheet slide-out | RN default spring | spring | `Sheet` primitive |
| Modal fade-in | 200ms (`transitions.fast`) | linear | `transitions.fast` from design-system |
| Modal fade-out | 200ms | linear | same |
| Backdrop fade | 200ms | linear | parallel to modal animation |
| Chip / button press feedback | 0ms (instant `pressed` style) | n/a | `Pressable`'s built-in pressed state |
| Haptic on press | n/a | `lightImpactHaptic()` from `@/utils/haptics` | call BEFORE state mutation |
| Edit-mode jiggle amplitude | ±0.4° | n/a | `widget-tile.tsx` |
| Spinner / Refresh | RN default | n/a | `RefreshControl` props |

### 2.6 Row height token (DO NOT ADD A NEW ONE)

`WIDGET_ROW_MAX_HEIGHT` in `mobile/src/dashboard/types.ts:75–80`:
```ts
{ 1: 140, 2: 296, 3: 452, 4: 608 }
```
Formula: `140·N + 16·(N-1)` (140px row unit + 16px gap).

Helpers:
* `computeBodyMaxHeight(rows)` in `widgets/_shared.tsx:322` — body budget
  after subtracting header (36) + footer (28) + 4px slack.
* `WIDGET_SPAN_LABELS` / `WIDGET_SPAN_LONG_LABELS` /
  `WIDGET_ROW_LABELS` / `WIDGET_ROW_LONG_LABELS` — see `types.ts:43–67`.

---

## 3. Edit-Mode UX Rules — the canonical interaction model

### 3.1 Entering edit mode

* From the home screen header: **Edit Toolbar** button (NEW —
  `mobile/src/dashboard/components/edit-toolbar.tsx`) — agent 2 owns.
  When `isEditing === false`: a single outline-button "Editar" with
  `IconPencil`. When `isEditing === true`: a sticky bar (see §3.7) with
  Add / Discard / Save.
* From any tile in view-mode: long-press (default 500ms native; the
  existing `widget-tile.tsx:18` description says "350ms" for drag pickup
  inside edit mode — those are SEPARATE long-presses). View-mode long-press
  to enter edit fires `onEnterEditMode`. Use `lightImpactHaptic()`.
* On enter: fire iOS-style jiggle on every tile (already implemented in
  `widget-tile.tsx`).

### 3.2 Drag to reorder (inside edit mode)

* Activator: **350ms long-press anywhere on the tile body** → ScaleHaptic
  → lifted state. The existing drag handle icon is a visual cue only;
  the gesture is bound to the tile body, not the icon.
* Pre-drag haptic: `lightImpactHaptic()` on activation.
* Drop haptic: `lightImpactHaptic()` on `onEnd`.
* While dragging:
  * Active tile: zIndex 30, `shadow.md`, no opacity change.
  * Sibling tiles spring into the new layout (`sortable-grid.tsx`).
  * **Parent ScrollView is disabled via `onDragActiveChange(true)`** —
    already wired in `dashboard-grid.tsx:82`.
* Snap-to-row: drag positions snap to the nearest row break. Mid-row
  re-ordering allowed when the row has slack (e.g. swapping two span-1's).
  Cross-row drops insert at the closest item position; greedy packer
  (`packRows()`) handles re-layout on next render. **Do NOT add a separate
  "drop zone" highlight** — the spring re-layout is the affordance.
* Reordering is drag-only — there are NO arrow buttons (web does not have
  them; mobile removed them — see `widget-tile.tsx:14`).

### 3.3 Tap-to-configure

* In edit mode, **single tap on any tile body** → opens
  `ConfigureWidgetModal` for that instance.
* Tile content remains rendered (live preview) inside the tile while
  the modal is up.
* In view mode, single tap behaviour is widget-specific (e.g. row tap →
  detail screen). The tile body tap-to-configure is only active when
  `isEditing === true`.
* The gear icon in the edit toolbar of each tile remains as a visual
  shortcut (also opens the modal) — it's redundant with body tap but
  matches the affordance many users expect.

### 3.4 Per-tile size selector behaviour

* The size pill in the tile's edit toolbar (`widget-tile.tsx`) shows
  current `${WIDGET_SPAN_LABELS[span]} × ${WIDGET_ROW_LABELS[rows]}`.
* Tap → opens the **size sheet** (a focused bottom sheet rendering ONLY
  the `SizeSelector` — see `mobile/src/dashboard/components/size-selector.tsx`,
  agent 5 owns).
* Sheet snap: `[40]` (40% of screen — the picker is short, it doesn't
  need 90%). Backdrop: `0.45`. `dragIndicator: true` (default).
* Sheet header: "Tamanho do widget" + close X.
* Sheet body: SizeSelector rendered exactly as it is in
  `configure-widget-modal.tsx:208–214`.
* Sheet footer: "Cancelar" (left, outlined) + "Aplicar" (right, primary).
  Apply commits via `onApplySize(instanceId, size)` — same path the
  Configure modal uses.
* Why a separate sheet (not inline): inline pills inside an already-tight
  edit-mode toolbar would be unreadable on phones; the existing
  task-flow ("open Configure → scroll to Tamanho → change → Aplicar")
  is too slow (4 taps for a one-knob change).

### 3.5 Add-widget gallery — `add-widget-sheet.tsx` (agent 3)

* Trigger: Edit-toolbar "Adicionar widget" pill (`IconPlus`).
* Sheet snap: `[90]`. Backdrop: `0.5`.
* Drag indicator: default `true`.
* Layout (top → bottom):
  1. Sticky header — title "Adicionar widget" (18/600), description
     "Escolha um widget para adicionar ao seu painel." (13/400/muted),
     close X on the right (36×36 hit target).
  2. Search input (sticky under header) — `IconSearch` left affordance,
     placeholder "Buscar widgets...", auto-focus when sheet opens.
  3. Category tabs (sticky) — `Tabs` from `@/components/ui/tabs.tsx`.
     Tabs: `Todos` (always present, count =`allWidgets.length`) +
     each populated `WidgetCategory` in this order:
     `production, hr, inventory, financial, other` (mirrors
     `add-widget-sheet.tsx:47`). Each tab shows count.
  4. Scrollable grid — 2 cols on phones (<600px), 3 cols on small
     tablets (600–900px), 4 cols on large tablets (≥900px). Card spacing
     5px margin. Each card min-height 168, borderRadius 10, top accent
     stripe 4px tall (color from `CATEGORY_PALETTE` in
     `add-widget-sheet.tsx:69`).
* Card content:
  * Icon (24px) inside a tinted square (40×40, 8px radius, `palette.tint`
    bg, `palette.text` icon color).
  * Category badge — top right, 10/600 uppercase, bg `palette.tint`,
    fg `palette.text`.
  * Name — 14/600, line-clamp 2.
  * Description — 12/400/muted, line-clamp 3, marginTop 6.
* On press: `lightImpactHaptic()` → `onAdd(widgetId)` → close sheet.
* Empty state: centered `IconStar` (32px, 0.4 opacity) + "Nenhum widget
  encontrado." message + (if `query`) "Tente outro termo de busca ou mude
  de categoria." sub-line.

### 3.6 Edit toolbar (NEW — agent 2)

The home screen currently ships **without** an edit toolbar — the user
has to know to long-press a tile to enter edit mode, and there's no
visible way to add/discard/save. **Closing this gap is the single
biggest UX gain in this rewrite.**

File: `mobile/src/dashboard/components/edit-toolbar.tsx` — must export:
```tsx
interface EditToolbarProps {
  isEditing: boolean;
  isDirty: boolean;
  isSaving: boolean;
  onEnterEdit: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onAddWidget: () => void;
}
export function EditToolbar(props: EditToolbarProps): JSX.Element;
```

* **View mode:** ONE outline pill button "Editar" with `IconPencil` (16px),
  `colors.foreground` text, 36px tall, `borderRadius: 6`. Renders inside
  the home screen header, right-aligned. Tap → `onEnterEdit()`.
* **Edit mode:** sticky **bottom** floating bar (NOT top) — bottom keeps
  it next to the user's thumb. Position: `position: "absolute", bottom:
  16 + safe-area, left: 16, right: 16`. Card chrome: bg `colors.card`,
  border `colors.border`, borderRadius 12, padding 8, `shadow.lg`.
  Layout: row, gap 8.
  * Left: round IconButton (40×40) "Adicionar widget" (`IconPlus`,
    `colors.foreground`).
  * Middle separator: 1×24 thin line `colors.border`.
  * Right group:
    * "Descartar" — destructive outline pill, `IconArrowBackUp`, height
      40, paddingHorizontal 12, disabled when `isSaving`.
    * "Salvar" — primary filled pill, `IconDeviceFloppy`, height 40,
      paddingHorizontal 12, disabled when `!isDirty || isSaving`. Text
      switches to "Salvando..." while `isSaving`.
* Web parity: this is mobile's analogue of `web/src/dashboard/components/edit-toolbar.tsx` —
  same 4 callbacks, same disable rules, same wording.

### 3.7 Empty / error / skeleton states — consistent across all widgets

* **Skeleton:** use `widgets/_skeleton.tsx` `<SkeletonRows count={5} density={...} />`
  for tabular widgets. For card-list widgets (favorites, recent-messages),
  build a parallel `SkeletonCards` block IN-FILE — agents 9 must add this
  primitive to `widgets/_shared.tsx` if absent.
* **Error:** use `widgets/_error-state.tsx` `<WidgetErrorState message="..."
  onRetry={refetch} />`. Standard message: "Erro ao carregar
  &lt;widget noun&gt;." (e.g. "Erro ao carregar tarefas.").
* **Empty:** use `WidgetTableMessage` (from `widgets/_table.tsx`) for
  tables, `colors.mutedForeground` 12px centered text. Honour
  `display.emptyStateMessage` config field — fall back to widget-specific
  default ("Nenhuma tarefa encontrada.", etc.).
* **Loading-on-refetch (not initial):** show small `RefreshControl` spinner
  inside the WidgetCard's `onRefresh`/`refreshing` props, NOT a full-card
  skeleton overlay.

### 3.8 Snap-to-row + greedy packing

* `packRows()` in `dashboard-grid.tsx:98` walks items in order, fills the
  row up to `slotsPerRow`, flushes. **Do not** auto-reorder for better
  packing — user order is sacred (see comment line 11).
* `slotsPerRow` is viewport-dependent: 3 / 4 / 6 (`useSlotsPerRow()` line 41).
* Span clamping for legacy data: `clampSpanToSlots()` line 129. Logs
  framework warnings when out-of-band spans show up.

---

## 4. Config Modal Rules

The canonical structure for `ConfigureWidgetModal` contents.

### 4.1 Container — `ConfigureWidgetModal` already exists

* File: `mobile/src/dashboard/components/configure-widget-modal.tsx`
  (agent 4 owns).
* Renders inside a `Sheet` with `snapPoints={[90]}`, `backdropOpacity={0.45}`.
* Wrapped in `KeyboardAvoidingView` (iOS `padding`, Android `height`).
* Body keyed by `instance.instanceId` so opening a different widget
  remounts the modal with fresh draft state — DO NOT change this pattern.

### 4.2 Header — fixed structure

* Sticky strip, paddingHorizontal 16, paddingTop 8, paddingBottom 14,
  borderBottom 1 colored `colors.border`.
* Left side: stacked title + description.
  * Title: `Configurar: ${def.name}` — 18/600, letterSpacing -0.2,
    `colors.foreground`, `numberOfLines={1}`.
  * Description: `def.description` — 13/400, lineHeight 18, marginTop 4,
    `colors.mutedForeground`, `numberOfLines={2}`.
* Right side: Close X — 36×36 round, `IconX` 20px, `colors.mutedForeground`,
  pressed bg `colors.muted`, hitSlop 12.
* **NEW required for parity** (agent 4): when `def.icon` exists, prepend a
  20×20 colored square with the widget's accent color + icon BEFORE
  the title text (matches web's per-widget icon affordance).
  Color/icon source: `def.defaultConfig.accent` if present, else
  `def.icon` rendered with `colors.foreground`.

### 4.3 Body — three sections in this order

1. **`<ConfigCard title="Tamanho">`** — renders `<SizeSelector>` exactly
   as in `configure-widget-modal.tsx:208–214`. Always present, even for
   widgets with no configurable size — when `allowedSpans` is `[3]` and
   `allowedHeights` length 1, the rows show as a single active disabled
   pill.
2. **`<ConfigCard title="Configurações do widget">`** — renders the
   widget's `ConfigComponent` if defined, ELSE
   `<DynamicFormField schema={def.configSchema} value={configDraft}
    onChange={setConfigDraft} />`.
3. **(NEW required — agent 4)** **`<ConfigCard title="Ações">`** —
   contains a destructive "Remover widget" button (full-width, outlined
   destructive variant, `IconTrash` 16px, height 44). On press → confirm
   `AlertDialog` ("Remover este widget? Esta ação não pode ser desfeita.")
   → `onRemove(instance.instanceId)` → close modal. **This used to live
   only in the per-tile overflow menu — surface it inside the modal so
   the user doesn't need to close-then-open another menu.**

### 4.4 Footer — fixed structure (already correct)

* Sticky, paddingHorizontal 16, paddingTop 12, paddingBottom 16,
  borderTop 1 `colors.border`, bg `colors.card`.
* Layout: row, gap 8.
* **Restaurar** — 44×44 outlined IconButton, `IconRestore` 18px. Resets
  `configDraft = def.defaultConfig`, `sizeDraft = {span: defaultSpan, rows: defaultRows}`,
  clears `error`. Modal stays open for review before commit.
* **Cancelar** — flex 1, outlined, height 44, foreground text. Calls `onClose()`.
* **Aplicar** — flex 1, primary filled, height 44, `IconCheck` 16px +
  "Aplicar" 14/700 `primaryForeground`. Validates draft via
  `def.configSchema.safeParse()`; on failure, shows `error` line and
  blocks; on success, calls `onApplyConfig(instanceId, parsed.data)` +
  `onApplySize(instanceId, sizeDraft)` then `onClose()`.

### 4.5 Validation error display

* Inline below the body's last ConfigCard, BEFORE the footer:
  ```tsx
  <View style={{
    borderWidth: 1, borderColor: "#ef4444",
    backgroundColor: "rgba(239,68,68,0.08)",
    borderRadius: 6, padding: 10
  }}>
    <Text style={{ fontSize: 12, color: "#ef4444" }}>{error}</Text>
  </View>
  ```
* The `#ef4444` here is intentional fixed (matches red-500). Do not
  swap to `colors.destructive` — that token differs in dark mode and
  reads as muted brown.

---

## 5. DynamicFormField Field Types

The auto-generator that runs when a widget has no custom `ConfigComponent`.

* **Web reference:** `web/src/dashboard/components/dynamic-form-field.tsx`
  handles: `ZodString`, `ZodString.email`, `ZodNumber`, `ZodBoolean`,
  `ZodEnum`, `ZodNativeEnum`. Wrappers stripped: `ZodOptional`, `ZodNullable`,
  `ZodDefault`, `ZodEffects`, `ZodBranded`. Unsupported → JSON textarea.
* **Mobile reference:** `mobile/src/dashboard/components/dynamic-form-field.tsx`
  (agent 6 owns) — currently handles a subset; must be extended.

The renderer must handle these field shapes (this is the canonical contract):

| Zod shape | Mobile UI primitive | Notes |
| --- | --- | --- |
| `z.string()` | `Input` from `@/components/ui/input` | Plain text |
| `z.string().email()` | `Input` `keyboardType="email-address"`, `autoCapitalize="none"` | |
| `z.string().url()` | `Input` `keyboardType="url"`, `autoCapitalize="none"` | |
| `z.string()` with `.describe("Multi-line")` or > 80 char default | `TextArea` from `@/components/ui/text-area` | If schema metadata flags multiline OR `max(>120)` |
| `z.string()` with `.regex(/^\d+$/)` | `Input` `keyboardType="number-pad"` | E.g. refetchInterval string |
| `z.number()` | `Input` `keyboardType="number-pad"` | Clamp on blur if `.min` / `.max` present |
| `z.number().int().min(0).max(N)` (small range) | Combine `Slider` + read-only label | When `max - min ≤ 24`, render a slider. Otherwise plain number input. |
| `z.boolean()` | `Switch` via `ToggleRow` from `_shared.tsx` | |
| `z.enum([...])` length ≤ 4 | `RadioGroup` from `@/components/ui/radio-group` | Use radio for small option sets |
| `z.enum([...])` length > 4 | `Combobox` `mode="single"` | |
| `z.nativeEnum(SomeEnum)` | `Combobox` `mode="single"` | Always combobox regardless of cardinality |
| `z.array(z.string())` (free-form) | NOT auto-handled — widget MUST supply ConfigComponent | |
| `z.array(z.enum([...]))` | `Combobox` `mode="multiple"` | |
| `z.array(z.nativeEnum(...))` | `Combobox` `mode="multiple"` | E.g. status filters |
| `z.array(z.string())` with column metadata (NEW — `.describe("__columns__:<keys>")`) | `ColumnPicker` (NEW component, agent 6) | See §5.1 |
| `z.array(z.object({key, direction}))` (multi-sort) | NOT auto-handled — widget MUST supply ConfigComponent | |
| `z.string().nullable().default(null)` (date) | `DatePicker` from `@/components/ui/date-picker` | When schema field name matches `/Date|date|At$/` |
| `z.object({ from: ..., to: ... })` (date range) | `DateRangePicker` from `@/components/ui/date-range-picker` | When key contains `Range` |
| `z.object({ ...wrapper })` | Recurse — render nested `Section` per sub-object | E.g. `display: z.object({...})` becomes a Section |
| `z.optional(...)` / `z.nullable(...)` / `z.default(...)` | Unwrap recursively (already done) | |
| Anything unsupported | Read-only JSON preview text + "Edite via configuração customizada" notice | Mobile cannot show a JSON textarea reasonably; fail loudly so the widget author adds a ConfigComponent |

### 5.1 ColumnPicker — NEW component (agent 6)

File: `mobile/src/dashboard/components/column-picker.tsx`. Mobile equivalent
of `web/src/dashboard/components/column-picker.tsx` but adapted for touch:

* Props mirror web's `ColumnPicker`:
  ```ts
  interface ColumnPickerProps<K extends string> {
    catalog: ColumnDescriptor<K>[];
    selected: K[];
    onChange: (next: K[]) => void;
    labelOverrides?: Partial<Record<K, string>>;
    onLabelChange?: (key: K, value: string) => void;
    sorts?: ColumnSort<K>[];
    onSortsChange?: (next: ColumnSort<K>[]) => void;
    maxSorts?: number;            // default 5
  }
  ```
* Visible columns sit on top in stored order; hidden columns sit below
  a divider in catalog order.
* Drag-to-reorder is replaced by **up/down arrow buttons** on the left of
  each visible row (matches the existing `ColumnPickerSection` pattern in
  `widgets/_shared.tsx:466`). DO NOT introduce drag-to-reorder inside
  the bottom sheet — drag-handle UX is unreliable inside scrollable
  sheets on RN.
* Visibility toggle via Eye / EyeOff icon button on the right.
* When `onLabelChange` supplied, the row label becomes an `Input`
  pre-filled with the override (placeholder: catalog default label).
* When `sorts` + `onSortsChange` supplied, each visible row renders a
  sort chip on the right that cycles `Não → Asc → Desc → Não`. Mirrors
  web's chip exactly: priority badge + direction icon + label.
* Helper text below: same wording as web (see web file lines 246–253).

This new component supersedes `ColumnPickerSection` for widgets that
need rename + sort. `ColumnPickerSection` stays for widgets that don't.

---

## 6. Per-Widget Spec

For EACH widget. Read carefully — config field names, defaults, and
allowed values are part of the contract.

### Notation

* Web file path always relative to `/home/kennedy/Documents/repositories/web/src/dashboard/widgets/`.
* Mobile file path always relative to `/home/kennedy/Documents/repositories/mobile/src/dashboard/widgets/`.
* "Allowed sizes" gives both web's `{cols, rows}` ranges and the mobile
  equivalent in `{span, rows}`. Mobile clamps web's 4-col widgets to span 3.
* The `accent` field is identical across all widgets:
  ```ts
  accent: z.object({
    color: z.enum([19 colors]).default(<varies>),
    icon:  z.enum([29 icons]).default(<varies>),
    borderColor?: z.enum(["none", ...19 colors]).default("none"),
    borderThickness?: z.enum(["none","thin","medium","thick"]).optional(),
    shade?: z.enum(["50".."950"]).optional(),
  }).default({...})
  ```
  Color list (19): `gray, slate, red, orange, amber, yellow, lime, green,
  emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink,
  rose`.
  Icon list (29 mobile / 22 web): see `mobile/src/dashboard/components/widget-accent.tsx`
  for the exhaustive mobile list. Web is a subset — the extra mobile icons
  (`Clock24`, `Message`, `Bell`, `Home`, `Heart`, `Bookmark`, `ChartBar`)
  must remain mobile-only or be backported by a future task.

---

### 6.1 `table.tasks` — Tarefas (production)

* **Web file:** `task-table.tsx` — 3253 lines.
* **Mobile file:** `task-table.tsx` — 633 lines (current).
* **Web defaultSize / range:** `{cols:2, rows:2}` / `1×1 → 4×4`.
* **Mobile size:** `allowedSpans=[3]`, `defaultSpan=3`, `allowedHeights=[2,3]`,
  `defaultRows=3`. **DO NOT widen** — task tables on phones are unreadable
  below full width.
* **Category:** `production`. **Default accent:** mobile `teal/ClipboardText`,
  web `gray/ClipboardText`. **Mobile-aligned default:** keep `teal/ClipboardText`
  (preset code already assumes this).
* **Allowed sectors:** PRODUCTION, PRODUCTION_MANAGER, DESIGNER, PLOTTING,
  LOGISTIC, COMMERCIAL, HUMAN_RESOURCES, WAREHOUSE, ADMIN.

#### Web config schema (verbatim summary — agents extend mobile schema until parity)

| Field | Type / values | Default | Notes |
| --- | --- | --- | --- |
| `title` | `z.string().min(1).max(80)` | `"Tarefas"` | |
| `accent` | accent shape | `{color:"gray", icon:"ClipboardText", borderColor:"none"}` | |
| `rowClickTarget` | `z.enum(["task","budget","billing"])` | `"task"` | Which detail screen the row tap navigates to. |
| `display.density` | `z.enum(DENSITY_VALUES)` | `"comfortable"` | |
| `display.striping` | bool | `true` | |
| `display.gridLines` | bool | `true` | |
| `display.hoverHighlight` | bool | `true` | (no-op on mobile) |
| `display.stickyHeader` | bool | `true` | |
| `display.showRowDot` | bool | `true` | |
| `display.showSearchBox` | bool | `false` | |
| `display.showViewAllLink` | bool | `true` | |
| `display.showCount` | bool | `true` | |
| `display.layoutMode` | `z.enum(["flat","grouped-by-status","tabs"])` | `"flat"` | |
| `cellModes.serviceOrder` | `z.enum(["count","progress-bar"])` | `"progress-bar"` | |
| `cellModes.paint` | `z.enum(["swatch","swatch-name","name"])` | `"swatch-name"` | |
| `cellModes.status` | `z.enum(["badge","dot-label","text"])` | `"badge"` | |
| `deadlineColors.enabled` | bool | `true` | |
| `deadlineColors.bold` | bool | `true` | |
| `deadlineColors.forecastCriticalDays` | int 0–60 | `3` | |
| `deadlineColors.forecastWarningDays` | int 0–120 | `7` | |
| `deadlineColors.forecastNoticeDays` | int 0–180 | `10` | |
| `deadlineColors.forecastCriticalColor` | string | `"red-500"` | |
| `deadlineColors.forecastWarningColor` | string | `"orange-500"` | |
| `deadlineColors.forecastNoticeColor` | string | `"yellow-500"` | |
| `deadlineColors.termOverdueColor` | string | `"red-500"` | |
| `deadlineColors.termCriticalHours` | num 0–72 | `4` | (mobile already has this as top-level `termCriticalHours`) |
| `deadlineColors.termCriticalColor` | string | `"amber-500"` | |
| `deadlineColors.termOnTrackColor` | string | `"green-500"` | |
| `columns` | `z.array(z.enum(COLUMN_KEY_VALUES)).min(1)` | `["name","customerName","serialNumber","term"]` | 41 column keys (see below) |
| `columnWidths` | `z.record(z.string())` | `{}` | px or fr units |
| `columnLabels` | `z.record(z.string())` | `{}` | per-column rename overrides |
| `filters.status` | `z.array(z.nativeEnum(TASK_STATUS))` | `[]` | |
| `filters.sectorIds` | uuid[] | `[]` | |
| `filters.customerIds` | uuid[] | `[]` | |
| `filters.assigneeIds` | uuid[] | `[]` | |
| `filters.truckCategories` | TRUCK_CATEGORY[] | `[]` | |
| `filters.implementTypes` | IMPLEMENT_TYPE[] | `[]` | |
| `filters.commissions` | COMMISSION_STATUS[] | `[]` | |
| `filters.hasTruck` | `"any"\|"yes"\|"no"` | `"any"` | |
| `filters.termPreset` | `"any"\|"today"\|"overdue"\|"next-7-days"\|"next-30-days"\|"this-month"` | `"any"` | |
| `filters.forecastPreset` | `"any"\|"today"\|"next-7-days"\|"next-30-days"\|"this-month"` | `"any"` | |
| `filters.finishedPreset` | `"any"\|"today"\|"last-7-days"\|"last-30-days"\|"this-month"` | `"any"` | |
| `filters.createdPreset` | `"any"\|"today"\|"last-7-days"\|"last-30-days"\|"this-month"` | `"any"` | |
| `filters.termRange` | `{from: string\|null, to: string\|null}` | `{from:null,to:null}` | |
| `filters.forecastRange` | same | `{from:null,to:null}` | |
| `filters.finishedRange` | same | `{from:null,to:null}` | |
| `filters.createdRange` | same | `{from:null,to:null}` | |
| `filters.entryRange` | same | `{from:null,to:null}` | |
| `filters.hasOpenSO` | tri-state | `"any"` | |
| `filters.hasArtworks` | tri-state | `"any"` | |
| `filters.hasObservation` | tri-state | `"any"` | |
| `filters.hasBudget` | tri-state | `"any"` | |
| `filters.isOverdue` | tri-state | `"any"` | |
| `filters.serviceOrderTypes` | SERVICE_ORDER_TYPE[] | `[]` | |
| `filters.quoteStatuses` | TASK_QUOTE_STATUS[] | `[]` | |
| `filters.defaultSearch` | string | `""` | |
| `sort.key` | `SORT_KEYS` enum | `"term"` | |
| `sort.direction` | `"asc"\|"desc"` | `"asc"` | |
| `sorts` | `Array<{key:string, direction}>` | `[{key:"term", direction:"asc"}]` | multi-sort |
| `limit` | int 5–200 | `20` | |
| `showHeader` | bool | `true` | |
| `behavior.refetchIntervalMs` | int 0–3_600_000 | `0` | |
| `behavior.viewAllRouteOverride` | string | `""` | |

#### Column catalog (41 keys — `COLUMN_KEY_VALUES`)

```
name, customerName, responsibles, serialNumber, chassisNumber, plate,
spot, sector, status, commission, term, remainingTime, forecastDate,
createdAt, entryDate, startedAt, finishedAt, generalPainting, logoPaints,
paintFinish, truckCategory, implementType, quoteTotal, quoteStatus, price,
observation, details, soProduction, soCommercial, soLogistic, soArtwork,
soCount, soOpenCount, soProductionCount, soCommercialCount, soLogisticCount,
soArtworkCount, hasArtworks, hasOpenSO, hasBudget, hasObservation
```

Sort key catalog (`SORT_KEYS`, 11 keys):
`term, forecastDate, createdAt, startedAt, finishedAt, name, statusOrder,
entryDate, price, commissionOrder, updatedAt`.

#### Mobile current state (gaps to close)

Mobile schema currently has **9 columns total** (3 in `TASK_COLUMN_KEYS` +
6 implicit in old configs). Top-level shape:
```
title, showHeader, showPaintDot, termCriticalHours,
filters: {statuses, onlyOverdue},
sort: {key, direction},
limit, visibleColumns: ["task","status","term"],
display, accent
```
**Gaps for agent 10:**
* Add `rowClickTarget` enum field — wire into the row tap handler
  (currently always pushes `producao/cronograma/detalhes`).
* Expose `cellModes.status` (`badge|dot-label|text`) — mobile currently
  hard-codes badge.
* Expose `cellModes.paint` (`swatch|swatch-name|name`) — mobile currently
  hard-codes the dot. The `swatch-name` mode would put the paint name as
  meta on the second line.
* Expand column catalog from 3 → at least 12 mobile-feasible:
  `task` (composite, always visible), `customerName`, `serialNumber`,
  `status`, `term`, `forecastDate`, `createdAt`, `sector`, `responsibles`,
  `commission`, `quoteStatus`, `quoteTotal`. The remaining 29 web
  columns are explicitly out of scope on mobile (paint canvas swatch,
  multiple SO sub-counts, plate, etc. — too data-dense for phone).
* Replace `sort` with multi-sort `sorts` array (limit 3 sort entries on
  mobile to keep the UI sane — web allows 5).
* Add filter fields: `customerIds`, `sectorIds`, `termPreset`,
  `forecastPreset`, `createdPreset`, `entryRange` (date-range picker),
  `defaultSearch`, `quoteStatuses`, `serviceOrderTypes`. The truck/
  artwork/SO/budget tri-state filters are out of scope for mobile —
  not enough column real estate to justify them.
* Add `behavior.refetchIntervalMs` field — mobile already has
  `display.refetchInterval` (string) which is mobile's analogue. Keep
  one source: prefer the existing `display.refetchInterval`. Drop
  the new field from the parity list.
* Add `display.layoutMode` enum (`flat|grouped-by-status|tabs`). Tabs
  are valuable on phones (top-strip status filter feels native);
  grouped is OK if implementable cheaply. Wire layoutMode through to
  the renderer.

---

### 6.2 `table.items` — Itens / Estoque (inventory)

* **Web file:** `item-table.tsx` — 1154 lines.
* **Mobile file:** `item-table.tsx` — 490 lines.
* **Web defaultSize:** `{cols:2, rows:2}` / range `1×1 → 4×4`.
* **Mobile size:** must enforce `allowedSpans=[3]`, `allowedHeights=[2,3,4]`,
  `defaultSpan=3`, `defaultRows=3`. (Confirm in current file; if absent,
  agent 11 adds.)
* **Category:** `inventory`. **Default accent:** `yellow/Package`.
* **Allowed sectors:** WAREHOUSE, ADMIN, MAINTENANCE.

#### Web config schema

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `string.min(1).max(80)` | `"Itens"` | |
| `accent` | accent shape (no `borderColor`/`borderThickness` in this widget — older schema) | `{color:"yellow", icon:"Package", shade:"500"}` | |
| `columns` | `z.array(z.enum(...)).min(1)` | `["name","brand","quantity","monthlyConsumption"]` | 16 keys |
| `filters.searchingFor` | string | `""` | |
| `filters.stockLevels` | `STOCK_LEVEL[]` | `[]` | |
| `filters.brandIds` | uuid[] | `[]` | |
| `filters.categoryIds` | uuid[] | `[]` | |
| `filters.supplierIds` | uuid[] | `[]` | |
| `filters.abcCategories` | `ABC_CATEGORY[]` | `[]` | |
| `filters.xyzCategories` | `XYZ_CATEGORY[]` | `[]` | |
| `filters.isActive` | tri-state | `"yes"` | |
| `filters.hasReorderPoint` | tri-state | `"any"` | |
| `filters.hasMaxQuantity` | tri-state | `"any"` | |
| `filters.shouldAssignToUser` | tri-state | `"any"` | |
| `filters.quantityMin` | num \| null | `null` | |
| `filters.quantityMax` | num \| null | `null` | |
| `sorts` | `Array<{key:string, direction}>` | `[{key:"name", direction:"asc"}]` | |
| `limit` | int 5–200 | `20` | |
| `display.density` | enum | `"comfortable"` | |
| `display.striping/gridLines/hoverHighlight/stickyHeader` | bool | `true` | |
| `display.showHeader` | bool | `true` | |
| `display.showCount` | bool | `true` | |

#### Column catalog (16)

```
uniCode, name, brand, category, quantity, reorderPoint, maxQuantity,
monthlyConsumption, price, totalPrice, supplier, abcCategory, xyzCategory,
isActive, shouldAssignToUser, createdAt
```

#### Mobile current state — gaps

Mobile schema has `name, qty, stock` columns only (3 keys based on preset
configs). Visible config in mobile widget catalog: confirm in file 490 LoC.
**Gaps for agent 11:**
* Expand mobile column catalog to at least 10:
  `name, uniCode, brand, category, quantity, reorderPoint, monthlyConsumption,
  price, supplier, abcCategory`.
* Add filters: `stockLevels` (`STOCK_LEVEL` multi), `brandIds`,
  `categoryIds`, `supplierIds`, `abcCategories`, `xyzCategories`,
  `isActive` (tri-state), `quantityMin/Max`. Skip `hasReorderPoint`,
  `hasMaxQuantity`, `shouldAssignToUser` — niche tri-states.
* Convert single-sort to multi-sort `sorts` (limit 2).
* Wire density into `WidgetTableContainer` properly.

---

### 6.3 `table.borrows` — Empréstimos (inventory)

* **Web file:** `borrow-table.tsx` — 1057 lines.
* **Mobile file:** `borrow-table.tsx` — 527 lines.
* **Web defaultSize:** `{cols:2, rows:2}` / `2×1 → 4×4`.
* **Mobile size:** `allowedSpans=[3]`, `defaultSpan=3`,
  `allowedHeights=[2,3]`, `defaultRows=2`.
* **Category:** `inventory`. **Default accent:** `violet/Package`.
* **Allowed sectors:** WAREHOUSE, ADMIN.

#### Web config schema

| Field | Type | Default |
| --- | --- | --- |
| `title` | string | `"Empréstimos"` |
| `accent` | accent shape | `{color:"violet", icon:"Package", shade:"500"}` |
| `columns` | `z.enum(COLUMN_KEY_VALUES).min(1)` | `["itemUniCode","itemName","status","borrowedAt"]` |
| `filters.searchingFor` | string | `""` |
| `filters.statuses` | `BORROW_STATUS[]` | `[]` |
| `filters.itemIds` | uuid[] | `[]` |
| `filters.userIds` | uuid[] | `[]` |
| `filters.categoryIds` | uuid[] | `[]` |
| `filters.brandIds` | uuid[] | `[]` |
| `filters.createdPreset` | `"any"\|"today"\|"last-7-days"\|"last-30-days"\|"this-month"` | `"any"` |
| `filters.hideReturned` | bool | `true` |
| `filters.onlyOverdue` | bool | `false` |
| `sorts` | `Array<{key,dir}>` | `[{key:"createdAt", direction:"desc"}]` |
| `limit` | int 5–200 | `30` |
| `display.*` | same as item-table | comfortable/true/true/true/true/true/true |

#### Column catalog (12)

```
itemUniCode, itemName, itemBrand, itemCategory, userName, userSector,
quantity, status, borrowedAt, returnedAt, daysOutstanding, updatedAt
```

Sort keys (7): `createdAt, returnedAt, status, quantity, itemName, userName, updatedAt`.

#### Mobile current state — gaps (agent 12)

* Mobile preset uses keys: `["item", "status", "days"]` — non-standard
  column key naming. Reconcile to web's keys (`itemName`, `status`,
  `daysOutstanding`).
* Expand catalog: `itemUniCode, itemName, userName, userSector, quantity,
  status, borrowedAt, daysOutstanding`.
* Add filters: `statuses`, `userIds`, `createdPreset`, `hideReturned`,
  `onlyOverdue`.
* Multi-sort + limit field.

---

### 6.4 `table.ppe-deliveries` — Entregas de EPI (hr)

* **Web file:** `ppe-delivery-table.tsx` — 1031 lines.
* **Mobile file:** `ppe-delivery-table.tsx` — 649 lines.
* **Web defaultSize:** `{cols:4, rows:2}` / `2×1 → 4×4`.
* **Mobile size:** `allowedSpans=[3]`, `defaultSpan=3`,
  `allowedHeights=[2,3]`, `defaultRows=2`.
* **Category:** `hr`. **Default accent:** `amber/ClipboardCheck`.
* **Allowed sectors:** HUMAN_RESOURCES, ADMIN, WAREHOUSE.

#### Web config schema

| Field | Default |
| --- | --- |
| `title` | `"Entregas de EPI"` |
| `accent` | `{color:"amber", icon:"ClipboardCheck", shade:"500"}` |
| `display.density/striping/gridLines/hoverHighlight/stickyHeader/showHeader/showCount/showSearchBox` | mostly `true` |
| `display.emptyStateMessage` | `""` |
| `columns` | `["itemName","userName","quantity","status","scheduledDate"]` |
| `filters.searchingFor` | `""` |
| `filters.statuses` | `[PPE_DELIVERY_STATUS.PENDING, PPE_DELIVERY_STATUS.WAITING_SIGNATURE]` |
| `filters.itemIds` | `[]` |
| `filters.userIds` | `[]` |
| `filters.onlyActionable` | `false` |
| `sorts` | `[{key:"createdAt", direction:"desc"}]` |
| `limit` | `30` |

#### Column catalog (12)

```
itemUniCode, itemName, userName, userSector, quantity, status,
scheduledDate, actualDeliveryDate, reviewedBy, reason, createdAt, updatedAt
```

Sort keys (7): `createdAt, scheduledDate, actualDeliveryDate, status, itemName, userName, updatedAt`.

#### Mobile gaps (agent 12)

* Add web's full column set (mobile currently exposes a subset).
* Add `display.showSearchBox`, `display.emptyStateMessage`.
* Wire `onlyActionable` filter (when true, only show statuses the
  current user can take action on — HR sees PENDING, Warehouse sees
  WAITING_SIGNATURE).
* Action buttons (approve/reject/deliver) live in the row context-menu —
  agent 12 keeps the existing implementation; do NOT inline buttons.

---

### 6.5 `table.hr-requests` — Requisições de RH (hr) — **MISSING ON MOBILE**

* **Web file:** `hr-requests-table.tsx` — 1318 lines.
* **Mobile file:** `widgets/hr-requests-table.tsx` — **MUST CREATE** (agent 15).
* **Web defaultSize:** `{cols:4, rows:3}` / `2×2 → 4×4`.
* **Mobile size:** `allowedSpans=[3]`, `defaultSpan=3`,
  `allowedHeights=[3,4]`, `defaultRows=3`.
* **Category:** `hr`. **Default accent:** `indigo/Clock`.
* **Allowed sectors:** HUMAN_RESOURCES, ADMIN.

#### Web config schema

| Field | Default |
| --- | --- |
| `title` | `"Requisições de RH"` |
| `accent` | `{color:"indigo", icon:"Clock", shade:"500"}` |
| `display.density/striping/gridLines/hoverHighlight` | comfortable/true |
| `display.showHeader/showCount/showSearchBox` | `true` |
| `display.emptyStateMessage` | `""` |
| `filters.searchingFor` | `""` |
| `filters.estados` | `int[]` | `[0]` (0 = pending, 1 = approved, 2 = rejected) |
| `filters.tipos` | `int[]` | `[]` (Secullum request types) |
| `sorts` | `[{key:"dataSolicitacao", direction:"desc"}]` |
| `limit` | int 5–200 | `30` |
| `showActionButtons` | bool | `true` |

#### Renders

* Cards layout (NOT a tabular grid) — each card = one Secullum request.
* Two-pane on web (list left, detail right). On mobile: full-width list
  in tile; tap → detail Sheet (slide-up at 90% snap).
* Action buttons (Approve / Reject) live inside detail sheet.
* `useSecullumRequests`, `useSecullumApproveRequest`, `useSecullumRejectRequest`
  hooks already exist — confirm import paths from
  `mobile/src/hooks/secullum/*` (or equivalent). If they don't exist on
  mobile, agent 15 escalates back — do NOT create cross-module API
  wrappers in this rewrite scope.

#### Mobile gaps

* Entire widget. Skeleton:
  ```ts
  configSchema = z.object({
    title, accent, display, filters: {searchingFor, estados, tipos},
    sorts, limit, showActionButtons
  })
  ```

---

### 6.6 `table.installments` (web `financial.installments`) — Boletos (financial)

* **Web file:** `installment-table.tsx` — 1521 lines.
* **Mobile file:** `installment-table.tsx` — 709 lines.
* **Web ID:** `financial.installments`. **KEEP this ID on mobile** —
  layouts persist with it and the preset already references it.
* **Web defaultSize:** `{cols:4, rows:2}` / `2×1 → 4×4`.
* **Mobile size:** `allowedSpans=[3]`, `defaultSpan=3`,
  `allowedHeights=[2,3]`, `defaultRows=2`.
* **Category:** `financial`. **Default accent:** `blue/Receipt`.
* **Allowed sectors:** ADMIN, COMMERCIAL, FINANCIAL.

#### Web config schema

| Field | Default |
| --- | --- |
| `title` | `"Boletos"` |
| `accent` | `{color:"blue", icon:"Receipt", shade:"500"}` |
| `display.density/striping/gridLines/hoverHighlight/stickyHeader/showHeader` | `true` |
| `display.showSearchBox` | `true` |
| `display.showBucketChips` | `true` |
| `display.showCount` | `true` |
| `display.showViewAllLink` | `true` |
| `display.layoutMode` | `"flat"\|"grouped-by-bucket"\|"grouped-by-status"` → `"flat"` |
| `display.emptyStateMessage` | `""` |
| `columns` | `["customer","task","installment","dueDate","countdown","amount","installmentStatus","bankSlipStatus"]` |
| `filters.defaultBucket` | `"all"\|"overdue"\|"today"\|"tomorrow"\|"next-7-days"\|"next-30-days"\|"this-month"\|"paid-recent"` → `"next-30-days"` |
| `filters.installmentStatuses` | `INSTALLMENT_STATUS[]` → `[]` |
| `filters.bankSlipStatuses` | `BANK_SLIP_STATUS[]` → `[]` |
| `filters.customerIds` | `string[]` → `[]` |
| `filters.hideFullyPaid` | bool → `false` |
| `filters.hideMissingBankSlip` | bool → `false` |
| `sorts` | `[{key:"dueDate", direction:"asc"}]` |
| `limit` | int 5–200 → `50` |
| `refetchInterval` | int → `0` |

#### Column catalog (12)

```
customer, task, installment, dueDate, countdown, amount, paidAmount,
installmentStatus, bankSlipStatus, nossoNumero, paymentMethod, quoteStatus
```

#### Mobile gaps (agent 13)

* Mobile schema currently uses `defaultBucket: "next-30-days"` and
  `filters.hideFullyPaid` — confirm full alignment.
* Add `bucketChips` UI strip below the search bar (chips = "Todas",
  "Vencidas", "Hoje", "Amanhã", "7 dias", "30 dias", "Este mês",
  "Pagas") — mirrors web behaviour, see web file for chip rendering.
* Add `display.layoutMode` (flat / grouped-by-bucket / grouped-by-status).
* Add column visibility config (currently hard-coded subset).

---

### 6.7 `quick-action.budget` — Novo Orçamento (other) — **MISSING ON MOBILE**

* **Web file:** `quick-budget.tsx` — 593 lines.
* **Mobile file:** **MUST CREATE** at `widgets/quick-budget.tsx` (agent 16).
* **Web defaultSize:** `{cols:2, rows:4}` / `2×3 → 4×4`.
* **Mobile size:** `allowedSpans=[3]`, `defaultSpan=3`,
  `allowedHeights=[3,4]`, `defaultRows=4`.
* **Category:** `other`. **Default accent:** `emerald/Receipt`.
* **Allowed sectors:** ADMIN, COMMERCIAL, FINANCIAL.

#### Web config schema

| Field | Default |
| --- | --- |
| `title` | `"Novo Orçamento"` |
| `accent` | `{color:"emerald", icon:"Receipt", shade:"500"}` |
| `defaultCustomerId` | uuid (optional) |
| `defaultGuaranteeYears` | int 0–5 (optional) |
| `display.showHeader` | bool → `true` |

#### Renders

* Form widget (NOT a list). Three sections: **Tarefa**, **Informações**,
  **Serviços**. Submits a `Task` + `TaskQuote` via two API calls.
* Mobile must use `_keyboard-aware-widget.tsx` pattern (already exists in
  `widgets/`) so the form stays above the keyboard.
* Required form fields:
  * Tarefa: customer (Combobox), name, serialNumber, term (DatePicker),
    forecastDate (DatePicker), details (TextArea).
  * Informações: expiresAt (DatePicker, default today+15d),
    customGuaranteeText (Input), customForecastDays (number Input).
  * Serviços: dynamic list of `{description, amount}` rows. Add/remove
    buttons. Subtotal computed.
* **Mobile note:** the web widget is currently disabled in
  `widgets/index.ts:18` as "pending redesign". Agent 16 should ship this
  version — KEEP it disabled at the registry level until the user
  signs off.

#### Mobile gaps

* Entire widget.
* Hooks needed: `useTaskMutations` (`createAsync`), `useCreateTaskQuote`,
  `useCustomers`. If any aren't ported, agent 16 escalates.

---

### 6.8 `home.hr-calendar` — Calendário de Colaboradores (hr) — **MISSING ON MOBILE**

* **Web file:** `hr-calendar.tsx` — 806 lines.
* **Mobile file:** **MUST CREATE** at `widgets/hr-calendar.tsx` (agent 15).
* **Shared utils:** `widgets/_calendar-shared.tsx` — **MUST CREATE** by
  agent 9 (port from web's same-named file, 330 lines).
* **Web defaultSize:** `{cols:4, rows:3}` / `2×3 → 4×4`.
* **Mobile size:** `allowedSpans=[3]`, `defaultSpan=3`,
  `allowedHeights=[3,4]`, `defaultRows=3`.
* **Category:** `hr`. **Default accent:** `violet/Calendar`.
* **Allowed sectors:** HUMAN_RESOURCES, ADMIN, PRODUCTION_MANAGER.

#### Web config schema

| Field | Default |
| --- | --- |
| `title` | `"Calendário de Colaboradores"` |
| `accent` | `{color:"violet", icon:"Calendar", shade:"500"}` |
| `display.showHeader` | `true` |
| `display.showFilters` | `true` |
| `display.showVacation` | `true` |
| `display.showJustifiedFalta` | `true` |
| `display.showUnjustifiedFalta` | `true` |
| `display.showHoliday` | `true` |
| `display.showSunday` | `true` |
| `display.showSaturday` | `true` |
| `filters.defaultUserId` | `string` → `"__ALL__"` |
| `filters.defaultSectorId` | `string\|null` → `null` |

#### Renders

* Monthly grid showing the payroll period 26→25 (NOT calendar month).
  Helper `getPayrollPeriod()` and `buildPeriodGrid()` live in
  `_calendar-shared.tsx`.
* Cells colored by event type: vacation, justified falta, unjustified falta,
  holiday. Saturdays/Sundays shaded if shown.
* User picker (`Combobox`) and Sector picker filter views.
* Hooks: `useSecullumAggregatedAbsences`, `useSecullumUnjustifiedAbsences`,
  `useSecullumHolidays`, `useUsers`, `useSectors`.

#### Mobile gaps (agent 15)

* Entire widget. Uses small touch-friendly grid: each day cell is a
  square ~min(40, viewportWidth/9) tall. Tap a day → detail Sheet
  showing absences for that day.
* On span 3, the calendar's 7 columns + 6 rows fit comfortably at
  rows=3 (452px height budget). Tighter rows are not allowed.

---

### 6.9 `home.production-calendar` — Calendário de Produção (production) — **MISSING ON MOBILE**

* **Web file:** `production-calendar.tsx` — 903 lines.
* **Mobile file:** **MUST CREATE** at `widgets/production-calendar.tsx` (agent 16).
* **Web defaultSize:** `{cols:4, rows:3}` / `2×3 → 4×4`.
* **Mobile size:** `allowedSpans=[3]`, `defaultSpan=3`,
  `allowedHeights=[3,4]`, `defaultRows=3`.
* **Category:** `production`. **Default accent:** `indigo/Calendar`.
* **Allowed sectors:** ADMIN, PRODUCTION, PRODUCTION_MANAGER, COMMERCIAL,
  LOGISTIC, WAREHOUSE, DESIGNER, PLOTTING, MAINTENANCE.

#### Web config schema

| Field | Default |
| --- | --- |
| `title` | `"Calendário de Produção"` |
| `accent` | `{color:"indigo", icon:"Calendar", shade:"500"}` |
| `display.showHeader/showFilters/showTerm/showForecast/showStarted/showFinished/showSunday/showSaturday` | all `true` |
| `display.eventColors.term` | `"purple-600"` |
| `display.eventColors.forecastDate` | `"orange-600"` |
| `display.eventColors.startedAt` | `"blue-600"` |
| `display.eventColors.finishedAt` | `"green-700"` |
| `display.eventColors.overdue` | `"red-700"` |
| `filters.statuses` | `[PREPARATION, WAITING_PRODUCTION, IN_PRODUCTION, COMPLETED]` |
| `filters.includeCancelled` | `false` |

#### Renders

* Same grid scaffold as hr-calendar (use `_calendar-shared.tsx`).
* Each day cell shows event dots (term/forecast/started/finished); tap a
  day → list of tasks in a detail Sheet.

---

### 6.10 `home.daily-ponto` — Ponto do Dia (hr)

* **Web file:** `daily-ponto.tsx` — 1254 lines.
* **Mobile file:** `daily-ponto.tsx` — 287 lines.
* **Web defaultSize:** `{cols:4, rows:3}` / `1×1 → 4×4`.
* **Mobile size:** must be `allowedSpans=[3]`, `defaultSpan=3`,
  `allowedHeights=[3]` (forced — web has tons of columns; mobile needs
  full height to feel useful).
* **Category:** `hr`. **Default accent:** `teal/Clock24`.
* **Allowed sectors:** HUMAN_RESOURCES, PRODUCTION_MANAGER, ADMIN.

#### Web config schema (full)

| Field | Default |
| --- | --- |
| `title` | `"Ponto do Dia"` |
| `accent` | `{color:"teal", icon:"Clock24", shade:"500"}` |
| `display.density/striping/gridLines/hoverHighlight/stickyHeader/showHeader/showCount/showSearchBox/showDayNavigator/showViewAllLink` | mostly `true` |
| `display.emptyStateMessage` | `""` |
| `display.layoutMode` | `"flat"\|"grouped-by-sector"` → `"flat"` |
| `columns` | `["userName","sectorName","entrada1","saida1","entrada2","saida2","normais","faltas"]` |
| `filters.mode` | `"all"\|"with-entries"\|"without-entries"\|"justified"\|"late"\|"overtime"\|"day-off"\|"compensated"` → `"all"` |
| `filters.sectorNames` | `string[]` → `[]` |
| `filters.positionNames` | `string[]` → `[]` |
| `filters.defaultSearch` | string → `""` |
| `sorts` | `[{key:"userName", direction:"asc"}]` |
| `limit` | 5–200 → `50` |

#### Column catalog (28 keys)

```
userName, sectorName, positionName, justification, entrada1..entrada5,
saida1..saida5, normais, faltas, ex50, ex100, ex150, dsr, dsrDeb, ajuste,
atras, adian, compensated, neutral, dayOff, freeLunch
```

#### Mobile gaps (agent 14)

* Mobile schema is much thinner. Add: `filters.mode` enum,
  `filters.sectorNames`, `filters.positionNames`, `filters.defaultSearch`,
  `sorts` array, `limit`, full column catalog.
* Show day navigator (`<` Hoje `>`) when `display.showDayNavigator=true`.
* Phone reality check: 28 columns at fontSize 12 don't all fit.
  Default visible: `userName, normais, faltas`. The user can opt in to
  more — keep the catalog complete.

---

### 6.11 `home.time-entries` — Ponto da Semana (hr)

* **Web file:** `time-entries.tsx` — 142 lines.
* **Mobile file:** `time-entries.tsx` — 383 lines.
* **Web defaultSize:** `{cols:2, rows:2}` / `1×1 → 4×4`.
* **Mobile size:** `allowedSpans=[2,3]`, `defaultSpan=3`,
  `allowedHeights=[2,3]`, `defaultRows=2`.
* **Category:** `hr`. **Default accent:** `teal/Clock`.
* **Allowed sectors:** `"*"`.

#### Web config schema

| Field | Default |
| --- | --- |
| `title` | `"Ponto da Semana"` |
| `accent` | `{color:"teal", icon:"Clock", shade:"500"}` |
| `display.showHeader` | `true` |

#### Mobile gaps (agent 14)

* Web wraps an existing `TimeEntriesCard`. Mobile should likewise wrap a
  pre-built personal-ponto card from `mobile/src/components/home-dashboard/`
  (confirm path; if it doesn't exist, agent 14 escalates).
* Already mostly aligned — focus on accent/header parity, no schema gaps.

---

### 6.12 `home.recent-messages` — Mensagens Recentes (other)

* **Web file:** `recent-messages.tsx` — 627 lines.
* **Mobile file:** `recent-messages.tsx` — 153 lines.
* **Web defaultSize:** `{cols:4, rows:2}` / `1×1 → 4×4`.
* **Mobile size:** `allowedSpans=[2,3]`, `defaultSpan=2`,
  `allowedHeights=[2,3,4]`, `defaultRows=2`.
* **Category:** `other`. **Default accent:** `indigo/Message`.
* **Allowed sectors:** `"*"`.

#### Web config schema

| Field | Default |
| --- | --- |
| `title` | `"Mensagens Recentes"` |
| `accent` | `{color:"indigo", icon:"Message", shade:"500"}` |
| `itemsPerRow` | int 1–8 → `4` |
| `itemsPerColumn` | int 1–6 → `2` |
| `density` | enum → `"comfortable"` |
| `display.showHeader` | `true` |

#### Mobile gaps (agent 13)

* Add `itemsPerRow`, `itemsPerColumn`, `density` to mobile schema.
* Mobile responsive breakpoints (override `itemsPerRow` for span):
  span 2 → max 2 cols; span 3 → max 3 cols (the web 4-up grid is
  unreadable on phones).
* Render a colored "block preview" for each message (heading bar,
  body lines, etc.) — port `generateBlocks()` and the `BlockKind`
  rendering from web file lines 117+.

---

### 6.13 `home.favorites` — Favoritos (other)

* **Web file:** `favorites.tsx` — 363 lines.
* **Mobile file:** `favorites.tsx` — 283 lines.
* **Web defaultSize:** `{cols:4, rows:1}` / `1×1 → 4×4`.
* **Mobile size:** `allowedSpans=[1,2,3]`, `defaultSpan=1`,
  `allowedHeights=[1,2,3]`, `defaultRows=2`.
* **Category:** `other`. **Default accent:** `yellow/Star`.
* **Allowed sectors:** `"*"`.

#### Web config schema

| Field | Default |
| --- | --- |
| `title` | `"Favoritos"` |
| `accent` | `{color:"yellow", icon:"Star", shade:"500"}` |
| `itemsPerRow` | int 1–10 → `4` |
| `itemsPerColumn` | int 1–6 → `1` |
| `density` | enum → `"comfortable"` |
| `display.showHeader` | `true` |
| `display.showCount` | `true` |

#### Mobile gaps (agent 13)

* Mobile already supports this widget. Add `itemsPerColumn`, `density`
  fields if absent (default 1 / comfortable).
* Density variants:
  * compact → horizontal-tight (icon-left, 1-line title).
  * comfortable → horizontal-roomy (icon-left, 2-line title).
  * spacious → vertical-centered (icon-top, large title centered).
  Mirror web's `VARIANT_STYLES` (file lines 88+) using mobile padding/font tokens.

---

### 6.14 `quick-action.note` — Anotações (other)

* **Web file:** `quick-note.tsx` — 228 lines.
* **Mobile file:** `quick-note.tsx` — 220 lines.
* **Web defaultSize:** `{cols:1, rows:2}` / `1×1 → 4×4`.
* **Mobile size:** `allowedSpans=[1,2,3]`, `defaultSpan=1`,
  `allowedHeights=[1,2,3]`, `defaultRows=2`.
* **Category:** `other`. **Default accent:** `amber/FileText`.
* **Allowed sectors:** `"*"`.

#### Web config schema

| Field | Default |
| --- | --- |
| `title` | `"Anotações"` |
| `accent.color` | `"amber"` |
| `accent.icon` | `"FileText"` |
| `accent.shade` | optional |
| `display.showHeader` | `true` |

#### Mobile gaps (agent 14)

* Persistence: web uses `localStorage`. Mobile must use `AsyncStorage`
  with the same key prefix `ankaa.dashboard.quick-note:${instanceId}`.
* Debounce save 350ms (matches web).
* Already mostly aligned.

---

## 7. Component Ownership Map

To prevent merge collisions across agents 2–16. **If a file is not in
this list, no agent should touch it without escalating to agent 1.**

| Agent | Files (NEW = create) |
| --- | --- |
| 1 | `mobile/src/dashboard/MOBILE_WIDGETS_SPEC.md` (this file) — sole authority on `types.ts`, `registry.ts`, `schemas.ts`, `index.ts` |
| 2 | `components/dashboard-grid.tsx`, `components/sortable-grid.tsx`, NEW `components/edit-toolbar.tsx` |
| 3 | `components/add-widget-sheet.tsx` |
| 4 | `components/configure-widget-modal.tsx` |
| 5 | `components/size-selector.tsx`, `components/widget-tile.tsx`, `components/widget-card.tsx` |
| 6 | `components/dynamic-form-field.tsx`, NEW `components/column-picker.tsx` |
| 7 | `components/widget-accent.tsx` |
| 8 | `presets.ts` |
| 9 | `widgets/_shared.tsx`, `widgets/_error-state.tsx`, `widgets/_haptic-pressable.tsx`, `widgets/_keyboard-aware-widget.tsx`, `widgets/_skeleton.tsx`, `widgets/_status-tones.tsx`, `widgets/_table.tsx`, `widgets/_widget-table-list.tsx`, NEW `widgets/_calendar-shared.tsx` |
| 10 | `widgets/task-table.tsx` |
| 11 | `widgets/item-table.tsx` |
| 12 | `widgets/borrow-table.tsx`, `widgets/ppe-delivery-table.tsx` |
| 13 | `widgets/installment-table.tsx`, `widgets/recent-messages.tsx`, `widgets/favorites.tsx` |
| 14 | `widgets/daily-ponto.tsx`, `widgets/time-entries.tsx`, `widgets/quick-note.tsx` |
| 15 | NEW `widgets/hr-calendar.tsx`, NEW `widgets/hr-requests-table.tsx` |
| 16 | NEW `widgets/production-calendar.tsx`, NEW `widgets/quick-budget.tsx` |

### 7.1 Files multiple agents touch — coordination rules

* **`widgets/index.ts`** — registration list.
  * Agents 15 & 16 each append a `widgetRegistry.register(...)` call
    and an import for their new widgets. Both edit only the imports +
    the `allWidgets` array. Conflicts will be trivial line-additions.
  * Agent 9 must NOT touch this file — its scope is the `_*.tsx`
    helpers only.
  * Agent 16's `quickBudgetWidget` is registered but **NOT pushed to
    `allWidgets`** initially (mirrors web's commented-out line at
    `web/src/dashboard/widgets/index.ts:18`). The user re-enables it
    when the redesign is signed off.

* **`types.ts`, `registry.ts`, `schemas.ts`, `index.ts`** — locked by
  agent 1. Other agents that need a new shared type or barrel export
  list it in their final report; agent 1 lands the change in a
  follow-up turn.

### 7.2 Cross-cutting coordination

* If two agents need the same new helper (e.g., a date-formatter, a
  shared row component), they put it in `widgets/_shared.tsx` and
  agent 9 owns the merge resolution. Agents 10–16 can ADD to
  `_shared.tsx` for their use, but cannot REMOVE existing symbols.
* If a widget needs a new theme color or extended-color, agent 1 lands
  it in `mobile/src/lib/theme/extended-colors.ts`. Do NOT add ad-hoc
  hexes inside widget files (the task-table file currently has a few;
  those will be cleaned up when agent 10 lands its changes).

---

## 8. Acceptance criteria for the rewrite (visible to user)

The user has called the current state "trash and incomplete". A successful
rewrite must demonstrate:

1. **Edit toolbar** is visible and functional (not just long-press
   discovery).
2. **Add-widget sheet** opens via the toolbar Add button, lists every
   registered widget with the proper accent stripe + tinted icon tile +
   description.
3. **Configure modal** for ANY widget shows: Tamanho card, Configurações
   card, Ações card with destructive Remover button. Footer Restaurar /
   Cancelar / Aplicar present.
4. **Size sheet** is reachable from the per-tile pill (1 tap, not 4).
5. **Per-widget config parity:** every config field listed in §6 is
   addable/editable on mobile UNLESS explicitly carved out as
   "out of scope on mobile" in this spec.
6. **All four NEW widgets** (hr-calendar, hr-requests-table,
   production-calendar, quick-budget) render and configure end-to-end.
7. **Drag-to-reorder** keeps the tile lifted, springs siblings, snaps
   to row breaks. No dropped frames at 60fps on a mid-tier Android.
8. **Empty / error / skeleton** states are consistent across every
   widget — same message tone, same primitives.
9. **Theme parity:** every color is sourced from `useTheme().colors`
   (or `extendedColors`/`badgeColors`) — `grep` reveals zero raw hexes
   in widget bodies (acceptable in `widget-accent.tsx`'s palette tables
   and the validation-error inline style).

---

*End of spec. Length is intentional — it's the contract.*
