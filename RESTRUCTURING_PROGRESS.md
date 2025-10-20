# Mobile App Restructuring Progress

## 🎯 Goal
Complete restructuring of mobile app to match web application structure, navigation, and naming conventions.

## ✅ COMPLETED (PHASE 1 - Partial)

### 1. Inventory: Activities → Movements ✅
- **Renamed** `/inventory/activities/` → `/inventory/movements/`
- **Updated** `src/constants/routes.ts` - removed activities entry
- **Updated** `src/app/(tabs)/inventory/movements/create.tsx` - navigation paths
- **Updated** `src/app/(tabs)/inventory/movements/list.tsx` - navigation paths
- **Status**: ✅ COMPLETE - matches web (`/estoque/movimentacoes`)

### 2. Administration: Employees → Collaborators ✅
- **Renamed** `/administration/employees/` → `/administration/collaborators/`
- **Renamed** `/administration/employees.tsx` → `/administration/collaborators.tsx`
- **Status**: ✅ COMPLETE - matches web (`/administracao/colaboradores`)

### 3. Server Domain Creation ✅
- **Created** `/src/app/(tabs)/server/` folder
- **Moved** `/administration/change-logs` → `/server/change-logs`
- **Moved** `/administration/server/*` → `/server/`
- **Moved** `/administration/deployments` → `/server/deployments`
- **Moved** `/administration/backups` → `/server/backups`
- **Status**: ✅ FILES MOVED - routes.ts needs update

---

## 🔄 IN PROGRESS

### 4. Update routes.ts for Server Domain
**Need to**:
- Remove `administration.backups`
- Remove `administration.changeLogs`
- Remove `administration.server`
- Add top-level `server` section with:
  - `server.backups`
  - `server.changeLogs`
  - `server.deployments`
  - `server.logs`
  - `server.maintenance`
  - `server.resources`
  - `server.services`
  - `server.sharedFolders`
  - `server.status`
  - `server.systemUsers`
  - `server.databaseSync`
  - `server.rateLimiting`

---

## ⏳ PENDING (PHASE 2-6)

### PHASE 2: Remove Deprecated Features

#### 1. Delete Commissions Module ❌
```bash
rm -rf src/app/(tabs)/administration/commissions
rm src/app/(tabs)/administration/commissions.tsx
# Update routes.ts: Remove administration.commissions
```
**Reason**: Commissions doesn't exist in web - it's a field on Task entity

#### 2. Delete Monitoring Module ❌
```bash
rm -rf src/app/(tabs)/administration/monitoring
rm src/app/(tabs)/administration/monitoring.tsx
# Update routes.ts: Remove administration.monitoring
```
**Reason**: No equivalent in web

#### 3. Clean Up Preferences ❌
**Decision needed**: Move to personal settings or delete entirely
- Current location: `/administration/preferences`
- Web location: No direct equivalent

---

### PHASE 3: Update Navigation Structure

#### Tasks:
1. **Update `src/constants/navigation.ts`**
   - Move changelog to server domain
   - Remove commissions menu item
   - Remove monitoring menu item
   - Fix privilege requirements to match web

2. **Create proper navigation menu structure**
   - Match web's NAVIGATION_MENU exactly
   - Ensure all Portuguese labels are correct
   - Verify icon mappings

---

### PHASE 4: Fix Page Headers & Titles

#### Current Problem:
Pages show route paths like "administration/sectors" instead of "Setores"

#### Solution:
1. **Create PageHeader component** (like web)
   - Variants: list, detail, form, batch
   - Props: title, icon, breadcrumbs, actions
   - Portuguese labels only

2. **Update all pages** to use proper headers:
   ```tsx
   <PageHeader
     title="Setores"  // NOT "administration/sectors"
     icon={IconBuildingSkyscraper}
     breadcrumbs={[
       { label: "Início", href: "/" },
       { label: "Administração" },
       { label: "Setores" }
     ]}
   />
   ```

3. **Add usePageTracker** for analytics

---

### PHASE 5: Sync Enums & Constants

#### Files to Sync:
1. `src/constants/enums.ts` - Copy from web
2. `src/constants/enum-labels.ts` - Copy from web
3. `src/constants/privileges.ts` - Ensure exact match with web

#### Key Items:
- SECTOR_PRIVILEGES (already mostly aligned)
- TASK_STATUS, ORDER_STATUS, etc.
- All Portuguese labels
- Badge color mappings

---

### PHASE 6: Update Imports & References

#### After all renames, need to update:
1. Component imports referencing old paths
2. Navigation references to activities → movements
3. API client references
4. Hook imports
5. Type imports
6. Any hardcoded route strings

---

## 📊 Overall Progress

- **PHASE 1**: 60% Complete (3/5 tasks done)
- **PHASE 2**: 0% Complete
- **PHASE 3**: 0% Complete
- **PHASE 4**: 0% Complete
- **PHASE 5**: 0% Complete
- **PHASE 6**: 0% Complete

**Total Progress**: ~10% Complete

---

## 🚨 Critical Next Steps

1. **Finish routes.ts update** - Move server-related routes to server section
2. **Delete deprecated modules** - commissions, monitoring
3. **Update navigation.ts** - Fix menu structure
4. **Implement PageHeader** - Fix page title display issue
5. **Update all imports** - After structural changes

---

## 📝 Notes

- All file moves preserve implementations
- No code logic changed, only organization
- Portuguese route paths maintained (`/administracao`, `/estoque`, etc.)
- Matches web structure from agents' analysis

---

## 🔗 Related Documents

- Web navigation analysis: agent output 1
- Web folder structure: agent output 2
- Web privilege system: agent output 3
- Comparison report: agent output 8
