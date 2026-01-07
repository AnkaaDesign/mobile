/**
 * MessageBlockRenderer Example Usage
 *
 * This file demonstrates all the features and capabilities
 * of the MessageBlockRenderer component
 */

import React from "react";
import { ScrollView, View } from "react-native";
import { MessageBlockRenderer, type MessageBlock } from "./index";

/**
 * Example 1: Simple Message
 */
export const simpleMessageBlocks: MessageBlock[] = [
  {
    type: "heading",
    level: 1,
    content: [{ text: "Welcome!" }],
  },
  {
    type: "paragraph",
    content: [
      { text: "This is a simple message with some " },
      { text: "bold text", styles: ["bold"] },
      { text: " and " },
      { text: "italic text", styles: ["italic"] },
      { text: "." },
    ],
  },
];

/**
 * Example 2: Rich Content Message
 */
export const richContentBlocks: MessageBlock[] = [
  {
    type: "heading",
    level: 1,
    content: [{ text: "Project Update - Week 42" }],
  },
  {
    type: "paragraph",
    content: [
      { text: "Hello team! Here's a comprehensive update on our " },
      { text: "mobile application", styles: ["bold"] },
      { text: " development progress." },
    ],
  },
  {
    type: "divider",
  },
  {
    type: "heading",
    level: 2,
    content: [{ text: "Completed Tasks" }],
  },
  {
    type: "list",
    ordered: false,
    items: [
      {
        content: [
          { text: "Implemented " },
          { text: "MessageBlockRenderer", styles: ["code"] },
          { text: " component" },
        ],
      },
      {
        content: [{ text: "Added comprehensive theme support" }],
      },
      {
        content: [{ text: "Improved navigation and deep linking" }],
      },
      {
        content: [{ text: "Performance optimizations:" }],
        items: [
          { content: [{ text: "Image lazy loading" }] },
          { content: [{ text: "Memoization of expensive computations" }] },
          { content: [{ text: "Reduced re-renders" }] },
        ],
      },
    ],
  },
  {
    type: "heading",
    level: 2,
    content: [{ text: "In Progress" }],
  },
  {
    type: "list",
    ordered: true,
    items: [
      {
        content: [{ text: "User authentication improvements" }],
      },
      {
        content: [{ text: "Offline mode support" }],
      },
      {
        content: [{ text: "Push notification enhancements" }],
      },
    ],
  },
  {
    type: "image",
    url: "https://via.placeholder.com/800x400/15803d/ffffff?text=New+Feature+Demo",
    alt: "New feature demonstration",
    caption: "Screenshot of the new MessageBlockRenderer in action",
  },
  {
    type: "quote",
    content: [
      {
        text: "The attention to detail in this component is impressive. Great work!",
      },
    ],
    author: "Product Manager",
  },
  {
    type: "heading",
    level: 2,
    content: [{ text: "Next Steps" }],
  },
  {
    type: "paragraph",
    content: [
      { text: "For more details, check out our " },
      {
        text: "documentation",
        href: "https://docs.example.com",
      },
      { text: " or reach out on " },
      {
        text: "Slack",
        href: "/teams/engineering",
      },
      { text: "." },
    ],
  },
  {
    type: "button",
    text: "View Full Report",
    action: "view_report",
    url: "/reports/weekly",
    variant: "default",
  },
];

/**
 * Example 3: Documentation Style
 */
