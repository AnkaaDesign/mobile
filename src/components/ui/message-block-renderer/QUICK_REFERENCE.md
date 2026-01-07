# MessageBlockRenderer - Quick Reference Guide

## Import

```typescript
import { MessageBlockRenderer, type MessageBlock } from "@/components/ui/message-block-renderer";
```

## All Available Block Types

### 1. Heading
```typescript
{
  type: "heading",
  level: 1, // 1, 2, 3, 4, 5, or 6
  content: [{ text: "Your heading text" }]
}
```

### 2. Paragraph
```typescript
{
  type: "paragraph",
  content: [
    { text: "Normal text " },
    { text: "bold", styles: ["bold"] },
    { text: " text " },
    { text: "italic", styles: ["italic"] },
    { text: " text " },
    { text: "link", href: "https://example.com" }
  ]
}
```

### 3. Image
```typescript
{
  type: "image",
  url: "https://example.com/image.jpg",
  alt: "Image description",
  caption: "Optional caption",
  width: 300,  // optional
  height: 200  // optional
}
```

### 4. Button
```typescript
{
  type: "button",
  text: "Click Me",
  action: "action_name",
  url: "/route/or/url",  // optional
  variant: "default"  // "default" | "outline" | "secondary"
}
```

### 5. Divider
```typescript
{
  type: "divider",
  style: "solid"  // "solid" | "dashed" | "dotted"
}
```

### 6. List (Unordered)
```typescript
{
  type: "list",
  ordered: false,
  items: [
    { content: [{ text: "Item 1" }] },
    { content: [{ text: "Item 2" }] },
    {
      content: [{ text: "Item 3 with nested list" }],
      items: [
        { content: [{ text: "Nested item 1" }] },
        { content: [{ text: "Nested item 2" }] }
      ]
    }
  ]
}
```

### 7. List (Ordered)
```typescript
{
  type: "list",
  ordered: true,
  items: [
    { content: [{ text: "First item" }] },
    { content: [{ text: "Second item" }] },
    { content: [{ text: "Third item" }] }
  ]
}
```

### 8. Quote
```typescript
{
  type: "quote",
  content: [{ text: "Quote text here" }],
  author: "Author Name"  // optional
}
```

## Inline Text Styles

```typescript
// Available styles: "bold" | "italic" | "code"

{ text: "Bold text", styles: ["bold"] }
{ text: "Italic text", styles: ["italic"] }
{ text: "Code text", styles: ["code"] }
{ text: "Bold italic", styles: ["bold", "italic"] }
{ text: "Link text", href: "https://example.com" }
```

## Component Props

```typescript
<MessageBlockRenderer
  blocks={messageBlocks}           // Required: array of MessageBlock
  onLinkPress={(url) => {}}        // Optional: custom link handler
  onButtonPress={(action, url) => {}} // Optional: custom button handler
  style={{}}                       // Optional: container style override
/>
```

## Complete Example

```typescript
import { MessageBlockRenderer } from "@/components/ui/message-block-renderer";

const blocks = [
  {
    type: "heading",
    level: 1,
    content: [{ text: "Welcome!" }]
  },
  {
    type: "paragraph",
    content: [
      { text: "This is a " },
      { text: "complete example", styles: ["bold"] },
      { text: " with a " },
      { text: "link", href: "https://example.com" }
    ]
  },
  {
    type: "divider"
  },
  {
    type: "list",
    ordered: false,
    items: [
      { content: [{ text: "Feature 1" }] },
      { content: [{ text: "Feature 2" }] }
    ]
  },
  {
    type: "image",
    url: "https://via.placeholder.com/400",
    alt: "Placeholder",
    caption: "Example image"
  },
  {
    type: "button",
    text: "Get Started",
    action: "start",
    variant: "default"
  }
];

<MessageBlockRenderer
  blocks={blocks}
  onButtonPress={(action) => console.log(action)}
/>
```

## Common Patterns

### News Article
```typescript
[
  { type: "heading", level: 1, content: [{ text: "Article Title" }] },
  { type: "paragraph", content: [{ text: "Lead paragraph..." }] },
  { type: "image", url: "...", caption: "..." },
  { type: "paragraph", content: [{ text: "Body text..." }] },
  { type: "divider" },
  { type: "paragraph", content: [
    { text: "Read more at " },
    { text: "source", href: "..." }
  ]}
]
```

### Notification
```typescript
[
  { type: "heading", level: 2, content: [{ text: "Alert Title" }] },
  { type: "paragraph", content: [{ text: "Alert message..." }] },
  { type: "button", text: "Take Action", action: "action_name" }
]
```

### Help Documentation
```typescript
[
  { type: "heading", level: 1, content: [{ text: "How To Guide" }] },
  { type: "paragraph", content: [{ text: "Introduction..." }] },
  { type: "heading", level: 2, content: [{ text: "Steps" }] },
  { type: "list", ordered: true, items: [
    { content: [{ text: "Step 1" }] },
    { content: [{ text: "Step 2" }] }
  ]},
  { type: "quote", content: [{ text: "Tip: ..." }] }
]
```

## TypeScript Types

```typescript
import type {
  MessageBlock,
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  ButtonBlock,
  DividerBlock,
  ListBlock,
  QuoteBlock,
  InlineText,
  InlineStyle,
  MessageBlockRendererProps
} from "@/components/ui/message-block-renderer";
```

## Tips

1. **Always provide alt text for images** - Important for accessibility
2. **Use semantic heading levels** - Don't skip levels (h1 → h2 → h3)
3. **Keep paragraphs concise** - Better for mobile reading
4. **Test on both themes** - Light and dark mode
5. **Handle link errors** - Provide onLinkPress handler for custom error handling
6. **Use appropriate variants** - Match button variants to their purpose
7. **Nest lists carefully** - Deep nesting can reduce readability
8. **Add captions to images** - Provides context
9. **Use dividers sparingly** - Too many can break visual flow
10. **Test responsiveness** - Check on different screen sizes
