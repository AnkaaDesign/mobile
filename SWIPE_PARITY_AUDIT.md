# Mobile Swipe Actions ↔ Web Right-Click Parity Audit

## ✅ APPLIED (2026-05-25) — scope: make already-implemented swipe actions work like web; do NOT add missing features

**Typecheck: `tsc --noEmit` passes with 0 errors.**

Fixed across ~40 list configs (inventory ×13, painting ×6, admin ×8, HR ×8, production/my-team ×10) plus `src/hooks/useSupplier.ts` and `src/config/list/production/tasks.ts`:
- **Bug #1 — mutations wiring**: added `mutationsHook` + `batchMutationsHook` to every config whose existing delete/status/bulk actions relied on the injected `context` mutations. Swipe Delete + bulk delete/activate/deactivate/status now actually fire.
- **Bug #1b — `batchUpdate` → `batchUpdateAsync`**: `useList` exposes only the async batch fns; converted all `batchUpdate?.()` calls (which silently no-op'd) and gave them the correct `{ <entities>: [{id,data}] }` shape (cut uses flat `cuts:[{id,...}]`).
- **Bug #2 — bulk payload keys**: replaced `{ ids }` with the schema-verified key per entity (itemIds, itemBrandIds, itemCategoryIds, activityIds, orderIds, orderScheduleIds, orderItemIds, externalWithdrawalIds, maintenanceIds, supplierIds, customerIds, userIds, sectorIds, notificationIds, fileIds, positionIds, warningIds, holidayIds, ppeDeliveryIds, ppeScheduleIds, ppeSizeIds, cutIds, airbrushingIds, observationIds, serviceOrderIds, taskIds, paintIds, paintTypeIds, paintBrandIds, paintFormulaIds, paintFormulaComponentIds, paintProductionIds, borrowIds). responsibles/deployments/messages legitimately use `ids`.
- **Bug #3 — `useSupplierMutations`/`BatchMutations` malformed**: now expose callable `deleteAsync`/`batchDeleteAsync` (additive; existing detail-screen consumer unaffected).
- **Permission gating**: added `canPerform` (canEdit*/canDelete*/canEditHrEntities/etc.) to existing edit/delete/status actions to match web visibility.
- **order-schedules routes**: `automaticos/*` → `agendamentos/*` (the screen that actually mounts the config).
- **Tasks (your named flows)**: added missing `quote` include (fixes the `price` column + Orçamento/Faturamento label & route) and the truck layout-id fields (fixes the truck-measures swipe label "Editar vs Adicionar Medidas"). Verified truck-measures screen, copy-from-task wizard, change-sector & add-artworks modals are wired and functional.

## ⏸ DEFERRED per your scope (mobile is missing these — NOT implemented)
- New status/lifecycle actions web has but mobile never had: orders fulfill/receive/cancel, user Efetivar/Demitir, notification Enviar, PPE approve/reject/revert, maintenance start/finish, airbrushing set-status, task set-status/duplicate/dar-entrada, order-schedule per-row activate/deactivate, item activate/deactivate & price-adjustment, customer merge, responsible toggle-active/password, position salary-adjustment.
- Entirely missing screens: Skills, Skill-Assessment, time-clock-entry, absence, topic, financial reconciliation.
- external-withdrawal liquidate/deliver (no mobile API method/mutation exists).

## ⚠️ Pre-existing broken EXISTING actions that need a screen/hook (can't fix without out-of-scope work)
- `administration/users.tsx` edit → `/administracao/usuarios/editar/[id]` route does not exist (no mobile user-edit screen).
- `painting/productions.tsx` edit → `/pintura/producoes/editar/[id]` does not exist AND web has no production edit → recommend REMOVING this action (broken extra).
- `production/cutting-plans.ts` edit/create → `recorte/editar` & `recorte/plano-de-recorte/cadastrar` don't exist.
- `administration/files.tsx` create → `/administracao/arquivos/enviar` doesn't exist; preview/download/share are console.log stubs.
- `administration/backups.tsx` bulk delete + `backup-schedules.ts` delete: no batch hook / `useBackupMutations` returns raw objects / needs `useList` context change.
- `tasks.ts` bulk `update-status`/`update-sector`: explicit placeholders (empty `data:{}`) needing a picker UI.
- `inventory/items.tsx` & `brands.ts` bulk "Editar em Lote": navigate to non-existent batch-edit routes / console.warn stub.



Date: 2026-05-25. Cross-referenced web context-menu actions against mobile swipe
actions across 8 domains (8 sub-agent deep dives).

## TL;DR — the headline finding is systemic, not cosmetic

The mobile list screens are **config-driven** (`src/config/list/**` + `src/components/list/Table/RowActions.tsx`),
**not** the `*-table-row-swipe.tsx` components (those are legacy/dead for the live
list screens; they survive only inside a few detail sub-tables). All real fixes
go in the **config files**.

`useList.ts:22-31,176-182` only builds the action `mutations` context
(`update`/`delete`/`batchUpdateAsync`/`batchDeleteAsync`) when a config declares
`query.mutationsHook` **and** `query.batchMutationsHook`. **Only 2 of ~37 configs
do** (`inventory/borrows.tsx`, `administration/messages.ts`).

