# Navigation Alignment Strategy - Mobile to Web

## Current Situation Analysis

### Mobile Current State:
- **Physical Structure**: English folders (`/inventory`, `/administration`)
- **Navigation Config**: Mixed (some Portuguese paths, some English)
- **Navigation Flow**: Portuguese path → English conversion → File system
- **Complexity**: High - requires constant translation

### Web State:
- **Physical Structure**: Portuguese folders (`/estoque`, `/administracao`)
- **Navigation Config**: Portuguese paths throughout
- **Navigation Flow**: Direct Portuguese paths
- **Complexity**: Low - no translation needed

## Two Possible Approaches

### Approach 1: Full Migration (High Risk, Full Alignment)
- Rename all physical folders to Portuguese
- Update all imports and file references
- Remove translation layer completely
- **Pros**: Perfect alignment with web, simpler long-term
- **Cons**: Major breaking change, high risk of errors, time-consuming

### Approach 2: Incremental Alignment (Lower Risk, Gradual)
- Keep English folder structure (for now)
- Update navigation.ts to match web exactly (Portuguese paths)
- Enhance route-mapper.ts to handle all mappings correctly
- **Pros**: Lower risk, can be done incrementally, easier to rollback
- **Cons**: Maintains translation complexity

## Recommended Strategy: Hybrid Approach

### Phase 1: Navigation Configuration Alignment (Immediate)
1. Update `navigation.ts` to match web EXACTLY:
   - Use Portuguese paths everywhere
   - Match exact hierarchy and structure
   - Ensure privileges match
   - Remove any mobile-only items

2. Update route mappings:
   - Enhance `route-mapper.ts` with complete Portuguese-to-English mappings
   - Ensure all paths work correctly

3. Update screen registrations:
   - Fix `getScreensToRegister()` to handle current structure
   - Ensure all screens are registered

### Phase 2: Remove Unnecessary Features (Immediate)
- Remove folders not in web:
  - `/admin` (just backup)
  - `/dashboard` (different in web)
  - `/integrations` (not in main nav)
  - `/maintenance` standalone
  - `/profile` standalone
  - `/inventory/reports`
  - `/inventory/statistics`

### Phase 3: Add Missing Features (Next)
- Add modules from web not in mobile:
  - Financial module (`/financeiro`)
  - Statistics module (`/estatisticas`)

### Phase 4: Folder Migration (Future - Optional)
- Once everything works with mappings
- Plan careful migration to Portuguese folders
- Can be done module by module

## Immediate Action Items

### 1. Navigation.ts Updates Needed:

```typescript
// CURRENT MOBILE (Wrong)
path: "/administration/customers"
path: "/inventory/borrows"

// SHOULD BE (Like Web)
path: "/administracao/clientes"
path: "/estoque/emprestimos"
```

### 2. Route Mapper Updates:

```typescript
// Add complete mappings
"/administracao" -> "/administration"
"/administracao/clientes" -> "/administration/customers"
"/administracao/clientes/cadastrar" -> "/administration/customers/create"
"/administracao/clientes/detalhes/:id" -> "/administration/customers/details/:id"
"/administracao/clientes/editar/:id" -> "/administration/customers/edit/:id"
// ... etc for ALL routes
```

### 3. Screen Registration Updates:
- Use current English names but register all screens
- Ensure dynamic routes are handled

## Key Differences to Fix

### Path Patterns:
```
Web: /module/entity/action
- /estoque/emprestimos (list)
- /estoque/emprestimos/cadastrar (create)
- /estoque/emprestimos/detalhes/:id (details)
- /estoque/emprestimos/editar/:id (edit)

Mobile Current: Mixed patterns
- Some use /list suffix
- Some use /create in English
- Inconsistent
```

### Privilege System:
Ensure these match web exactly:
- `SECTOR_PRIVILEGES.ADMIN`
- `SECTOR_PRIVILEGES.WAREHOUSE`
- `SECTOR_PRIVILEGES.PRODUCTION`
- `SECTOR_PRIVILEGES.HUMAN_RESOURCES`
- `SECTOR_PRIVILEGES.LEADER`
- `SECTOR_PRIVILEGES.FINANCIAL`
- `SECTOR_PRIVILEGES.USER`
- `SECTOR_PRIVILEGES.EXTERNAL`
- `SECTOR_PRIVILEGES.MAINTENANCE`

## Benefits of This Approach

1. **Lower Risk**: No massive folder renaming
2. **Incremental**: Can be tested step by step
3. **Reversible**: Easy to rollback if issues
4. **Future-Ready**: Sets foundation for eventual full migration
5. **Maintains Functionality**: App keeps working during updates

## Success Criteria

✅ Navigation menu matches web exactly
✅ All routes work correctly
✅ Privileges work as in web
✅ No "unmatched route" errors
✅ User experience consistent with web
✅ Clean separation of concerns