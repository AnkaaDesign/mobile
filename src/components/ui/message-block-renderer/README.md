# MessageBlockRenderer

A comprehensive React Native component for rendering rich message content blocks in the mobile application.

## Features

- **Multiple Block Types**: Supports headings, paragraphs, images, buttons, dividers, lists, and quotes
- **Inline Formatting**: Bold, italic, code, and links within text
- **Nested Lists**: Support for nested ordered and unordered lists
- **Responsive Design**: Adapts to different screen sizes
- **Theme Support**: Fully integrated with the app's light/dark theme system
- **Link Handling**: Intelligent routing for internal navigation and external URLs
- **TypeScript**: Fully typed with comprehensive type definitions
- **Accessible**: Proper accessibility labels and semantics

## Installation

The component is already integrated into the project. Simply import and use:

```tsx
import { MessageBlockRenderer } from "@/components/ui/message-block-renderer";
```

## Basic Usage

```tsx
import { MessageBlockRenderer, type MessageBlock } from "@/components/ui/message-block-renderer";

function MyComponent() {
  const blocks: MessageBlock[] = [
    {
      type: "heading",
      level: 1,
      content: [{ text: "Welcome to the App" }],
    },
    {
      type: "paragraph",
      content: [
        { text: "This is a simple paragraph with " },
        { text: "bold text", styles: ["bold"] },
        { text: " and " },
        { text: "italic text", styles: ["italic"] },
        { text: "." },
      ],
    },
  ];

  return <MessageBlockRenderer blocks={blocks} />;
}
```

## Block Types

### Heading

Supports 6 heading levels (h1-h6):

```tsx
{
  type: "heading",
  level: 1, // 1-6
  content: [{ text: "Main Title" }]
}
```

### Paragraph

Standard text with inline formatting:

```tsx
{
  type: "paragraph",
  content: [
    { text: "Regular text " },
    { text: "bold", styles: ["bold"] },
    { text: " and " },
    { text: "italic", styles: ["italic"] },
    { text: " with a " },
    { text: "link", href: "https://example.com" }
  ]
}
```

### Image

Images with optional captions:

```tsx
{
  type: "image",
  url: "https://example.com/image.jpg",
  alt: "Description for accessibility",
  caption: "Optional caption text",
  width: 300, // optional
  height: 200 // optional
}
```

### Button

Interactive buttons with actions:

```tsx
{
  type: "button",
  text: "Click Me",
  action: "submit_form",
  url: "/some/route", // optional
  variant: "default" // "default" | "outline" | "secondary"
}
```

### Divider

Horizontal separators:

```tsx
{
  type: "divider",
  style: "solid" // "solid" | "dashed" | "dotted"
}
```

### List

Ordered or unordered lists with nesting support:

```tsx
{
  type: "list",
  ordered: false, // true for numbered lists
  items: [
    {
      content: [{ text: "First item" }]
    },
    {
      content: [{ text: "Second item with nested list" }],
      items: [
        {
          content: [{ text: "Nested item 1" }]
        },
        {
          content: [{ text: "Nested item 2" }]
        }
      ]
    }
  ]
}
```

### Quote

Blockquotes with optional author attribution:

```tsx
{
  type: "quote",
  content: [
    { text: "This is a quote with " },
    { text: "formatting", styles: ["italic"] }
  ],
  author: "Author Name" // optional
}
```

## Inline Formatting

Text content supports multiple inline styles:

- **Bold**: `{ text: "bold text", styles: ["bold"] }`
- **Italic**: `{ text: "italic text", styles: ["italic"] }`
- **Code**: `{ text: "code text", styles: ["code"] }`
- **Links**: `{ text: "link text", href: "https://example.com" }`
- **Combined**: `{ text: "bold italic", styles: ["bold", "italic"] }`

## Custom Handlers

### Link Handler

Override default link behavior:

```tsx
<MessageBlockRenderer
  blocks={blocks}
  onLinkPress={(url) => {
    console.log("Link clicked:", url);
    // Custom navigation logic
  }}
/>
```

### Button Handler

Handle button actions:

```tsx
<MessageBlockRenderer
  blocks={blocks}
  onButtonPress={(action, url) => {
    console.log("Button action:", action, url);
    // Custom action logic
  }}
/>
```

## Complete Example

```tsx
import { MessageBlockRenderer, type MessageBlock } from "@/components/ui/message-block-renderer";
import { ScrollView } from "react-native";

function MessageView() {
  const blocks: MessageBlock[] = [
    {
      type: "heading",
      level: 1,
      content: [{ text: "Project Update" }],
    },
    {
      type: "paragraph",
      content: [
        { text: "Hello team! Here's our weekly update on the " },
        { text: "mobile app", styles: ["bold"] },
        { text: " development." },
      ],
    },
    {
      type: "divider",
    },
    {
      type: "heading",
      level: 2,
      content: [{ text: "What's New" }],
    },
    {
      type: "list",
      ordered: false,
      items: [
        {
          content: [
            { text: "Implemented new " },
            { text: "MessageBlockRenderer", styles: ["code"] },
            { text: " component" },
          ],
        },
        {
          content: [{ text: "Added theme support" }],
        },
        {
          content: [{ text: "Improved navigation" }],
        },
      ],
    },
    {
      type: "image",
      url: "https://via.placeholder.com/800x400",
      alt: "Project screenshot",
      caption: "New feature in action",
    },
    {
      type: "quote",
      content: [
        { text: "The best way to predict the future is to invent it." },
      ],
      author: "Alan Kay",
    },
    {
      type: "button",
      text: "View Full Report",
      action: "view_report",
      url: "/reports/weekly",
      variant: "default",
    },
  ];

  return (
    <ScrollView style={{ flex: 1 }}>
      <MessageBlockRenderer
        blocks={blocks}
        onButtonPress={(action, url) => {
          console.log("Action:", action, "URL:", url);
        }}
      />
    </ScrollView>
  );
}
```

## Styling

The component automatically uses the app's design system:

- Respects theme colors (light/dark mode)
- Uses consistent spacing and typography
- Adapts to screen width automatically
- Follows accessibility guidelines

You can override styles by passing a `style` prop:

```tsx
<MessageBlockRenderer
  blocks={blocks}
  style={{
    paddingHorizontal: 16,
    backgroundColor: "white",
  }}
/>
```

## Type Definitions

All types are exported and can be imported:

```tsx
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
} from "@/components/ui/message-block-renderer";
```

## Performance Considerations

- Images are lazy-loaded with loading states
- Large lists are rendered efficiently
- Proper memoization prevents unnecessary re-renders
- Image sizes are calculated to fit screen width

## Accessibility

- All images include `alt` text support
- Buttons have proper accessibility roles
- Headings use semantic structure
- Links are keyboard navigable
- Proper contrast ratios maintained

## Browser/Platform Support

- iOS: Full support
- Android: Full support
- Web (via Expo): Full support with responsive design

## Contributing

When adding new block types:

1. Add the type definition in `types.ts`
2. Create a new block component in `[block-name]-block.tsx`
3. Import and handle it in `index.tsx`
4. Update this README with usage examples