Consequence across the whole app:
- **Swipe "Excluir" silently no-ops** wherever mutations aren't wired — the confirm
  dialog shows, the row closes, **nothing is deleted**.
- **Every bulk action** (bulk delete / activate / deactivate / status) silently
  no-ops for the same reason.
- Even where wired, several **bulk payloads use the wrong key** (`{ ids }` instead
  of the schema's `{ borrowIds }` / `{ orderIds }` / `{ customerIds }` / …), so they
  fail validation.

## Three systemic bugs

### Bug #1 (P0) — mutations hooks not wired → delete & bulk are no-ops
Fix: add `mutationsHook` + `batchMutationsHook` to each config's `query` block.
Verified hook→config map (all hooks exist and are barrel-exported from `@/hooks`;
all factory hooks expose callable `deleteAsync`/`updateAsync`/`batchDeleteAsync`):

| Config | mutationsHook | batchMutationsHook |
|---|---|---|
| administration/users.tsx | useUserMutations | useUserBatchMutations |
| administration/collaborators.tsx | useUserMutations | useUserBatchMutations |
| administration/customers.tsx | useCustomerMutations | useCustomerBatchMutations |
| administration/responsibles.tsx | useResponsibleMutations | useResponsibleBatchMutations |
| administration/sectors.tsx | useSectorMutations | useSectorBatchMutations |
| administration/notifications.ts | useNotificationMutations | useNotificationBatchMutations |
| administration/files.tsx | useFileMutations | useFileBatchMutations |
| administration/deployments.ts | useDeploymentMutations | useDeploymentBatchMutations |
| hr/employees.ts | useUserMutations | useUserBatchMutations |
| hr/positions.ts | usePositionMutations | usePositionBatchMutations |
| hr/warnings.ts | useWarningMutations | useWarningBatchMutations |
| hr/holidays.ts | useHolidayMutations | useHolidayBatchMutations |
| hr/ppe-items.ts | usePpeConfigMutations | usePpeConfigBatchMutations |
| hr/ppe-deliveries.ts | usePpeDeliveryMutations | usePpeDeliveryBatchMutations |
| hr/ppe-schedules.ts | usePpeDeliveryScheduleMutations | usePpeDeliveryScheduleBatchMutations |
| hr/ppe-sizes.ts | usePpeSizeMutations | usePpeSizeBatchMutations |
| inventory/items.tsx | useItemMutations | useItemBatchMutations |
| inventory/brands.ts | useItemBrandMutations | useItemBrandBatchMutations |
| inventory/categories.ts | useItemCategoryMutations | useItemCategoryBatchMutations |
| inventory/activities.tsx | useActivityMutations | useActivityBatchMutations |
| inventory/orders.ts | useOrderMutations | useOrderBatchMutations |
| inventory/order-schedules.ts | useOrderScheduleMutations | useOrderScheduleBatchMutations |
| inventory/order-items.ts | useOrderItemMutations | useOrderItemBatchMutations |
| inventory/external-withdrawals.ts | useExternalWithdrawalMutations | useExternalWithdrawalBatchMutations |
| inventory/maintenance.ts | useMaintenanceMutations | useMaintenanceBatchMutations |
| inventory/suppliers.tsx | useSupplierMutations* | useSupplierBatchMutations* |
| inventory/ppe-items.tsx | useItemMutations | useItemBatchMutations |
| inventory/ppe-schedules.ts | usePpeDeliveryScheduleMutations | usePpeDeliveryScheduleBatchMutations |
| inventory/ppe-deliveries.ts | usePpeDeliveryMutations | usePpeDeliveryBatchMutations |
| production/cuts.ts | useCutMutations | useCutBatchMutations |
| production/cutting-plans.ts | useCutMutations | useCutBatchMutations |
| production/airbrushing.ts | useAirbrushingMutations | useAirbrushingBatchMutations |
| production/observations.ts | useObservationMutations | useObservationBatchMutations |
| production/service-orders.ts | useServiceOrderMutations | useServiceOrderBatchMutations |
| production/paints.ts | usePaintMutations | usePaintBatchMutations |
| production/history*.ts | useTaskMutations | useTaskBatchMutations |
| painting/catalog.ts | usePaintMutations | usePaintBatchMutations |
| painting/paint-brands.ts | usePaintBrandMutations | usePaintBrandBatchMutations |
| painting/paint-types.ts | usePaintTypeMutations (verify export) | usePaintTypeBatchMutations (verify) |
| painting/formulas.ts | usePaintFormulaMutations | usePaintFormulaBatchMutations |
| painting/formula-components.ts | usePaintFormulaComponentMutations | usePaintFormulaComponentBatchMutations |
| painting/productions.tsx | usePaintProductionMutations | usePaintProductionBatchMutations |

\* `useSupplierMutations`/`useSupplierBatchMutations` are **malformed** (return raw
mutation objects / uncalled hook refs, not callable `deleteAsync`). Must fix the hook
shape in `src/hooks/useSupplier.ts` before/at wiring, or they'll throw.

### Bug #2 (P0) — wrong bulk payload keys (fail schema validation)
- borrows.tsx → `{ borrowIds }` (currently `{ ids }`)
- orders.ts → `{ orderIds }`
- order-schedules.ts → delete `{ orderScheduleIds }`; update `{ orderSchedules: [{id,data}] }`
- external-withdrawals.ts → `{ externalWithdrawalIds }`
- customers.tsx → `{ customerIds }`
- suppliers.tsx → `{ supplierIds }`
- responsibles.tsx → `{ ids }` (already correct)

### Bug #3 (P1) — no `canPerform` permission gating on swipe edit/delete
Web hides Edit/Delete behind `canEdit*`/`canDelete*`. Mobile configs set no
`canPerform`, so any user sees them (API would still reject, but UI parity is off and
it's a UX/authorization-surface gap). Add `canPerform` to edit/delete (and status)
actions in every config. All helpers exist in `utils/permissions/entity-permissions.ts`.

## Per-domain missing actions (beyond the systemic bugs)

### Production — Tasks
- ❌ Set Status (ADMIN) — missing on live path (only in dead legacy components)
- ❌ Duplicate / Criar Cópias (ADMIN/COMMERCIAL) — missing
- ❌ Dar Entrada (ADMIN/LOGISTIC/PM) — missing
- ❌ "Disponibilizar para produção" (PREPARATION→WAITING) — missing
- ⚠️ Liberar / Cancel / Start narrower than web (mobile excludes LOGISTIC/PM, or non-leader ADMIN)
- ⚠️ Quote: cronograma config lacks `quote` include → wrong label/route; route ignores COMPLETED condition
- ❌ Admin detail task tables (customer/sector/user/bonus) pass `enableSwipeActions={false}` → no actions vs web's full menu
- ⚠️ Advanced ops (base files/paints/cut plan/service order) not on mobile swipe

### Production — Cut / Airbrushing / Observation / Garage
- ❌ Airbrushing "Alterar status" (SetStatusModal) — missing (needs a status-picker UI)
- ⚠️ Airbrushing edit hidden for COMPLETED/CANCELLED (web shows always)
- ❌ Garage "Remover do pátio" (spot→null) — no mobile gesture
- ⚠️ Cut start/complete add a confirm + WAREHOUSE/ADMIN gating web lacks

### Inventory — Items / Brands / Categories
- ❌ Item Activate/Deactivate (per-row) and Price Adjustment — missing
- ❌ Brand bulk-edit routes to non-existent `marcas/editar-em-lote`
- ⚠️ Item bulk-edit is a `console.warn` stub

### Inventory — Orders / Order-schedule / External-withdrawal
- ❌ Orders: mark fulfilled / received / cancel (status machine) — all missing (infra exists via `update`)
- ❌ Order-schedule: per-row activate/deactivate — missing (bulk only); verify edit/view route uses `agendamentos` not `automaticos`
- ❌ External-withdrawal: return / charge — missing (status mutations exist but `useList` doesn't expose them → small framework change)
- ❌ External-withdrawal: liquidate / deliver — **need new API methods + mutations** (don't exist on mobile)

### Inventory — Borrow / PPE / Maintenance / Activity
- ❌ PPE delivery: approve / reject / revert / delete row actions — missing
- ❌ Maintenance: per-row start/finish — missing; finish should use the dedicated endpoint (creates next schedule), not a plain status update
- ⚠️ PPE delivery / borrow edit over-restricted by status vs web
- ❓ Maintenance-schedule and PPE-delivery-schedule mobile list configs may be missing entirely (follow-up)

### Suppliers / Customers
- ❌ Customer "Mesclar" (merge) — missing (needs merge UI)
- ❌ Responsible "Ativar/Desativar" (service exists) and "Alterar Senha" (no mobile route) — missing

### Admin & HR
- ❌ Users/Employees: Efetivar / Demitir status actions — missing (infra via `update`)
- ❌ Notifications: "Enviar" (send) — missing (`sendNotification` exists)
- ❌ Positions: "Aplicar Reajuste" (salary adjustment) — missing (needs modal)
- ❌ Skills + Skill-Assessment: **entire screens absent on mobile** (net-new features)

## Suggested execution order
1. **P0 systemic**: wire mutations (Bug #1) + fix bulk payload keys (Bug #2) + fix `useSupplier*` hook shape. Makes delete/bulk work app-wide.
2. **P1 permission gating** (Bug #3): add `canPerform` to edit/delete/status actions.
3. **P1 config-only missing actions**: orders status, order-schedule activate/deactivate, PPE delivery/maintenance/user status actions, notifications send, item activate/deactivate. (No new infra — just config + existing `update`.)
4. **P2 needs infra**: external-withdrawal liquidate/deliver mutations; external-withdrawal status mutations exposed via `useList`; airbrushing/positions modals; task set-status/duplicate/dar-entrada; admin detail task tables.
5. **P3 net-new**: Skills / Skill-Assessment screens; Garage remove-from-yard; customer merge; responsible password.
