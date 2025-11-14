- Mobile App List System Migration - Continue Session

  ## Context
  You are continuing a migration project for a React Native mobile app. The goal is to migrate ALL list pages from legacy boilerplate code (300-500 lines each) to a clean configuration-driven architecture using a single `Layout`
  component (6 lines per page).

  ## Architecture Overview
  - **Pattern**: Each list page uses `<Layout config={configObject} />` (6 lines)
  - **Configuration**: Type-safe configs in `src/config/list/{module}/{entity}.ts` (~200-400 lines)
  - **Components**: Single `Layout` component that handles search, table, filters, export, bulk actions
  - **Hooks**: Each config references a `useXXXInfiniteMobile` hook for data fetching

  ## Critical Rules - READ CAREFULLY

  ### 1. ALWAYS Verify Enums from Codebase
  **DO NOT INVENT enum values!** Always search the actual codebase first:
  ```bash
  # Find the actual enum
  grep "export enum ENTITY_STATUS" src/constants/enums.ts -A 10

  # Find the actual labels
  grep "ENTITY_STATUS_LABELS" src/constants/enum-labels.ts -A 10

  2. ALWAYS Verify Hook Names

  Check that hooks exist before using them:
  grep "export function useEntitiesInfiniteMobile" src/hooks/*.ts

  3. Follow Existing Patterns

  Look at completed configs for reference:
  - src/config/list/hr/ppe-deliveries.ts
  - src/config/list/inventory/maintenance.ts
  - src/config/list/production/cuts.ts

  What Has Been Completed (32/49+ pages)

  ✅ Fully Migrated Modules

  1. HR Module (9/9 - 100%)
    - Employees, Warnings, Vacations, Positions
    - PPE Deliveries, PPE Schedules, PPE Sizes, PPE Items
    - Holidays
  2. Inventory Module (10/10 - 100%)
    - Items, Orders, Borrows, Activities
    - External Withdrawals, Suppliers, Categories, Brands
    - Maintenance, Order Schedules

  ✅ Partially Migrated Modules

  3. Administration Module (5/8 - 63%)
    - ✅ Customers, Sectors, Notifications, Collaborators, Change Logs
    - ❌ Files, Backups, Deployments (need to check hooks)
  4. Production Module (6/? - In Progress)
    - ✅ Tasks, Airbrushing, Services, Paints, Observations, Cuts
    - ❌ Service Orders, Cutting Plans, Paint Applications, etc.
  5. Painting Module (2/? - Started)
    - ✅ Catalog, Paint Types
    - ❌ Formulas, Paint Brands, Productions
  6. My Team Module (1/? - Started)
    - ✅ Team Members
    - ❌ Other team pages
  7. Personal Module (1/? - Started)
    - ✅ Personal Employees

  Standard Migration Workflow

  Step 1: Identify Page to Migrate

  # Find list pages
  ls src/app/(tabs)/{module}/**/listar.tsx

  Step 2: Verify Hook Exists

  grep "useEntitiesInfiniteMobile" src/hooks/*.ts
  If no hook exists, SKIP this page (save for complex cases).

  Step 3: Research the Entity

  # Find entity interface
  grep "export interface Entity extends BaseEntity" src/types/*.ts -A 15

  # Find enums
  grep "ENTITY_STATUS\|ENTITY_TYPE" src/constants/enums.ts -A 10

  # Find enum labels (CRITICAL!)
  grep "ENTITY_STATUS_LABELS\|ENTITY_TYPE_LABELS" src/constants/enum-labels.ts -A 10

  Step 4: Create Config File

  Location: src/config/list/{module}/{entity-name}.ts

  Template:
  import type { ListConfig } from '@/components/list/types'
  import type { Entity } from '@/types'
  import { ENTITY_STATUS } from '@/constants/enums'

  // COPY labels from actual codebase - DO NOT INVENT!
  const STATUS_LABELS: Record<string, string> = {
    // Copy from enum-labels.ts
  }

  export const entitiesListConfig: ListConfig<Entity> = {
    key: 'module-entities',
    title: 'Entities Title',

    query: {
      hook: 'useEntitiesInfiniteMobile', // Verify this exists!
      defaultSort: { field: 'createdAt', direction: 'desc' },
      pageSize: 25,
      include: {
        // Related entities
      },
    },

    table: {
      columns: [
        // 3-8 columns typically
        // Standard widths: 0.8 (icons), 1.0 (codes), 1.2 (dates/status),
        //                  1.5 (names), 2.0 (descriptions), 2.5 (long text)
      ],
      defaultVisible: ['col1', 'col2', 'col3', 'col4'], // 3-4 columns
      rowHeight: 60,
      actions: [
        { key: 'view', label: 'Ver', icon: 'eye', variant: 'default', onPress: ... },
        { key: 'edit', label: 'Editar', icon: 'pencil', variant: 'default', onPress: ... },
        { key: 'delete', label: 'Excluir', icon: 'trash', variant: 'destructive', confirm: {...}, onPress: ... },
      ],
    },

    filters: {
      sections: [
        // Status, entities, dates, etc.
      ],
    },

    search: {
      placeholder: 'Buscar...',
      debounce: 300,
    },

    export: {
      title: 'Export Title',
      filename: 'export-filename',
      formats: ['csv', 'json', 'pdf'],
      columns: [
        // Mirror table columns
      ],
    },

    actions: {
      create: {
        label: 'Create Label',
        route: '/path/to/create',
      },
      bulk: [
        // Bulk actions (activate, deactivate, delete, etc.)
      ],
    },
  }

  Step 5: Migrate Page File

  Replace entire page content with:
  import { Layout } from '@/components/list/Layout'
  import { entitiesListConfig } from '@/config/list/{module}/{entity}'

  export default function EntityListScreen() {
    return <Layout config={entitiesListConfig} />
  }

  Step 6: Update Module Index

  Add export to src/config/list/{module}/index.ts:
  export { entitiesListConfig } from './{entity}'

  Remaining Pages to Migrate

  Priority 1 - Simple Pages with Hooks

  Check these first (have InfiniteMobile hooks):
  - Files (useFilesInfiniteMobile)
  - Trucks (useTrucksInfiniteMobile)
  - Garages (useGaragesInfiniteMobile)

  Priority 2 - Complex Cases (Save for Last)

  These use older hook patterns, need special handling:
  - Backups, Deployments
  - Paint Formulas, Paint Brands
  - Pages without InfiniteMobile hooks

  Verification Checklist

  After creating each config, verify:
  - Hook name exists in codebase
  - Enum values are ACTUAL values from enums.ts (not invented!)
  - Enum labels match enum-labels.ts exactly
  - Entity interface exists and fields are correct
  - Page file is 6 lines using Layout component
  - Module index.ts exports the new config

  How to Continue

  1. Start with verification: Run through remaining pages and identify which have proper hooks
  2. Batch similar pages: Do all pages for one module at a time
  3. Verify as you go: Check enums and hooks for EACH page before creating config
  4. Update todos: Use TodoWrite tool to track progress
  5. Test periodically: Every 5-10 pages, verify no mistakes were made

  Progress Tracking

  Use TodoWrite tool with format:
  [
    {content: "Module X - Page Y", status: "in_progress", activeForm: "Creating config"},
    {content: "Module X - Page Z", status: "pending", activeForm: "Creating config"},
  ]

  Files Changed So Far

  Total: ~44 files created/modified
  - 32 config files in src/config/list/
  - 32 page files migrated
  - 7 module index.ts files updated

  Expected Final Count

  Target: ~49 pages total (need to confirm exact count)
  Current: 32/49 (65%)
  Remaining: ~17 pages

  START by identifying which remaining pages have proper InfiniteMobile hooks, then migrate them following the exact workflow above. Remember: VERIFY ENUMS FIRST, DO NOT INVENT VALUES!
  ``` run 8 subagents for this task
