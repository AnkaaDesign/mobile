# Implementation Tracker - Column Visibility Fix

**Last Updated:** November 2, 2025
**Status:** Not Started
**Progress:** 0/20 entities complete (0%)

---

## 📊 Overall Progress

```
Phase 1: Architecture Standardization  [ ] 0/20 (0%)
Phase 2: Generic Drawer Migration      [ ] 0/50 (0%)
Phase 3: Clean Up v2 Files             [ ] 0/8  (0%)
Phase 4: Barrel Exports                [ ] 0/20 (0%)
Phase 5: File Naming                   [ ] 0/20 (0%)
```

**Estimated Completion:** [Date TBD]

---

## 📝 Entity Implementation Checklist

### Production Entities

#### ✅ Task (cronograma)
**Priority:** HIGH | **Status:** ✅ COMPLETE | **By:** N/A | **Date:** Nov 2, 2025
- [x] Column manager exists
- [x] Page uses generic drawer
- [x] Imports from manager only
- [x] Table accepts visibleColumnKeys
- [x] Custom drawer deleted
- [x] v2 files deleted
- [x] Tested and verified
- [x] TypeScript compiles

**Notes:** Already migrated correctly. Use as reference for other entities.

---

#### ⬜ Service Order (ordens-de-servico)
**Priority:** HIGH | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted (service-order-column-visibility-drawer-v2.tsx)
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/production/service-order/list/column-visibility-manager.ts`
- Page: `src/app/(tabs)/producao/ordens-de-servico/listar.tsx`
- Delete: `src/components/production/service-order/list/service-order-column-visibility-drawer.tsx`
- Delete: `src/components/production/service-order/list/service-order-column-visibility-drawer-v2.tsx`

---

#### ⬜ Truck (caminhoes)
**Priority:** HIGH | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted (truck-column-visibility-drawer-v2.tsx)
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/production/truck/list/column-visibility-manager.ts`
- Page: `src/app/(tabs)/producao/caminhoes/listar.tsx`
- Delete: `src/components/production/truck/list/truck-column-visibility-drawer.tsx`
- Delete: `src/components/production/truck/list/truck-column-visibility-drawer-v2.tsx`

---

#### ⬜ Observation (observacoes)
**Priority:** HIGH | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/production/observation/list/column-visibility-manager.ts`
- Page: `src/app/(tabs)/producao/observacoes/listar.tsx`
- Delete: `src/components/production/observation/list/observation-column-visibility-drawer.tsx`

---

#### ⬜ Airbrushing (aerografia)
**Priority:** HIGH | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/production/airbrushing/list/column-visibility-manager.ts`
- Page: `src/app/(tabs)/producao/aerografia/listar.tsx`
- Delete: `src/components/production/airbrushing/list/airbrushing-column-visibility-drawer.tsx`

---

#### ⬜ Cutting Plan (plano-de-recorte)
**Priority:** MEDIUM | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/production/cutting/list/column-visibility-manager.ts`
- Page: `src/app/(tabs)/producao/recorte/plano-de-recorte/listar.tsx`
- Delete: `src/components/production/cutting/list/cutting-plan-column-visibility-drawer.tsx`

---

#### ⬜ Garage (garagens)
**Priority:** MEDIUM | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/production/garage/list/column-visibility-manager.ts`
- Page: `src/app/(tabs)/producao/garagens/listar.tsx`
- Delete: `src/components/production/garage/list/garage-column-visibility-drawer.tsx`

---

### Inventory Entities

