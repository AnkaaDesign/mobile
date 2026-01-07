# MessageBlockRenderer - Architecture

## Component Hierarchy

```
MessageBlockRenderer (index.tsx)
│
├── Handles orchestration of all blocks
├── Manages link and button press events
├── Provides default handlers for navigation
│
└── Renders blocks based on type:
    │
    ├── HeadingBlock (heading-block.tsx)
    │   └── Uses InlineTextRenderer
    │
    ├── ParagraphBlock (paragraph-block.tsx)
    │   └── Uses InlineTextRenderer
    │
    ├── ImageBlock (image-block.tsx)
    │   ├── Loading state
    │   ├── Error state
    │   └── Success with optional caption
    │
    ├── ButtonBlock (button-block.tsx)
    │   └── Uses existing Button component
    │
    ├── DividerBlock (divider-block.tsx)
    │   └── Simple View with border
    │
    ├── ListBlock (list-block.tsx)
    │   ├── Ordered or Unordered
    │   └── ListItem (recursive for nesting)
    │       └── Uses InlineTextRenderer
    │
    └── QuoteBlock (quote-block.tsx)
        ├── Uses InlineTextRenderer
        └── Optional author attribution
```

## Data Flow

```
User/API
   │
   ├─> Creates MessageBlock[] array
   │
   └─> Passes to MessageBlockRenderer
       │
       ├─> For each block:
       │   │
       │   ├─> Determines block type
       │   │
       │   ├─> Renders appropriate component
       │   │
       │   └─> Passes handlers down
       │
       └─> Events bubble up:
           │
           ├─> Link Press -> handleLinkPress
           │   │
           │   ├─> Custom handler (if provided)
           │   │
           │   └─> Default: expo-router or Linking
           │
           └─> Button Press -> handleButtonPress
               │
               ├─> Custom handler (if provided)
               │
               └─> Default: navigate to URL
```

## Type System

```typescript
MessageBlock (Union Type)
   │
   ├── HeadingBlock
   │   ├── type: "heading"
   │   ├── level: 1-6
   │   └── content: InlineText[]
   │
   ├── ParagraphBlock
   │   ├── type: "paragraph"
   │   └── content: InlineText[]
   │
   ├── ImageBlock
   │   ├── type: "image"
   │   ├── url: string
   │   ├── alt?: string
   │   ├── caption?: string
   │   ├── width?: number
   │   └── height?: number
   │
   ├── ButtonBlock
   │   ├── type: "button"
   │   ├── text: string
   │   ├── url?: string
   │   ├── action?: string
   │   └── variant?: "default" | "outline" | "secondary"
   │
   ├── DividerBlock
   │   ├── type: "divider"
   │   └── style?: "solid" | "dashed" | "dotted"
   │
   ├── ListBlock
   │   ├── type: "list"
   │   ├── ordered: boolean
   │   └── items: ListItemBlock[]
   │       └── ListItemBlock
   │           ├── content: InlineText[]
   │           └── items?: ListItemBlock[] (for nesting)
   │
   └── QuoteBlock
       ├── type: "quote"
       ├── content: InlineText[]
       └── author?: string

InlineText
   ├── text: string
   ├── styles?: InlineStyle[]
   │   └── "bold" | "italic" | "code"
   └── href?: string
```

## Styling Architecture

```
Design System
   │
   ├── constants/design-system.ts
   │   ├── spacing
   │   ├── fontSize
   │   ├── lineHeight
   │   ├── fontWeight
   │   ├── borderRadius
   │   └── shadow
   │
   ├── constants/colors.ts
   │   ├── Colors.light
   │   └── Colors.dark
   │
   └── lib/theme
       └── useTheme()
           ├── colors
           ├── spacing
           └── isDark

Applied to Components
   │
   ├── Each block component
   │   └── Creates StyleSheet
   │       ├── Uses theme colors
   │       ├── Uses design tokens
   │       └── Responsive to screen size
   │
   └── InlineTextRenderer
       └── Applies inline styles
           ├── Bold (fontWeight)
           ├── Italic (fontStyle)
           ├── Code (monospace + background)
           └── Link (color + underline)
```

