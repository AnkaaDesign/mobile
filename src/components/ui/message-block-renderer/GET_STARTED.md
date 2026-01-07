# Get Started with MessageBlockRenderer

## Quick Start (2 Minutes)

### Step 1: Import the Component

```typescript
import { MessageBlockRenderer, type MessageBlock } from "@/components/ui/message-block-renderer";
```

### Step 2: Create Your Content

```typescript
const blocks: MessageBlock[] = [
  {
    type: "heading",
    level: 1,
    content: [{ text: "Hello World!" }],
  },
  {
    type: "paragraph",
    content: [
      { text: "This is my first message with " },
      { text: "bold text", styles: ["bold"] },
      { text: "!" },
    ],
  },
];
```

### Step 3: Render It

```typescript
function MyScreen() {
  return (
    <View style={{ padding: 16 }}>
      <MessageBlockRenderer blocks={blocks} />
    </View>
  );
}
```

That's it! You're ready to go.

---

## Complete Example (5 Minutes)

Let's build a notification screen with rich content:

```typescript
import React from "react";
import { ScrollView, View } from "react-native";
import { MessageBlockRenderer, type MessageBlock } from "@/components/ui/message-block-renderer";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "expo-router";

export function NotificationScreen() {
  const router = useRouter();

  const notificationContent: MessageBlock[] = [
    // Title
    {
      type: "heading",
      level: 1,
      content: [{ text: "New Task Assigned" }],
    },

    // Description
    {
      type: "paragraph",
      content: [
        { text: "You have been assigned to: " },
        { text: "Complete Monthly Report", styles: ["bold"] },
      ],
    },

    // Separator
    {
      type: "divider",
    },

    // Details Section
    {
      type: "heading",
      level: 2,
      content: [{ text: "Task Details" }],
    },

    // Details List
    {
      type: "list",
      ordered: false,
      items: [
        {
          content: [
            { text: "Priority: " },
            { text: "High", styles: ["bold"] },
          ],
        },
        {
          content: [
            { text: "Due Date: " },
            { text: "Jan 31, 2026", styles: ["bold"] },
          ],
        },
        {
          content: [{ text: "Assigned by: Project Manager" }],
        },
      ],
    },

    // Image
    {
      type: "image",
      url: "https://via.placeholder.com/600x300",
      alt: "Task details",
      caption: "Project timeline overview",
    },

    // Quote
    {
      type: "quote",
      content: [
        { text: "Please complete this task by the due date." },
      ],
      author: "Project Manager",
    },

    // Action Button
    {
      type: "button",
      text: "View Task Details",
      action: "view_task",
      url: "/tasks/123",
      variant: "default",
    },
  ];

  const handleButtonPress = (action: string, url?: string) => {
    if (action === "view_task" && url) {
      router.push(url as any);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <Card>
          <CardContent>
            <MessageBlockRenderer
              blocks={notificationContent}
              onButtonPress={handleButtonPress}
            />
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}
```

---

## Common Use Cases

### 1. Simple Notification

```typescript
const notification: MessageBlock[] = [
  {
    type: "heading",
    level: 2,
    content: [{ text: "System Update" }],
  },
  {
    type: "paragraph",
    content: [{ text: "The app has been updated to version 2.0." }],
  },
];
```

### 2. Article with Image

```typescript
const article: MessageBlock[] = [
  {
    type: "heading",
    level: 1,
    content: [{ text: "New Features Released" }],
  },
  {
    type: "paragraph",
    content: [{ text: "We're excited to announce..." }],
  },
  {
    type: "image",
    url: "https://example.com/feature.jpg",
    alt: "New feature screenshot",
    caption: "The new dashboard design",
  },
  {
    type: "paragraph",
    content: [
      { text: "Learn more in our " },
      { text: "documentation", href: "https://docs.example.com" },
    ],
  },
];
```

### 3. How-To Guide

```typescript
const guide: MessageBlock[] = [
  {
    type: "heading",
    level: 1,
    content: [{ text: "Getting Started" }],
  },
  {
    type: "paragraph",
    content: [{ text: "Follow these steps:" }],
  },
  {
    type: "list",
    ordered: true,
    items: [
      { content: [{ text: "Open the app" }] },
      { content: [{ text: "Navigate to Settings" }] },
      { content: [{ text: "Enable notifications" }] },
    ],
  },
  {
    type: "button",
    text: "Go to Settings",
    action: "open_settings",
    url: "/settings",
  },
];
```

### 4. Alert Message