- Mobile App List System Migration - Continue Session

  ## Context
  You are continuing a migration project for a React Native mobile app. The goal is to migrate ALL list pages from legacy boilerplate code (300-500 lines each) to a clean configuration-driven architecture using a single `Layout`
  component (6 lines per page).

  ## Architecture Overview
  - **Pattern**: Each list page uses `<Layout config={configObject} />` (6 lines)
  - **Configuration**: Type-safe configs in `src/config/list/{module}/{entity}.ts` (~200-400 lines)
  - **Components**: Single `Layout` component that handles search, table, filters, export, bulk actions
  - **Hooks**: Each config references a `useXXXInfiniteMobile` hook for data fetching

  ## Critical Rules - READ CAREFULLY

  ### 1. ALWAYS Verify Enums from Codebase
  **DO NOT INVENT enum values!** Always search the actual codebase first:
  ```bash
  # Find the actual enum
  grep "export enum ENTITY_STATUS" src/constants/enums.ts -A 10

  # Find the actual labels
  grep "ENTITY_STATUS_LABELS" src/constants/enum-labels.ts -A 10

  2. ALWAYS Verify Hook Names

  Check that hooks exist before using them:
  grep "export function useEntitiesInfiniteMobile" src/hooks/*.ts

  3. Follow Existing Patterns

  Look at completed configs for reference:
  - src/config/list/hr/ppe-deliveries.ts
  - src/config/list/inventory/maintenance.ts
  - src/config/list/production/cuts.ts

  What Has Been Completed (32/49+ pages)

  ✅ Fully Migrated Modules

  1. HR Module (9/9 - 100%)
    - Employees, Warnings, Vacations, Positions
    - PPE Deliveries, PPE Schedules, PPE Sizes, PPE Items
    - Holidays
  2. Inventory Module (10/10 - 100%)
    - Items, Orders, Borrows, Activities
    - External Withdrawals, Suppliers, Categories, Brands
    - Maintenance, Order Schedules

  ✅ Partially Migrated Modules

  3. Administration Module (5/8 - 63%)
    - ✅ Customers, Sectors, Notifications, Collaborators, Change Logs
    - ❌ Files, Backups, Deployments (need to check hooks)
  4. Production Module (6/? - In Progress)
    - ✅ Tasks, Airbrushing, Services, Paints, Observations, Cuts
    - ❌ Service Orders, Cutting Plans, Paint Applications, etc.
  5. Painting Module (2/? - Started)
    - ✅ Catalog, Paint Types
    - ❌ Formulas, Paint Brands, Productions
  6. My Team Module (1/? - Started)
    - ✅ Team Members
    - ❌ Other team pages
  7. Personal Module (1/? - Started)
    - ✅ Personal Employees

  Standard Migration Workflow

  Step 1: Identify Page to Migrate

  # Find list pages
  ls src/app/(tabs)/{module}/**/listar.tsx

  Step 2: Verify Hook Exists

  grep "useEntitiesInfiniteMobile" src/hooks/*.ts
  If no hook exists, SKIP this page (save for complex cases).

  Step 3: Research the Entity

  # Find entity interface
  grep "export interface Entity extends BaseEntity" src/types/*.ts -A 15

  # Find enums
  grep "ENTITY_STATUS\|ENTITY_TYPE" src/constants/enums.ts -A 10

  # Find enum labels (CRITICAL!)
  grep "ENTITY_STATUS_LABELS\|ENTITY_TYPE_LABELS" src/constants/enum-labels.ts -A 10

  Step 4: Create Config File

  Location: src/config/list/{module}/{entity-name}.ts

  Template:
  import type { ListConfig } from '@/components/list/types'
  import type { Entity } from '@/types'
  import { ENTITY_STATUS } from '@/constants/enums'

  // COPY labels from actual codebase - DO NOT INVENT!
  const STATUS_LABELS: Record<string, string> = {
    // Copy from enum-labels.ts
  }

  export const entitiesListConfig: ListConfig<Entity> = {
    key: 'module-entities',
    title: 'Entities Title',

    query: {
      hook: 'useEntitiesInfiniteMobile', // Verify this exists!
      defaultSort: { field: 'createdAt', direction: 'desc' },
      pageSize: 25,
      include: {
        // Related entities
      },
    },

    table: {
      columns: [
        // 3-8 columns typically
        // Standard widths: 0.8 (icons), 1.0 (codes), 1.2 (dates/status),
        //                  1.5 (names), 2.0 (descriptions), 2.5 (long text)
      ],
      defaultVisible: ['col1', 'col2', 'col3', 'col4'], // 3-4 columns
      rowHeight: 60,
      actions: [
        { key: 'view', label: 'Ver', icon: 'eye', variant: 'default', onPress: ... },
        { key: 'edit', label: 'Editar', icon: 'pencil', variant: 'default', onPress: ... },
        { key: 'delete', label: 'Excluir', icon: 'trash', variant: 'destructive', confirm: {...}, onPress: ... },
      ],
    },

    filters: {
      sections: [
        // Status, entities, dates, etc.
      ],
    },

    search: {
      placeholder: 'Buscar...',
      debounce: 300,
    },

    export: {
      title: 'Export Title',
      filename: 'export-filename',
      formats: ['csv', 'json', 'pdf'],
      columns: [
        // Mirror table columns
      ],
    },

    actions: {
      create: {
        label: 'Create Label',
        route: '/path/to/create',
      },
      bulk: [
        // Bulk actions (activate, deactivate, delete, etc.)
      ],
    },
  }

  Step 5: Migrate Page File

  Replace entire page content with:
  import { Layout } from '@/components/list/Layout'
  import { entitiesListConfig } from '@/config/list/{module}/{entity}'

  export default function EntityListScreen() {
    return <Layout config={entitiesListConfig} />
  }

  Step 6: Update Module Index

  Add export to src/config/list/{module}/index.ts:
  export { entitiesListConfig } from './{entity}'

  Remaining Pages to Migrate

  Priority 1 - Simple Pages with Hooks

  Check these first (have InfiniteMobile hooks):
  - Files (useFilesInfiniteMobile)
  - Trucks (useTrucksInfiniteMobile)
  - Garages (useGaragesInfiniteMobile)

  Priority 2 - Complex Cases (Save for Last)

  These use older hook patterns, need special handling:
  - Backups, Deployments
  - Paint Formulas, Paint Brands
  - Pages without InfiniteMobile hooks

  Verification Checklist

  After creating each config, verify:
  - Hook name exists in codebase
  - Enum values are ACTUAL values from enums.ts (not invented!)
  - Enum labels match enum-labels.ts exactly
  - Entity interface exists and fields are correct
  - Page file is 6 lines using Layout component
  - Module index.ts exports the new config

  How to Continue

  1. Start with verification: Run through remaining pages and identify which have proper hooks
  2. Batch similar pages: Do all pages for one module at a time
  3. Verify as you go: Check enums and hooks for EACH page before creating config
  4. Update todos: Use TodoWrite tool to track progress
  5. Test periodically: Every 5-10 pages, verify no mistakes were made

  Progress Tracking

  Use TodoWrite tool with format:
  [
    {content: "Module X - Page Y", status: "in_progress", activeForm: "Creating config"},
    {content: "Module X - Page Z", status: "pending", activeForm: "Creating config"},
  ]

  Files Changed So Far

  Total: ~44 files created/modified
  - 32 config files in src/config/list/
  - 32 page files migrated
  - 7 module index.ts files updated

  Expected Final Count

  Target: ~49 pages total (need to confirm exact count)
  Current: 32/49 (65%)
  Remaining: ~17 pages

  START by identifying which remaining pages have proper InfiniteMobile hooks, then migrate them following the exact workflow above. Remember: VERIFY ENUMS FIRST, DO NOT INVENT VALUES!
  ``` run 8 subagents for this task