## Event Handling

```
User Interaction
   │
   ├── Link Press
   │   │
   │   ├── InlineTextRenderer detects press
   │   │
   │   ├── Calls onLinkPress from props
   │   │
   │   └── MessageBlockRenderer.handleLinkPress
   │       │
   │       ├── Custom handler exists?
   │       │   └── YES: Call custom handler
   │       │   └── NO: Continue to default
   │       │
   │       └── Default behavior:
   │           ├── URL starts with "/"?
   │           │   └── YES: router.push(url)
   │           │   └── NO: Linking.openURL(url)
   │           │
   │           └── Error handling
   │               ├── Show alert on failure
   │               └── Log to console
   │
   └── Button Press
       │
       ├── ButtonBlock detects press
       │
       ├── Calls onButtonPress from props
       │
       └── MessageBlockRenderer.handleButtonPress
           │
           ├── Custom handler exists?
           │   └── YES: Call with action and url
           │   └── NO: Continue to default
           │
           └── Default behavior:
               └── If url exists: handleLinkPress(url)
```

## File Dependencies

```
index.tsx (Main Component)
   │
   ├── Imports:
   │   ├── React Native core (View, StyleSheet, Linking, Alert)
   │   ├── expo-router (useRouter)
   │   ├── @/lib/theme (useTheme)
   │   ├── @/constants/design-system (spacing)
   │   ├── All block components
   │   └── types.ts
   │
   └── Exports:
       ├── MessageBlockRenderer (default component)
       └── All types from types.ts

Block Components
   │
   ├── heading-block.tsx
   │   ├── React Native (View, StyleSheet)
   │   ├── @/lib/theme (useTheme)
   │   ├── @/constants/design-system (fontSize, fontWeight, lineHeight, spacing)
   │   ├── inline-text-renderer.tsx
   │   └── types.ts
   │
   ├── paragraph-block.tsx
   │   ├── React Native (View, StyleSheet)
   │   ├── @/lib/theme (useTheme)
   │   ├── @/constants/design-system (fontSize, lineHeight, spacing)
   │   ├── inline-text-renderer.tsx
   │   └── types.ts
   │
   ├── image-block.tsx
   │   ├── React Native (View, Image, StyleSheet, ActivityIndicator, useWindowDimensions, Text)
   │   ├── @/lib/theme (useTheme)
   │   ├── @/constants/design-system (borderRadius, spacing, fontSize)
   │   └── types.ts
   │
   ├── button-block.tsx
   │   ├── React Native (View, StyleSheet)
   │   ├── @/components/ui/button (Button)
   │   ├── @/constants/design-system (spacing)
   │   └── types.ts
   │
   ├── divider-block.tsx
   │   ├── React Native (View, StyleSheet)
   │   ├── @/lib/theme (useTheme)
   │   ├── @/constants/design-system (spacing)
   │   └── types.ts
   │
   ├── list-block.tsx
   │   ├── React Native (View, Text, StyleSheet)
   │   ├── @/lib/theme (useTheme)
   │   ├── @/constants/design-system (fontSize, lineHeight, spacing)
   │   ├── inline-text-renderer.tsx
   │   └── types.ts
   │
   └── quote-block.tsx
       ├── React Native (View, Text, StyleSheet)
       ├── @/lib/theme (useTheme)
       ├── @/constants/design-system (fontSize, lineHeight, spacing, borderRadius)
       ├── inline-text-renderer.tsx
       └── types.ts

Shared Components
   │
   └── inline-text-renderer.tsx
       ├── React Native (Text, StyleSheet, Pressable, TextStyle)
       ├── @/lib/theme (useTheme)
       ├── @/constants/design-system (fontSize, fontWeight)
       └── types.ts
```

## Rendering Pipeline

```
1. MessageBlockRenderer receives blocks array
   │
2. For each block in blocks:
   │
   ├─> Check block.type
   │
   ├─> Switch statement determines component
   │
   ├─> Render appropriate block component
   │   │
   │   ├─> Component receives:
   │   │   ├── block data
   │   │   ├── onLinkPress handler (if applicable)
   │   │   └── onButtonPress handler (if applicable)
   │   │
   │   ├─> Component uses useTheme() for styling
   │   │
   │   ├─> Component creates StyleSheet
   │   │
   │   └─> Component returns React Native elements
   │
   └─> Render in order within container View
```