#### ⬜ Item (produtos)
**Priority:** MEDIUM | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists (already exists)
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted (column-visibility-drawer-v2.tsx)
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/inventory/item/list/column-visibility-manager.ts` (exists)
- Page: `src/app/(tabs)/estoque/produtos/listar.tsx`
- Delete: `src/components/inventory/item/list/column-visibility-drawer.tsx`
- Delete: `src/components/inventory/item/list/column-visibility-drawer-v2.tsx`

---

#### ⬜ Order (pedidos)
**Priority:** MEDIUM | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists (already exists)
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted (order-column-visibility-drawer-v2.tsx)
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/inventory/order/list/column-visibility-manager.ts` (exists)
- Page: `src/app/(tabs)/estoque/pedidos/listar.tsx`
- Delete: `src/components/inventory/order/list/order-column-visibility-drawer.tsx`
- Delete: `src/components/inventory/order/list/order-column-visibility-drawer-v2.tsx`

---

#### ⬜ Supplier (fornecedores)
**Priority:** MEDIUM | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists (already exists)
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted (supplier-column-visibility-drawer-v2.tsx)
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/inventory/supplier/list/column-visibility-manager.ts` (exists)
- Page: `src/app/(tabs)/estoque/fornecedores/listar.tsx`
- Delete: `src/components/inventory/supplier/list/supplier-column-visibility-drawer.tsx`
- Delete: `src/components/inventory/supplier/list/supplier-column-visibility-drawer-v2.tsx`

---

#### ⬜ Borrow (emprestimos)
**Priority:** MEDIUM | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists (borrow-column-visibility-manager.tsx - check extension)
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/inventory/borrow/list/borrow-column-visibility-manager.tsx` (exists)
- Page: `src/app/(tabs)/estoque/emprestimos/listar.tsx`
- Delete: `src/components/inventory/borrow/list/borrow-column-visibility-drawer.tsx`

---

#### ⬜ Activity (movimentacoes)
**Priority:** MEDIUM | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists (column-visibility-manager.ts)
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted (multiple v2 files)
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/inventory/activity/list/column-visibility-manager.ts` (exists)
- Page: `src/app/(tabs)/estoque/movimentacoes/listar.tsx`
- Delete: `src/components/inventory/activity/list/activity-column-visibility-drawer.tsx`
- Delete: `src/components/inventory/activity/list/activity-column-visibility-drawer-v2.tsx`
- Delete: `src/components/inventory/activity/list/column-visibility-drawer.tsx`
- Delete: `src/components/inventory/activity/list/column-visibility-drawer-v2.tsx`

---

#### ⬜ PPE (epi)
**Priority:** MEDIUM | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/inventory/ppe/list/column-visibility-manager.ts`
- Page: `src/app/(tabs)/estoque/epi/listar.tsx`
- Delete: `src/components/inventory/ppe/list/ppe-column-visibility-drawer.tsx`

---

### Human Resources Entities

#### ⬜ Warning (advertencias)
**Priority:** LOW | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted (column-visibility-drawer-v2.tsx)
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/human-resources/warning/list/column-visibility-manager.ts`
- Page: `src/app/(tabs)/recursos-humanos/advertencias/listar.tsx`
- Delete: `src/components/human-resources/warning/list/column-visibility-drawer.tsx`
- Delete: `src/components/human-resources/warning/list/column-visibility-drawer-v2.tsx`

---

#### ⬜ Position (cargos)
**Priority:** LOW | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/human-resources/position/list/column-visibility-manager.ts`
- Page: `src/app/(tabs)/recursos-humanos/cargos/listar.tsx`
- Delete: (check if drawer exists)

---

### Administration Entities

#### ⬜ Customer (clientes)
**Priority:** LOW | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/administration/customer/list/column-visibility-manager.ts`
- Page: `src/app/(tabs)/administracao/clientes/listar.tsx`
- Delete: `src/components/administration/customer/list/customer-column-visibility-drawer.tsx`

---

#### ⬜ Employee (colaboradores)
**Priority:** LOW | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/administration/employee/list/column-visibility-manager.ts`
- Page: `src/app/(tabs)/administracao/colaboradores/listar.tsx`
- Delete: `src/components/administration/employee/list/employee-column-visibility-drawer.tsx`

