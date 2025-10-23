# Breadcrumb Visual Guide

This guide shows how breadcrumbs appear in the mobile application.

## Visual Examples

### Example 1: Simple Breadcrumb (2 levels)

```
[🏠] > Administração > Clientes
 ^      ^              ^
Home   Parent        Current (not clickable)
```

**Route**: `/(tabs)/administration/customers`

**User Can Click**:
- Home icon → Navigates to home page
- "Administração" → Navigates to administration section

**Current Location**:
- "Clientes" appears in bold, not clickable

---

### Example 2: Detail Page (3 levels)

```
[🏠] > Produção > Cronograma > Tarefa ABC
 ^      ^          ^            ^
Home   Sec.      Parent      Current
```

**Route**: `/(tabs)/production/schedule/details/123`

**Entity Name**: Task with name "Tarefa ABC"

**User Can Click**:
- Home icon → Home page
- "Produção" → Production section
- "Cronograma" → Schedule list

**Current Location**:
- "Tarefa ABC" (the actual task name from database)

---

### Example 3: Nested Resource (4 levels)

```
[🏠] > Pintura > Catálogo > Tinta Azul > Fórmulas
 ^      ^         ^           ^            ^
Home   Sec.     Type       Parent       Current
```

**Route**: `/(tabs)/painting/catalog/details/456/formulas`

**User Can Click**:
- All segments except "Fórmulas"

---

### Example 4: Long Path with Truncation (5+ levels)

When there are too many segments, the breadcrumb automatically truncates:

```
[🏠] > Estoque > ... > Marcas > Marca XYZ
 ^      ^        ^      ^         ^
Home   First   Trunc   Parent   Current
```

**Original Path**:
- Home > Estoque > Produtos > Categorias > Marcas > Marca XYZ

**Displayed**:
- Home > Estoque > ... > Marcas > Marca XYZ

**User Can Click**:
- Home, Estoque, Marcas
- "..." is not clickable (indicates hidden segments)

---

## Component Anatomy

```
┌─────────────────────────────────────────────────────────┐
│ [🏠] > Section > Subsection > Current Item              │
│  (1)  (2)  (3)     (3)        (3)    (4)               │
└─────────────────────────────────────────────────────────┘

Legend:
(1) Home Icon - Always shown if showHome={true}
(2) Separator (>) - Chevron between segments
(3) Clickable Segments - Can navigate to parent pages
(4) Current Segment - Bold, not clickable
```

---

## Visual States

### Normal State
```
[🏠] > Administração > Clientes
```
- Home icon: Gray color
- Separators: Gray chevrons
- Clickable text: Gray color
- Current text: Black/White (theme color), bold

### Hover State (Web/Tablet)
```
[🏠] > [Administração] > Clientes
        ^-- Highlight on hover
```

### Pressed State (Mobile)
```
[🏠] > [Administração*] > Clientes
        ^-- Visual feedback when touched
```

### Dark Mode
```
[🏠] > Administração > Clientes
```
- Colors automatically invert
- Home icon: Light gray
- Clickable text: Light gray
- Current text: White, bold

---

## Spacing and Layout

### Desktop/Tablet (Wide Screen)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  [🏠] > Production > Schedule > Task ABC        │
│                                                 │
│  ┌─────────────────────────────────────┐      │
│  │                                     │      │
│  │         Main Content                │      │
│  │                                     │      │
│  └─────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

### Mobile (Narrow Screen)
```
┌──────────────────────────┐
│                          │
│ [🏠] > Prod > ... > ABC  │
│                          │
│ ┌──────────────────────┐ │
│ │                      │ │
│ │   Main Content       │ │
│ │                      │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```
- Automatically truncates on small screens
- Maintains readability

---

## Real Examples from the App

### Production Schedule Details

**Before Data Loads:**
```
[🏠] > Produção > Cronograma > Detalhes
```

**After Data Loads:**
```
[🏠] > Produção > Cronograma > Envelopamento Caminhão X123
```
- The entity name replaces "Detalhes"

### Customer Details

**Before:**
```
[🏠] > Administração > Clientes > Detalhes
```

**After:**
```
[🏠] > Administração > Clientes > Empresa ABC Ltda
```
- Shows customer's fantasy name

### Nested Paint Formula

```
[🏠] > Pintura > Catálogo > Azul Metálico > Fórmula Padrão
```
- Shows paint name and formula name

---

## Size and Dimensions