## Theme Integration

```
ThemeProvider (app root)
   │
   └─> Provides theme context
       │
       ├── colors (light/dark)
       ├── spacing tokens
       └── isDark boolean
       │
       └─> MessageBlockRenderer
           │
           └─> Each block component calls useTheme()
               │
               ├─> Gets current theme colors
               ├─> Applies to StyleSheet
               └─> Re-renders on theme change
```

## Performance Optimizations

```
Component Level
   │
   ├── Functional components (no class overhead)
   ├── Memoized style calculations
   ├── Efficient re-rendering
   └── No unnecessary state

Image Handling
   │
   ├── Lazy loading (Image.getSize async)
   ├── Loading states
   ├── Error boundaries
   └── Proper sizing before render

List Rendering
   │
   ├── Efficient key assignment
   ├── No deep copying
   └── Recursive rendering optimized

Event Handlers
   │
   ├── useCallback for handlers
   ├── Event delegation where possible
   └── Minimal prop drilling
```

## Error Handling Strategy

```
Image Errors
   │
   ├── Image.getSize failure
   │   └─> Set error state
   │       └─> Render error UI
   │
   └── Image load failure
       └─> Show fallback message

Link Errors
   │
   ├── Linking.canOpenURL fails
   │   └─> Show alert to user
   │
   └── Navigation error
       └─> Log to console
           └─> Show alert

Type Errors
   │
   └── Unknown block type
       ├─> Exhaustive type checking
       ├─> Console warning
       └─> Return null (graceful degradation)
```

## Extension Points

```
Adding New Block Types
   │
   ├── 1. Add type definition to types.ts
   │   └─> Update MessageBlock union type
   │
   ├── 2. Create new-block.tsx component
   │   ├─> Follow existing patterns
   │   ├─> Use theme and design system
   │   └─> Export component
   │
   ├── 3. Import in index.tsx
   │   └─> Add to switch statement
   │
   └── 4. Update documentation
       ├─> README.md
       ├─> QUICK_REFERENCE.md
       └─> example.tsx

Custom Inline Styles
   │
   ├── 1. Add to InlineStyle type in types.ts
   │
   ├── 2. Update inline-text-renderer.tsx
   │   ├─> Add style to StyleSheet
   │   └─> Add to style application logic
   │
   └── 3. Update documentation

Custom Event Handlers
   │
   ├── Simply pass as props:
   │   ├─> onLinkPress={(url) => {...}}
   │   └─> onButtonPress={(action, url) => {...}}
   │
   └── Will override default behavior
```

## Testing Strategy

```
Unit Tests (Recommended)
   │
   ├── inline-text-renderer
   │   ├─> Renders plain text
   │   ├─> Applies bold style
   │   ├─> Applies italic style
   │   ├─> Applies code style
   │   ├─> Renders links
   │   └─> Calls onLinkPress
   │
   ├── Each block component
   │   ├─> Renders with minimal props
   │   ├─> Renders with all props
   │   ├─> Applies theme correctly
   │   └─> Handles edge cases
   │
   └── index.tsx (MessageBlockRenderer)
       ├─> Renders all block types
       ├─> Handles empty blocks array
       ├─> Calls event handlers
       └─> Handles unknown block types

Integration Tests (Recommended)
   │
   ├── With ScrollView
   ├── With Card component
   ├── Theme switching
   ├── Navigation flows
   └── Real API data

Visual Tests (Recommended)
   │
   ├── Snapshot tests
   ├── Manual testing on devices
   └── Different screen sizes
```

This architecture is designed to be:
- **Modular**: Each block is independent
- **Extensible**: Easy to add new block types
- **Type-safe**: Full TypeScript coverage
- **Performant**: Optimized rendering
- **Maintainable**: Clear separation of concerns
- **Testable**: Easy to unit test components