```typescript
const alert: MessageBlock[] = [
  {
    type: "heading",
    level: 2,
    content: [{ text: "Action Required" }],
  },
  {
    type: "paragraph",
    content: [
      { text: "Your password will expire in " },
      { text: "3 days", styles: ["bold"] },
      { text: ". Please update it." },
    ],
  },
  {
    type: "button",
    text: "Update Password",
    action: "update_password",
    url: "/profile/password",
    variant: "default",
  },
];
```

---

## Customization

### Custom Link Handler

Handle links your own way:

```typescript
<MessageBlockRenderer
  blocks={blocks}
  onLinkPress={(url) => {
    // Log analytics
    console.log("Link clicked:", url);

    // Custom navigation logic
    if (url.includes("/special")) {
      // Do something special
    } else {
      // Default behavior
      Linking.openURL(url);
    }
  }}
/>
```

### Custom Button Handler

Handle button actions:

```typescript
<MessageBlockRenderer
  blocks={blocks}
  onButtonPress={(action, url) => {
    switch (action) {
      case "submit":
        handleSubmit();
        break;
      case "cancel":
        handleCancel();
        break;
      default:
        // Navigate to URL if provided
        if (url) router.push(url as any);
    }
  }}
/>
```

### Custom Styling

Override container style:

```typescript
<MessageBlockRenderer
  blocks={blocks}
  style={{
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 12,
  }}
/>
```

---

## Tips for Success

### 1. Use TypeScript

Let TypeScript guide you:

```typescript
// ✅ Good - Type-safe
const blocks: MessageBlock[] = [
  { type: "heading", level: 1, content: [{ text: "Title" }] }
];

// ❌ Bad - No type safety
const blocks = [
  { type: "heading", level: 1, content: [{ text: "Title" }] }
];
```

### 2. Validate API Data

If blocks come from an API, validate them:

```typescript
function isValidMessageBlock(block: any): block is MessageBlock {
  return (
    block &&
    typeof block === "object" &&
    typeof block.type === "string" &&
    ["heading", "paragraph", "image", "button", "divider", "list", "quote"].includes(block.type)
  );
}

const validBlocks = apiData.blocks.filter(isValidMessageBlock);
```

### 3. Handle Loading States

Show loading while fetching:

```typescript
function MessageScreen() {
  const [blocks, setBlocks] = useState<MessageBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlocks().then(setBlocks).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator />;

  return <MessageBlockRenderer blocks={blocks} />;
}
```

### 4. Test Both Themes

Always test in light and dark mode:

```typescript
// Use theme toggle in Settings to test both modes
```

### 5. Keep Content Concise

Mobile screens are small:

```typescript
// ✅ Good - Concise
"Task assigned. Due Jan 31."

// ❌ Too long - Hard to read on mobile
"You have been assigned a new task that needs to be completed by January 31st, 2026 at 11:59 PM EST."
```

---

## Next Steps

1. **Read the documentation**
   - `README.md` - Complete guide
   - `QUICK_REFERENCE.md` - Fast lookup
   - `ARCHITECTURE.md` - Technical details

2. **Try the examples**
   - Check `example.tsx` for code samples
   - Review `test-usage.tsx` for real-world patterns

3. **Integrate into your app**
   - Start with a simple notification screen
   - Add to existing screens gradually
   - Customize handlers as needed

4. **Experiment**
   - Try different block combinations
   - Test inline formatting
   - Play with variants and styles

---

## Need Help?

- **Type errors?** Check that your blocks match the `MessageBlock` type exactly
- **Styling issues?** Verify theme is initialized properly
- **Links not working?** Check URL format and handlers
- **Images not loading?** Verify URLs are accessible

Check the documentation files for detailed troubleshooting and examples.

---

## Quick Reference

All block types at a glance:

```typescript
// Heading
{ type: "heading", level: 1, content: [...] }

// Paragraph
{ type: "paragraph", content: [...] }

// Image
{ type: "image", url: "...", alt: "...", caption: "..." }

// Button
{ type: "button", text: "...", action: "...", variant: "..." }

// Divider
{ type: "divider", style: "solid" }

// List
{ type: "list", ordered: false, items: [...] }

// Quote
{ type: "quote", content: [...], author: "..." }

// Inline formatting
{ text: "bold", styles: ["bold"] }
{ text: "italic", styles: ["italic"] }
{ text: "code", styles: ["code"] }
{ text: "link", href: "https://..." }
```

Happy coding! 🚀