### Component Height
- Minimum: 40px
- Default: 48px
- With padding: ~56px total

### Segment Width
- Min: Auto (based on text)
- Max: 200px (truncates with "...")
- Separator: 8px margin on each side

### Icon Size
- Home icon: 16px
- Chevron: 14px

### Font Size
- Normal segments: 14px
- Current segment: 14px (bold)

---

## Color Reference

### Light Mode
- Home icon: `colors.mutedForeground` (gray)
- Separators: `colors.mutedForeground` (gray)
- Clickable text: `colors.mutedForeground` (gray)
- Current text: `colors.foreground` (black)
- Background: Transparent

### Dark Mode
- Home icon: `colors.mutedForeground` (light gray)
- Separators: `colors.mutedForeground` (light gray)
- Clickable text: `colors.mutedForeground` (light gray)
- Current text: `colors.foreground` (white)
- Background: Transparent

### On Hover/Press
- Background: `colors.muted` with low opacity
- Border radius: 8px

---

## Interaction Examples

### Click Flow Example

**User sees:**
```
[🏠] > Estoque > Produtos > Notebook Dell
```

**User clicks "Estoque":**
1. Visual feedback (background highlight)
2. Navigate to `/(tabs)/inventory`
3. Breadcrumb updates:
   ```
   [🏠] > Estoque
   ```

**User clicks "Produtos":**
1. Navigate to `/(tabs)/inventory/products`
2. Breadcrumb updates:
   ```
   [🏠] > Estoque > Produtos
   ```

---

## Responsive Behavior

### Very Small Screens (< 360px)
```
[🏠] > ... > Current
```
- Shows only home, ellipsis, and current

### Small Screens (360px - 768px)
```
[🏠] > Section > ... > Current
```
- Shows home, first section, ellipsis, and current

### Medium Screens (768px - 1024px)
```
[🏠] > Section > Subsection > Current
```
- Shows up to 3-4 segments

### Large Screens (> 1024px)
```
[🏠] > Section > Subsection > Detail > Current
```
- Shows up to 5 segments before truncating

---

## Accessibility Considerations

### Screen Reader Announcement
```
"Breadcrumb navigation. You are in: Production, Schedule, Task ABC"
```

### Keyboard Navigation (Future Enhancement)
```
Tab → Highlights home icon
Tab → Highlights "Produção"
Tab → Highlights "Cronograma"
Enter → Navigates to highlighted segment
```

### Touch Targets
- Minimum: 44x44px (iOS HIG guideline)
- Actual: 48x48px (comfortable for most users)

---

## Animation (Subtle)

### On Navigation
```
Old: [🏠] > Administração > Clientes
              ↓ fade out
New: [🏠] > Administração > Clientes > Cliente ABC
              ↓ fade in
```
- Smooth transition when breadcrumb updates
- ~200ms duration

---

## Comparison with Other Navigation

### Back Button
```
[←] Cliente ABC
```
- Only shows current page
- Goes back one step

### Breadcrumb
```
[🏠] > Administração > Clientes > Cliente ABC
```
- Shows full path
- Can navigate to any parent level
- Better context awareness

---

## Edge Cases

### Very Long Entity Name
```
[🏠] > Prod > Schedule > Envelopamento e Pin...
                         ^-- Truncated with ellipsis
```
- Max width: 200px
- Truncates with "..."

### No Entity Name
```
[🏠] > Produção > Cronograma > Detalhes
```
- Falls back to "Detalhes"

### Loading State
```
[🏠] > Produção > Cronograma > Carregando...
```
- Shows "Carregando..." or similar

---

## Best Practices

### DO ✓
```
[🏠] > Estoque > Produtos > Notebook Dell
```
- Use actual entity names
- Keep segments concise
- Use Portuguese labels

### DON'T ✗
```
[🏠] > inventory > products > 123e4567-e89b
```
- Don't use English labels
- Don't show raw IDs
- Don't use technical terms

---

## Testing Checklist

Visual tests to perform:

- [ ] Breadcrumb appears at top of page
- [ ] Home icon is visible and clickable
- [ ] Separators (>) appear between segments
- [ ] Last segment is bold and not clickable
- [ ] Other segments are clickable
- [ ] Colors match theme (light/dark)
- [ ] Text is readable
- [ ] Long names truncate properly
- [ ] Works on small screens
- [ ] Touch targets are large enough
- [ ] Navigation works correctly

---

This visual guide helps you understand how breadcrumbs look and behave in the application.