export const documentationBlocks: MessageBlock[] = [
  {
    type: "heading",
    level: 1,
    content: [{ text: "Getting Started Guide" }],
  },
  {
    type: "paragraph",
    content: [
      {
        text: "This guide will help you get started with the mobile application.",
      },
    ],
  },
  {
    type: "heading",
    level: 2,
    content: [{ text: "Installation" }],
  },
  {
    type: "paragraph",
    content: [
      { text: "First, install the required dependencies using " },
      { text: "npm install", styles: ["code"] },
      { text: ":" },
    ],
  },
  {
    type: "quote",
    content: [{ text: "npm install @ankaa/mobile", styles: ["code"] }],
  },
  {
    type: "heading",
    level: 2,
    content: [{ text: "Configuration" }],
  },
  {
    type: "paragraph",
    content: [
      { text: "Create a configuration file with the following settings:" },
    ],
  },
  {
    type: "list",
    ordered: true,
    items: [
      {
        content: [{ text: "API endpoint URL" }],
      },
      {
        content: [{ text: "Authentication credentials" }],
      },
      {
        content: [
          { text: "Theme preferences (" },
          { text: "light", styles: ["code"] },
          { text: " or " },
          { text: "dark", styles: ["code"] },
          { text: ")" },
        ],
      },
    ],
  },
  {
    type: "divider",
  },
  {
    type: "heading",
    level: 3,
    content: [{ text: "Important Notes" }],
  },
  {
    type: "list",
    ordered: false,
    items: [
      {
        content: [
          { text: "Always use " },
          { text: "HTTPS", styles: ["bold", "code"] },
          { text: " for production" },
        ],
      },
      {
        content: [{ text: "Keep your API keys secure" }],
      },
      {
        content: [
          { text: "Check the " },
          { text: "changelog", href: "/changelog" },
          { text: " for updates" },
        ],
      },
    ],
  },
  {
    type: "button",
    text: "Continue to Next Step",
    action: "next_step",
    variant: "default",
  },
];

/**
 * Example 4: Notification/Alert Style
 */
export const notificationBlocks: MessageBlock[] = [
  {
    type: "heading",
    level: 2,
    content: [{ text: "System Maintenance Scheduled" }],
  },
  {
    type: "paragraph",
    content: [
      { text: "We will be performing scheduled maintenance on " },
      { text: "Sunday, January 15th", styles: ["bold"] },
      { text: " from 2:00 AM to 6:00 AM EST." },
    ],
  },
  {
    type: "heading",
    level: 3,
    content: [{ text: "What to Expect" }],
  },
  {
    type: "list",
    ordered: false,
    items: [
      {
        content: [
          { text: "The mobile app will be " },
          { text: "temporarily unavailable", styles: ["bold"] },
        ],
      },
      {
        content: [{ text: "All data will be preserved" }],
      },
      {
        content: [{ text: "Improved performance after completion" }],
      },
    ],
  },
  {
    type: "divider",
  },
  {
    type: "paragraph",
    content: [
      { text: "For questions, contact " },
      { text: "support@example.com", href: "mailto:support@example.com" },
      { text: "." },
    ],
  },
  {
    type: "button",
    text: "Acknowledge",
    action: "acknowledge_notification",
    variant: "outline",
  },
];

/**
 * Example Component: Using MessageBlockRenderer
 */
export function MessageBlockRendererExample() {
  const handleLinkPress = (url: string) => {
    console.log("Link pressed:", url);
    // Custom link handling logic
  };

  const handleButtonPress = (action: string, url?: string) => {
    console.log("Button pressed:", action, url);
    // Custom button action logic
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <View style={{ padding: 16 }}>
        <MessageBlockRenderer
          blocks={richContentBlocks}
          onLinkPress={handleLinkPress}
          onButtonPress={handleButtonPress}
        />
      </View>
    </ScrollView>
  );
}

/**
 * Example Component: Multiple Message Sections
 */
export function MultiSectionExample() {
  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16, gap: 24 }}>
        {/* Section 1 */}
        <View>
          <MessageBlockRenderer blocks={simpleMessageBlocks} />
        </View>

        {/* Section 2 */}
        <View>
          <MessageBlockRenderer blocks={notificationBlocks} />
        </View>

        {/* Section 3 */}
        <View>
          <MessageBlockRenderer blocks={documentationBlocks} />
        </View>
      </View>
    </ScrollView>
  );
}