---

#### ⬜ Sector (setores)
**Priority:** LOW | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/administration/sector/list/column-visibility-manager.ts`
- Page: `src/app/(tabs)/administracao/setores/listar.tsx`
- Delete: `src/components/administration/sector/list/sector-column-visibility-drawer.tsx`

---

#### ⬜ User (usuarios)
**Priority:** LOW | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/administration/user/list/column-visibility-manager.ts`
- Page: (find user list page)
- Delete: `src/components/administration/user/list/user-column-visibility-drawer.tsx`

---

### Painting Entities

#### ⬜ Paint Type (tipos-de-tinta)
**Priority:** LOW | **Status:** ⬜ NOT STARTED | **By:** ___ | **Date:** ___
- [ ] Column manager exists
- [ ] Page uses generic drawer
- [ ] Imports from manager only
- [ ] Table accepts visibleColumnKeys
- [ ] Custom drawer deleted
- [ ] v2 files deleted
- [ ] Tested and verified
- [ ] TypeScript compiles

**Files:**
- Manager: `src/components/painting/paint-type/list/column-visibility-manager.ts`
- Page: `src/app/(tabs)/pintura/tipos-de-tinta/listar.tsx`
- Delete: `src/components/painting/paint-type/list/paint-type-column-visibility-drawer.tsx`

---

## 🔍 Verification Checklist

Run these commands after completing all entities:

```bash
# 1. Check for duplicate getDefaultVisibleColumns exports
# Should return only manager files (20 total)
grep -r "export.*getDefaultVisibleColumns" src/components --include="*.ts" --include="*.tsx" | wc -l

# 2. Check for remaining custom drawers
# Should return 0
find src/components -name "*-column-visibility-drawer.tsx" | wc -l

# 3. Check for remaining v2 files
# Should return 0
find src/components -name "*-v2.tsx" | wc -l

# 4. TypeScript compilation
# Should pass with 0 errors
npm run type-check

# 5. Check for any remaining imports from drawer files
# Should return 0
grep -r "from.*column-visibility-drawer" src/app --include="*.tsx" | wc -l

# 6. Verify all pages use UtilityDrawerWrapper
grep -r "UtilityDrawerWrapper" src/app/(tabs) --include="listar.tsx" | wc -l
# Should match number of list pages
```

---

## 📊 Daily Progress Log

### [Date: ___]
**Worked By:** ___
**Entities Completed:** ___
**Time Spent:** ___ hours
**Issues Encountered:** ___
**Notes:** ___

---

### [Date: ___]
**Worked By:** ___
**Entities Completed:** ___
**Time Spent:** ___ hours
**Issues Encountered:** ___
**Notes:** ___

---

### [Date: ___]
**Worked By:** ___
**Entities Completed:** ___
**Time Spent:** ___ hours
**Issues Encountered:** ___
**Notes:** ___

---

## 🐛 Issues & Blockers

### Issue #1
**Entity:** ___
**Description:** ___
**Status:** ⬜ Open / 🔄 In Progress / ✅ Resolved
**Assigned To:** ___
**Resolution:** ___

---

## 📈 Metrics Tracking

| Date | Entities Complete | % Complete | Time Spent | Cumulative Time |
|------|------------------|------------|------------|-----------------|
| Nov 2 | 1 | 5% | 0h | 0h |
| ___ | ___ | ___% | ___h | ___h |
| ___ | ___ | ___% | ___h | ___h |

---

## ✅ Final Sign-off

- [ ] All 20 entities migrated
- [ ] All custom drawers deleted
- [ ] All v2 files deleted
- [ ] All verification checks pass
- [ ] TypeScript compiles without errors
- [ ] Manual testing complete
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Code review approved
- [ ] Merged to main branch

**Completed By:** ___
**Completion Date:** ___
**Final Notes:** ___

---

**Last Updated:** [Auto-update this date when tracking progress]
