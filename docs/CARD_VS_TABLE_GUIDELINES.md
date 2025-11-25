# Card vs Table UI Guidelines

**Date:** November 24, 2025
**Purpose:** Document when to use card-based vs table-based layouts for lists and data displays

---

## Table of Contents

1. [Overview](#overview)
2. [Card-Based Lists](#card-based-lists)
3. [Table-Based Lists](#table-based-lists)
4. [Decision Matrix](#decision-matrix)
5. [Implementation Examples](#implementation-examples)
6. [Mobile vs Tablet Considerations](#mobile-vs-tablet-considerations)
7. [Migration Patterns](#migration-patterns)

---

## Overview

The application uses two primary patterns for displaying lists of data:
1. **Card-Based Lists** - Visual, content-rich displays
2. **Table-Based Lists** - Data-dense, structured displays

Choosing the right pattern impacts user experience, performance, and maintainability.

---

## Card-Based Lists

### When to Use Cards

Use card-based layouts when:

1. **Visual Content is Primary**
   - Items have images/colors (paint catalog, customer logos)
   - Visual preview adds value (paint effects, file thumbnails)
   - Content is more important than data comparison

2. **Content is Rich and Varied**
   - Multiple sections per item
   - Mixed content types (text, images, badges, counts)
   - Hierarchical information
   - Tags and metadata

3. **Mobile-First Experience**
   - Primarily used on phones
   - Touch interactions are primary
   - Vertical scrolling is natural

4. **Browsing Over Comparing**
   - Users browse through items
   - Selection based on visual recognition
   - Not comparing multiple data points

### Card Layout Characteristics

```
┌─────────────────────────────┐
│  ┌───────────────────────┐  │
│  │   Visual Preview      │  │ ← Image/Color/Icon
│  │   (Image/Color)       │  │
│  └───────────────────────┘  │
│                             │
│  Item Name (Large)          │ ← Primary text
│                             │
│  [Badge] [Badge] [Badge]    │ ← Metadata
│                             │
│  Additional Info            │ ← Secondary info
│  Counts and stats           │
└─────────────────────────────┘
```

**Layout Features:**
- Generous padding (16px)
- Visual hierarchy
- Multiple sections
- Flexible height
- Touch-optimized
- Image-first

### Examples of Card-Based Lists

#### 1. Paint Catalog

**File:** `/home/kennedy/Documents/repositories/mobile/src/app/(tabs)/pintura/catalogo/listar.tsx`

**Why Cards:**
- Color preview is essential
- Paint effects (metallic, pearl, flake) need visual display
- Multiple attributes (type, brand, finish, manufacturer, tags)
- Formula and task counts
- Browsing-focused (users recognize paints by color)
- Long-press context menu for actions

**Card Structure:**
```
┌─────────────────────────────┐
│  ┌───────────────────────┐  │
│  │   Paint Color Preview │  │ ← 128px height
│  │   with Effects        │  │   Shows metallic/pearl/flake
│  │   [CODE]              │  │   Code overlay on preview
│  └───────────────────────┘  │
│                             │
│  Paint Name                 │ ← 16px font, semibold
│                             │
│  [Type] [Finish] [Brand]    │ ← Neutral badges
│  [Manufacturer]             │
│                             │
│  [Tags scroll horizontally] │ ← Inverted badges
│                             │
│  ┌─────────────┬─────────┐  │
│  │ 3 formulas  │ 5 tasks │  │ ← Counts with icons
│  └─────────────┴─────────┘  │
└─────────────────────────────┘
```

**Key Features:**
- Visual paint rendering with shader effects
- Adaptive code overlay (light/dark based on color)
- Scrollable tags
- Color similarity search
- Palette-based sorting

#### 2. File Gallery

**File:** `/home/kennedy/Documents/repositories/mobile/src/app/(tabs)/administracao/arquivos/listar.tsx`

**Why Cards:**
- File thumbnails/previews
- Multiple file types (PDF, images, documents)
- Metadata (size, date, uploader)
- Visual recognition (thumbnails)
- Gallery-style browsing

**Card Structure:**
```
┌─────────────────────────────┐
│  ┌───────────────────────┐  │
│  │   File Thumbnail      │  │ ← Preview image
│  │   or Icon             │  │
│  └───────────────────────┘  │
│                             │
│  filename.pdf               │ ← File name
│  [PDF] 2.4 MB               │ ← Type and size
│  Uploaded by: User Name     │
│  Nov 24, 2025               │
└─────────────────────────────┘
```

#### 3. Dashboard Cards

**Examples:**
- `/home/kennedy/Documents/repositories/mobile/src/app/(tabs)/inicio.tsx` (Home)
- `/home/kennedy/Documents/repositories/mobile/src/app/(tabs)/administracao/index.tsx` (Admin)
- `/home/kennedy/Documents/repositories/mobile/src/app/(tabs)/estoque/index.tsx` (Inventory)

**Why Cards:**
- Quick navigation
- Icon-based recognition
- Counts and stats
- Mixed content (routes, stats, alerts)
- Visual hierarchy

---

## Table-Based Lists

### When to Use Tables

Use table-based layouts when:

1. **Data is Structured and Dense**
   - Multiple comparable attributes
   - Consistent data types across items
   - Numerical data, dates, codes
   - Users need to scan and compare

2. **Many Columns Required**
   - 5+ attributes per item
   - Users need different column combinations
   - Column visibility control is valuable

3. **Sorting and Filtering Critical**
   - Users sort by different columns
   - Multi-column sorting needed
   - Complex filtering

4. **Desktop/Tablet Experience**
   - Primarily used on larger screens
   - Keyboard navigation
   - Multiple selections
   - Bulk operations

5. **Data Entry and Management**
   - Admin/management interfaces
   - Data verification workflows
   - Inventory management
   - Transaction logs

### Table Layout Characteristics

```
┌─────────────────────────────────────────────────┐
│ [#] CODE   NAME        BRAND    STOCK    PRICE │ ← Headers (sortable)
├─────────────────────────────────────────────────┤
│ [✓] ABC123 Item Name   Acme     150      $10.00│ ← Compact rows
│ [ ] XYZ789 Other Item  Brand    50       $25.00│
│ [✓] DEF456 Third Item  Corp     200      $5.00 │
└─────────────────────────────────────────────────┘
         ↑        ↑         ↑        ↑        ↑
     Checkbox  Data    Data     Data     Data
```

**Layout Features:**
- Compact rows (48-72px height)
- Aligned columns
- Sortable headers
- Column visibility
- Bulk selection
- Efficient scrolling

### Examples of Table-Based Lists

#### 1. Product List (Inventory Items)

**File:** `/home/kennedy/Documents/repositories/mobile/src/app/(tabs)/estoque/produtos/listar.tsx`

**Config:** `/home/kennedy/Documents/repositories/mobile/src/config/list/inventory/items.ts`

**Why Tables:**
- 15+ columns (code, name, brand, category, measures, quantity, consumption, price, total, CA, barcodes, max, reorder point, ICMS, IPI, supplier, PPE type, assignment, lead time, status, activities, dates)
- Need to compare stock levels, prices, consumption
- Column visibility control essential (default: code, name, quantity)
- Sorting by any column
- Stock level indicators
- Data-heavy management interface
- Bulk operations (delete multiple items)

**Default Visible Columns:**
- Code (uniCode)
- Name
- Quantity (with stock level indicator)

**Hidden by Default:** Brand, Category, Measures, Prices, Supplier, Dates, etc.

**Users can customize** which columns to show based on their workflow.

#### 2. Customer List

**File:** `/home/kennedy/Documents/repositories/mobile/src/app/(tabs)/administracao/clientes/listar.tsx`

**Config:** `/home/kennedy/Documents/repositories/mobile/src/config/list/administration/customers.tsx`

**Why Tables:**
- 12+ columns (fantasy name, legal name, CNPJ, email, phone, city, state, status, tags, economic activity, dates, task count)
- Mixed data types (text, formatted numbers, dates, badges)
- Logo/avatar display in table cell
- Need to compare multiple customers
- Business data management
- Column customization valuable
- Bulk operations

**Default Visible Columns:**
- Fantasy Name (with logo/avatar)
- CNPJ/CPF
- Task Count

**Special Features:**
- Logo images in table cells
- Phone count badges (+2)
- Tag count badges
- Custom cell rendering

#### 3. Employee List

**Why Tables:**
- Personnel data (name, position, sector, email, phone)
- Status indicators
- Hire dates
- Salary information
- Department comparison
- Bulk selection for operations

#### 4. Time Clock Records

**Why Tables:**
- Date and time data
- Clock in/out pairs
- Duration calculations
- Status indicators
- Need to scan chronologically
- Data verification workflow

---

## Decision Matrix

Use this matrix to quickly decide which pattern to use:

| Criteria | Card | Table |
|----------|------|-------|
| **Primary Content** | Visual (images, colors) | Data (text, numbers) |
| **Number of Attributes** | 3-8 attributes | 5-20+ attributes |
| **Data Density** | Low to Medium | Medium to High |
| **Visual Hierarchy** | Important | Less important |
| **Comparison Needs** | Low | High |
| **Sorting Needs** | Limited | Extensive |
| **Column Visibility** | N/A | Important |
| **Mobile Optimization** | Excellent | Good |
| **Tablet Optimization** | Good | Excellent |
| **Touch Interactions** | Primary | Secondary |
| **Keyboard Navigation** | Secondary | Primary |
| **Bulk Operations** | Rare | Common |
| **Use Cases** | Catalogs, Galleries, Dashboards | Inventory, Admin, Logs |

### Quick Decision Guide

**Choose CARDS if:**
- Item has prominent image/color/preview
- Visual recognition is key
- Mobile-first experience
- 3-8 attributes per item
- Browsing/discovery focused
- Rich metadata (tags, badges, counts)

**Choose TABLES if:**
- Structured business data
- Need to compare multiple columns
- 5+ comparable attributes
- Sorting by different fields needed
- Column customization valuable
- Desktop/tablet primary usage
- Data entry/management workflow

---

## Implementation Examples

### Example 1: Card Implementation (Paint Catalog)

```tsx
// src/app/(tabs)/pintura/catalogo/listar.tsx

import { useState } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { PaintPreview } from "@/components/painting/preview/painting-preview";

export default function PaintCatalogScreen() {
  const { paints, isLoading } = usePaintsInfiniteMobile(queryParams);

  const renderPaintCard = ({ item: paint }) => (
    <Card style={styles.paintCard}>
      <TouchableOpacity onPress={() => navigateToDetails(paint.id)}>
        {/* Visual Preview - Primary Content */}
        <View style={styles.colorPreview}>
          <PaintPreview
            paint={paint}
            baseColor={paint.hex}
            width={500}
            height={128}
          />
          {paint.code && (
            <View style={styles.codeOverlay}>
              <Text>{paint.code}</Text>
            </View>
          )}
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          <Text style={styles.paintName}>{paint.name}</Text>

          {/* Badges */}
          <View style={styles.badgeRow}>
            <Badge>{paint.paintType?.name}</Badge>
            <Badge>{paint.finish}</Badge>
            <Badge>{paint.paintBrand?.name}</Badge>
          </View>
        </View>
      </TouchableOpacity>

      {/* Tags (scrollable) */}
      <ScrollView horizontal>
        {paint.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
      </ScrollView>

      {/* Counts */}
      <View style={styles.counts}>
        <Text>{paint.formulas.length} fórmulas</Text>
        <Text>{paint.taskCount} tarefas</Text>
      </View>
    </Card>
  );

  return (
    <FlatList
      data={paints}
      renderItem={renderPaintCard}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  paintCard: {
    marginBottom: spacing.md,
    padding: 0,
    overflow: "hidden",
  },
  colorPreview: {
    height: 128, // Visual preview height
  },
  cardContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  paintName: {
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: spacing.md,
  },
});
```

**Key Points:**
- Visual preview is the focal point (128px height)
- Generous padding (16px)
- Flexible card height
- Rich metadata display
- Touch-optimized interactions
- Good for browsing and discovery

### Example 2: Table Implementation (Product List)

```tsx
// src/app/(tabs)/estoque/produtos/listar.tsx

import { Layout } from '@/components/list/Layout'
import { itemsListConfig } from '@/config/list/inventory/items'

export default function ItemListScreen() {
  return <Layout config={itemsListConfig} />
}

// src/config/list/inventory/items.ts

export const itemsListConfig: ListConfig<Item> = {
  query: {
    hook: 'useItemsInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
  },

  table: {
    columns: [
      {
        key: 'uniCode',
        label: 'CÓDIGO',
        sortable: true,
        width: 1.2,
        render: (item) => item.uniCode || '-',
      },
      {
        key: 'name',
        label: 'NOME',
        sortable: true,
        width: 2.0,
        render: (item) => item.name,
      },
      {
        key: 'quantity',
        label: 'QUANTIDADE',
        sortable: true,
        width: 0.9,
        render: (item) => String(item.quantity || 0),
        component: 'quantity-with-status', // Stock level indicator
      },
      {
        key: 'price',
        label: 'PREÇO',
        sortable: true,
        width: 1.0,
        align: 'right',
        render: (item) => item.prices?.[0]?.value || null,
        format: 'currency',
      },
      // ... 11+ more columns
    ],
    defaultVisible: ['uniCode', 'name', 'quantity'],
    rowHeight: 72,
  },

  filters: {
    fields: [
      { key: 'isActive', type: 'toggle' },
      { key: 'brandIds', type: 'select', multiple: true },
      { key: 'categoryIds', type: 'select', multiple: true },
      { key: 'stockLevels', type: 'select', multiple: true },
      // ... more filters
    ],
  },
};
```

**Key Points:**
- Configuration-driven (no custom UI code needed)
- 15+ columns available
- Only 3 visible by default (code, name, quantity)
- Users customize column visibility
- Compact row height (72px)
- Sortable headers
- Multiple filter types
- Infinite scroll for performance

### Example 3: Hybrid Approach (Customer List)

**File:** `/home/kennedy/Documents/repositories/mobile/src/config/list/administration/customers.tsx`

**Why Hybrid:**
- Table structure for data density
- Logo images embedded in cells
- Custom cell rendering for rich content
- Still uses table layout for alignment

```tsx
{
  key: 'fantasyName',
  label: 'NOME FANTASIA',
  width: 2.5,
  render: (customer: Customer) => (
    <View style={styles.nameContainer}>
      {/* Logo/Avatar in table cell */}
      {customer.logo?.id ? (
        <Image source={{ uri: getFileUrl(customer.logo) }} />
      ) : (
        <View style={styles.avatar}>
          <Text>{customer.fantasyName?.charAt(0)}</Text>
        </View>
      )}
      <Text>{customer.fantasyName}</Text>
    </View>
  ),
}
```

**Benefits:**
- Data density of tables
- Visual richness of cards
- Best of both worlds

---

## Decision Matrix

### Quick Reference Table

| Feature | Paint Catalog | File Gallery | Product List | Customer List | Employee List |
|---------|---------------|--------------|--------------|---------------|---------------|
| **Pattern** | Card | Card | Table | Table | Table |
| **Primary Content** | Color Preview | File Preview | Product Data | Customer Data | Employee Data |
| **Columns/Attributes** | 8 | 6 | 15+ | 12+ | 10+ |
| **Visual Content** | High | Medium | Low | Medium | Low |
| **Default Visible** | All | All | 3 of 15 | 3 of 12 | 4 of 10 |
| **Sorting** | Limited | Limited | Extensive | Extensive | Extensive |
| **Bulk Operations** | No | No | Yes | Yes | Yes |
| **Mobile Optimization** | Excellent | Excellent | Good | Good | Good |
| **Tablet Optimization** | Good | Good | Excellent | Excellent | Excellent |

### User Experience Considerations

**Cards are better for:**
- Quick visual recognition
- Browsing and discovery
- One-handed phone use
- Content consumption
- Image galleries
- Catalogs and portfolios

**Tables are better for:**
- Data analysis and comparison
- Multi-attribute decision making
- Business workflows
- Data entry and verification
- Administrative tasks
- Reporting and exports

---

## Mobile vs Tablet Considerations

### Mobile (< 768px)

**Card Advantages:**
- Natural vertical scrolling
- Touch-optimized (large tap targets)
- Single-column focus
- Better with images
- Less horizontal scrolling

**Table Challenges:**
- Horizontal scrolling needed
- Smaller tap targets
- Hard to see many columns
- Text may wrap or truncate

**Recommendation:** Prefer cards on mobile unless data density is essential.

### Tablet (>= 768px)

**Card Advantages:**
- Still good for visual content
- Can show 2-3 columns
- Easier to scan

**Table Advantages:**
- More screen real estate
- Can show 5-8 columns comfortably
- Better for data work
- Keyboard shortcuts work
- Multi-select easier

**Recommendation:** Tables work well on tablets for data-heavy interfaces.

### Responsive Strategy

For components used on both mobile and tablet:

1. **Cards That Adapt:**
   ```tsx
   // Single column on mobile, 2-3 columns on tablet
   <FlatList
     numColumns={isTablet ? 2 : 1}
     key={isTablet ? 'tablet' : 'mobile'}
   />
   ```

2. **Tables with Adjusted Columns:**
   ```tsx
   // Fewer default visible columns on mobile
   defaultVisible: isTablet
     ? ['code', 'name', 'brand', 'quantity', 'price']
     : ['code', 'name', 'quantity']
   ```

3. **Hybrid Layouts:**
   ```tsx
   // Cards on mobile, table on tablet
   {isTablet ? <TableView /> : <CardView />}
   ```

---

## Form Item Selection: Special Case

### Context: Selecting Items in Forms

When building forms that require item selection (borrows, orders, withdrawals), you need to decide between two specialized components.

### ItemSelectorTable (Card-Based Pagination)

**File:** `/home/kennedy/Documents/repositories/mobile/src/components/forms/ItemSelectorTable.tsx`

**Pattern:** Card-based with pagination

**When to Use:**
- Small to medium datasets (20-500 items)
- Mobile-first forms
- Standard item selection (borrows, orders)
- Simple requirements

**Layout:**
```
┌─────────────────────────────┐
│ [Search] [Filter Button]    │
├─────────────────────────────┤
│ [✓] ABC123 - Item Name      │ ← Card per item
│     Brand • Category        │
│     Stock: 150 • R$ 10.00   │
│     ┌─────────┬──────────┐  │
│     │ Qty: 5  │ Price: $ │  │ ← Shown when selected
│     └─────────┴──────────┘  │
├─────────────────────────────┤
│ [ ] XYZ789 - Other Item     │
│     Brand • Category        │
│     Stock: 50 • R$ 25.00    │
├─────────────────────────────┤
│ [< 1 2 3 4 5 >]            │ ← Pagination
└─────────────────────────────┘
```

**Features:**
- Card layout (easier to read)
- Pagination (1, 2, 3... pages)
- Quantity/price inputs expand when selected
- Better for mobile
- Simpler implementation

### ItemSelectorTableV2 (Table-Based Infinite Scroll)

**File:** `/home/kennedy/Documents/repositories/mobile/src/components/forms/ItemSelectorTableV2.tsx`

**Pattern:** Table-based with infinite scroll

**When to Use:**
- Large datasets (500-10,000+ items)
- Need table features (column visibility, sorting)
- Category type filtering (only tools, only consumables)
- Desktop/tablet primary

**Layout:**
```
┌─────────────────────────────────────────────┐
│ [Search] [Columns] [Filters]                │
├─────────────────────────────────────────────┤
│ [#] CODE   NAME        QUANTITY  [Sort]     │ ← Sortable headers
├─────────────────────────────────────────────┤
│ [✓] ABC123 Item Name   [!] 150              │ ← Compact table rows
│     ├─ Quantidade: [5 ▼]                    │ ← Inline quantity input
├─────────────────────────────────────────────┤
│ [ ] XYZ789 Other Item  [!] 50               │
├─────────────────────────────────────────────┤
│ Loading more...                             │ ← Infinite scroll
└─────────────────────────────────────────────┘
```

**Features:**
- Table layout (data-dense)
- Infinite scroll (smooth loading)
- Column visibility control
- Inline quantity inputs
- Stock level icons
- Better for large datasets

### Comparison: ItemSelectorTable vs ItemSelectorTableV2

| Feature | ItemSelectorTable | ItemSelectorTableV2 |
|---------|------------------|---------------------|
| **Layout** | Card-based | Table-based |
| **Data Loading** | Pagination | Infinite Scroll |
| **Best For** | 20-500 items | 500-10,000+ items |
| **Default UI** | Mobile-optimized | Desktop-optimized |
| **Columns** | Fixed display | User-configurable |
| **Sorting** | Server-side only | Client + Server |
| **Category Filter** | Generic filters | Type-specific (TOOL, CONSUMABLE) |
| **Hook Used** | `useItems` | `useItemsInfiniteMobile` |
| **Complexity** | Simpler | More advanced |
| **When to Use** | Most forms | Tool borrowing, large inventories |

---

## Implementation Patterns

### Pattern 1: Simple Card List (Custom)

**When to Use:** Unique visual requirements, custom interactions

**Example:** Paint Catalog

```tsx
export default function CatalogScreen() {
  const { items, loadMore } = useInfiniteQuery();

  return (
    <View>
      {/* Custom Header */}
      <CustomSearchBar />
      <CustomFilters />

      {/* Card List */}
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <Card>
            {/* Custom card content */}
          </Card>
        )}
        onEndReached={loadMore}
      />
    </View>
  );
}
```

**Pros:**
- Full customization
- Unique interactions
- Optimized for specific use case

**Cons:**
- More code to maintain
- Consistency requires discipline

### Pattern 2: Configuration-Based Table (Layout Component)

**When to Use:** Standard data lists, admin interfaces

**Example:** Product List, Customer List, Employee List

```tsx
// Route file (3 lines)
import { Layout } from '@/components/list/Layout'
import { myListConfig } from '@/config/list/my-module/my-list'

export default function MyListScreen() {
  return <Layout config={myListConfig} />
}
```

```tsx
// Config file
export const myListConfig: ListConfig<MyEntity> = {
  key: 'my-entity-list',
  title: 'My Entities',

  query: {
    hook: 'useMyEntitiesInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
  },

  table: {
    columns: [
      { key: 'code', label: 'CODE', width: 1, sortable: true },
      { key: 'name', label: 'NAME', width: 2, sortable: true },
      { key: 'status', label: 'STATUS', width: 1, format: 'badge' },
      // ... more columns
    ],
    defaultVisible: ['code', 'name', 'status'],
    actions: [
      { key: 'view', label: 'View', icon: 'eye' },
      { key: 'edit', label: 'Edit', icon: 'pencil' },
      { key: 'delete', label: 'Delete', icon: 'trash', variant: 'destructive' },
    ],
  },

  filters: {
    fields: [
      { key: 'isActive', type: 'toggle' },
      { key: 'categoryIds', type: 'select', multiple: true },
    ],
  },
};
```

**Pros:**
- 90% code reduction
- Consistent UX
- Easy to maintain
- Type-safe

**Cons:**
- Less flexibility for unique requirements
- Learning curve for config structure

### Pattern 3: Form Item Selector (Specialized)

**When to Use:** Selecting items in multi-step forms

**Card-Based Option:**
```tsx
import { ItemSelectorTable } from "@/components/forms";

<ItemSelectorTable
  selectedItems={selectedItems}
  quantities={quantities}
  onSelectItem={toggleItemSelection}
  onQuantityChange={setItemQuantity}
  showQuantityInput
  page={page}
  pageSize={20}
  onPageChange={setPage}
/>
```

**Table-Based Option:**
```tsx
import { ItemSelectorTableV2 } from "@/components/forms";

<ItemSelectorTableV2
  selectedItems={selectedItems}
  quantities={quantities}
  onSelectItem={toggleItemSelection}
  onQuantityChange={setItemQuantity}
  showQuantityInput
  categoryType={ITEM_CATEGORY_TYPE.TOOL} // Filter by type
/>
```

---

## Real-World Examples from Codebase

### Card-Based Examples

1. **Paint Catalog**
   - Path: `/pintura/catalogo/listar`
   - Visual: Color previews with shader effects
   - Attributes: 8 (type, brand, finish, manufacturer, tags, formulas, tasks, code)
   - Pattern: Custom card implementation
   - Sorting: Color palette, name, type, brand, finish, manufacturer
   - Filtering: Advanced (type, brand, finish, manufacturer, palette, formulas, color similarity)

2. **File Gallery**
   - Path: `/administracao/arquivos/listar`
   - Visual: File thumbnails/icons
   - Attributes: 6 (name, type, size, uploader, date, tags)
   - Pattern: Layout component with card config
   - Sorting: Name, type, date
   - Filtering: Type, uploader, date range

3. **Dashboard Cards**
   - Paths: `/inicio`, `/administracao/index`, `/estoque/index`
   - Visual: Icons and counts
   - Purpose: Navigation and quick stats
   - Pattern: Custom grid layout

### Table-Based Examples

1. **Product List**
   - Path: `/estoque/produtos/listar`
   - Data: 15+ columns (code, name, brand, category, measures, quantity, consumption, price, total, CA, barcodes, max, reorder, ICMS, IPI, supplier, PPE type, assignment, lead time, status, activities, dates)
   - Pattern: Layout component with table config
   - Default Visible: 3 columns (code, name, quantity)
   - Special: Stock level indicators, consumption trends

2. **Customer List**
   - Path: `/administracao/clientes/listar`
   - Data: 12+ columns (fantasy name, legal name, CNPJ, email, phone, city, state, status, tags, economic activity, dates, task count)
   - Pattern: Layout component with table config
   - Default Visible: 3 columns (name with logo, CNPJ, task count)
   - Special: Logo images in cells, phone count badges, tag badges

3. **Employee List**
   - Path: `/administracao/colaboradores/listar`
   - Data: Personnel information, positions, sectors, contact, dates
   - Pattern: Layout component with table config
   - Special: Department grouping, status indicators

4. **Time Clock Records**
   - Path: `/recursos-humanos/registros-ponto/listar`
   - Data: Date, time, employee, type, status, duration
   - Pattern: Layout component with table config
   - Special: Time formatting, duration calculations

5. **Payroll List**
   - Path: `/recursos-humanos/folha-de-pagamento/listar`
   - Data: Employee, period, hours, earnings, deductions, total
   - Pattern: Layout component with table config
   - Special: Currency formatting, calculation columns

---

## Performance Considerations

### Cards

**Pros:**
- Natural for FlatList virtualization
- Each card is independent
- Easy to implement pull-to-refresh
- Smooth animations

**Cons:**
- More DOM elements per item
- Larger memory footprint
- Slower for large lists (1000+ items)

**Optimizations:**
```tsx
<FlatList
  data={items}
  renderItem={renderCard}
  removeClippedSubviews
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={8}
  getItemLayout={(data, index) => ({
    length: CARD_HEIGHT,
    offset: CARD_HEIGHT * index,
    index,
  })}
/>
```

### Tables

**Pros:**
- More compact (less memory)
- Better for large datasets
- Efficient column rendering
- Faster scrolling

**Cons:**
- Complex row rendering
- Column width calculations
- Horizontal scroll on mobile

**Optimizations:**
```tsx
<FlatList
  data={items}
  renderItem={renderTableRow}
  removeClippedSubviews
  maxToRenderPerBatch={15}
  windowSize={7}
  initialNumToRender={20}
  getItemLayout={(data, index) => ({
    length: ROW_HEIGHT,
    offset: ROW_HEIGHT * index,
    index,
  })}
/>
```

---

## Accessibility Considerations

### Cards

**Accessibility Features:**
- Clear visual hierarchy
- Large touch targets (min 48px)
- Color contrast for badges
- Descriptive labels
- Screen reader friendly

**Implementation:**
```tsx
<TouchableOpacity
  accessible
  accessibilityRole="button"
  accessibilityLabel={`${paint.name}, ${paint.paintType?.name}`}
  accessibilityHint="Double tap to view details"
>
  <Card>
    {/* Content */}
  </Card>
</TouchableOpacity>
```

### Tables

**Accessibility Features:**
- Row/column structure
- Sortable header announcements
- Checkbox states
- Keyboard navigation

**Implementation:**
```tsx
<TouchableOpacity
  accessible
  accessibilityRole="button"
  accessibilityLabel={`Row ${index + 1}: ${item.name}, quantity ${item.quantity}`}
>
  <View style={styles.row}>
    <Checkbox
      accessibilityLabel={`Select ${item.name}`}
      checked={isSelected}
    />
    {/* Cells */}
  </View>
</TouchableOpacity>
```

---

## Best Practices

### For Cards

1. **Consistent Card Heights** - Use dynamic but predictable heights
2. **Touch Targets** - Minimum 48px for interactive elements
3. **Visual Hierarchy** - Clear primary/secondary/tertiary information
4. **Loading States** - Show skeleton cards while loading
5. **Empty States** - Friendly message with icon
6. **Infinite Scroll** - Load more as user scrolls
7. **Pull to Refresh** - Standard gesture support
8. **Context Actions** - Long-press for context menu

### For Tables

1. **Column Defaults** - Show 3-5 most important columns
2. **Column Visibility** - Let users customize
3. **Sort Indicators** - Clear visual feedback
4. **Row Heights** - Consistent (48-72px)
5. **Horizontal Scroll** - Smooth on mobile
6. **Bulk Selection** - Checkbox in first column
7. **Loading States** - Skeleton rows
8. **Empty States** - Centered message
9. **Filters** - Slide-in panel
10. **Export** - CSV/PDF/JSON options

---

## Anti-Patterns to Avoid

### Don't Use Cards When:

1. **Data Comparison is Critical**
   - Bad: Product inventory cards (can't compare prices/stock easily)
   - Good: Product inventory table

2. **Many Columns Needed**
   - Bad: Payroll cards (hide important columns)
   - Good: Payroll table with column visibility

3. **Sorting is Frequent**
   - Bad: Transaction log cards (hard to sort by date/amount)
   - Good: Transaction log table with sortable columns

### Don't Use Tables When:

1. **Visual Content is Primary**
   - Bad: Paint catalog table (loses color impact)
   - Good: Paint catalog cards with previews

2. **Rich Metadata Display Needed**
   - Bad: Social media feed table (loses richness)
   - Good: Social media feed cards

3. **Mobile-Only App with Images**
   - Bad: Photo gallery table (tiny thumbnails)
   - Good: Photo gallery cards (proper image size)

---

## Migration Guide

### Converting Card to Table

**When:** Realizing you need more data density, columns, sorting

**Steps:**

1. **Create Config File**
   ```tsx
   // src/config/list/my-module/my-entity.ts
   export const myEntityListConfig: ListConfig<MyEntity> = {
     // ... configuration
   };
   ```

2. **Update Route File**
   ```tsx
   // Before
   export default function MyListScreen() {
     // 200+ lines of custom code
   }

   // After
   import { Layout } from '@/components/list/Layout'
   import { myEntityListConfig } from '@/config/list/my-module/my-entity'

   export default function MyListScreen() {
     return <Layout config={myEntityListConfig} />
   }
   ```

3. **Define Columns**
   - Map card attributes to table columns
   - Choose default visible columns (3-5)
   - Set column widths and alignment

4. **Test**
   - Verify all data displays correctly
   - Test sorting
   - Test filtering
   - Test column visibility
   - Test responsive behavior

### Converting Table to Card

**When:** Realizing visual content is more important than data density

**Steps:**

1. **Design Card Layout**
   - Identify primary visual content
   - Plan visual hierarchy
   - Design badge/metadata display

2. **Create Custom Component**
   ```tsx
   const renderCard = ({ item }) => (
     <Card>
       <Image source={item.image} />
       <Text>{item.name}</Text>
       <View>{/* Badges */}</View>
     </Card>
   );
   ```

3. **Implement FlatList**
   ```tsx
   <FlatList
     data={items}
     renderItem={renderCard}
     contentContainerStyle={styles.listContent}
   />
   ```

4. **Add Interactions**
   - Touch handlers
   - Long-press menu
   - Pull to refresh

---

## Testing Checklist

### For Card Lists

- [ ] Cards render correctly on mobile
- [ ] Cards adapt to tablet (2-3 columns if applicable)
- [ ] Images load and have fallbacks
- [ ] Touch targets are at least 48px
- [ ] Long-press context menu works
- [ ] Pull to refresh works
- [ ] Infinite scroll loads more items
- [ ] Empty state shows correctly
- [ ] Loading skeleton displays
- [ ] Search works
- [ ] Filters apply correctly
- [ ] Sort options work

### For Table Lists

- [ ] Table renders on mobile (horizontal scroll if needed)
- [ ] Table expands on tablet
- [ ] All columns display correctly
- [ ] Default visible columns show
- [ ] Column visibility panel works
- [ ] Sorting works for all sortable columns
- [ ] Sort direction toggles
- [ ] Filters apply correctly
- [ ] Bulk selection works
- [ ] Bulk actions work
- [ ] Export works (CSV, PDF, JSON)
- [ ] Search works
- [ ] Infinite scroll loads more
- [ ] Empty state shows
- [ ] Loading skeleton displays

---

## Summary

### Use Cards For:
- Paint Catalog (visual color previews)
- File Galleries (file thumbnails)
- Dashboard Navigation (icons and counts)
- Product Showcases (images and rich content)
- Social Feeds (mixed media)
- Image Galleries

### Use Tables For:
- Product Inventory (many comparable attributes)
- Customer Lists (business data)
- Employee Lists (personnel data)
- Transaction Logs (structured data)
- Time Tracking (dates and times)
- Payroll (financial data)
- Admin Interfaces (data management)

### Use ItemSelectorTable For:
- Borrow forms (standard items)
- Order forms (standard items)
- Activity forms (standard items)
- External withdrawal forms (standard items)
- Small to medium item selection (< 500 items)

### Use ItemSelectorTableV2 For:
- Tool borrowing (category type filter)
- Large inventory selection (1000+ items)
- When column visibility matters
- When sorting matters
- Desktop/tablet primary usage

---

## Related Documentation

- **Form Standards:** `/home/kennedy/Documents/repositories/mobile/docs/FORM_LAYOUT_STANDARDS.md`
- **List Patterns:** `/home/kennedy/Documents/repositories/mobile/docs/LIST_SYSTEM_PATTERN_REFERENCE.md`
- **Nested Routes:** `/home/kennedy/Documents/repositories/mobile/docs/NESTED_ROUTES_INDEX.md`
- **Cleanup Summary:** `/home/kennedy/Documents/repositories/mobile/docs/CLEANUP_SUMMARY.md`

---

## Questions?

**Q: Can I mix cards and tables in the same screen?**
A: Yes, but sparingly. Example: Dashboard cards for navigation, table for recent items.

**Q: What about very small screens (< 375px)?**
A: Cards almost always work better. Tables require horizontal scroll.

**Q: Can tables have images?**
A: Yes, see customer list (logos in table cells). Keep images small (32-48px).

**Q: What if I need both card and table views?**
A: Provide a toggle. Save user preference. Rare but valid for power users.

**Q: Should I always use Layout component for tables?**
A: Recommended for standard lists. Custom implementation OK for unique requirements.

**Q: How do I handle very long lists (10,000+ items)?**
A: Use table with infinite scroll (ItemSelectorTableV2 pattern), virtual rendering, and pagination on server.

---

Generated: November 24, 2025
