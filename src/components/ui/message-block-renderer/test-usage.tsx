/**
 * Test Usage Example for MessageBlockRenderer
 *
 * This file demonstrates how to use the MessageBlockRenderer
 * in a real-world scenario within the mobile app.
 */

import React from "react";
import { ScrollView, View, Alert } from "react-native";
import { MessageBlockRenderer, type MessageBlock } from "@/components/ui/message-block-renderer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useRouter } from "expo-router";
import { Linking } from "react-native";

/**
 * Example: Notification Detail Screen
 */
export function NotificationDetailScreen() {
  const router = useRouter();

  // Sample notification data that would come from your API
  const notificationBlocks: MessageBlock[] = [
    {
      type: "heading",
      level: 1,
      content: [{ text: "New Task Assigned" }],
    },
    {
      type: "paragraph",
      content: [
        { text: "You have been assigned a new task: " },
        { text: "Complete Monthly Report", styles: ["bold"] },
        { text: "." },
      ],
    },
    {
      type: "divider",
    },
    {
      type: "heading",
      level: 2,
      content: [{ text: "Task Details" }],
    },
    {
      type: "list",
      ordered: false,
      items: [
        {
          content: [
            { text: "Due Date: " },
            { text: "January 31, 2026", styles: ["bold"] },
          ],
        },
        {
          content: [
            { text: "Priority: " },
            { text: "High", styles: ["bold"] },
          ],
        },
        {
          content: [{ text: "Assigned by: Project Manager" }],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        { text: "For more information, visit the " },
        { text: "task details page", href: "/tasks/123" },
        { text: " or check the " },
        { text: "project documentation", href: "https://docs.example.com/projects" },
        { text: "." },
      ],
    },
    {
      type: "button",
      text: "View Task",
      action: "view_task",
      url: "/tasks/123",
      variant: "default",
    },
  ];

  const handleButtonPress = (action: string, url?: string) => {
    switch (action) {
      case "view_task":
        if (url) {
          router.push(url as any);
        }
        break;
      default:
        console.log("Unknown action:", action);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <Card>
          <CardContent>
            <MessageBlockRenderer
              blocks={notificationBlocks}
              onButtonPress={handleButtonPress}
            />
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}

/**
 * Example: Help/Documentation Screen
 */
export function HelpDocumentationScreen() {
  const helpContent: MessageBlock[] = [
    {
      type: "heading",
      level: 1,
      content: [{ text: "How to Use the Mobile App" }],
    },
    {
      type: "paragraph",
      content: [
        {
          text: "Welcome to the mobile app! This guide will help you get started.",
        },
      ],
    },
    {
      type: "image",
      url: "https://via.placeholder.com/800x400/15803d/ffffff?text=App+Overview",
      alt: "App overview screenshot",
      caption: "Main dashboard view",
    },
    {
      type: "heading",
      level: 2,
      content: [{ text: "Getting Started" }],
    },
    {
      type: "list",
      ordered: true,
      items: [
        {
          content: [{ text: "Log in with your credentials" }],
        },
        {
          content: [{ text: "Navigate using the bottom tabs" }],
        },
        {
          content: [{ text: "Access your tasks and notifications" }],
        },
        {
          content: [
            { text: "Customize settings in the " },
            { text: "Settings", styles: ["bold"] },
            { text: " menu" },
          ],
        },
      ],
    },
    {
      type: "heading",
      level: 2,
      content: [{ text: "Key Features" }],
    },
    {
      type: "list",
      ordered: false,
      items: [
        {
          content: [
            { text: "Task Management", styles: ["bold"] },
            { text: " - Create, update, and track your tasks" },
          ],
        },
        {
          content: [
            { text: "Inventory", styles: ["bold"] },
            { text: " - Monitor stock levels and orders" },
          ],
        },
        {
          content: [
            { text: "Production", styles: ["bold"] },
            { text: " - Track service orders and production status" },
          ],
        },
      ],
    },
    {
      type: "divider",
    },
    {
      type: "quote",
      content: [
        {
          text: "If you need assistance, our support team is here to help 24/7.",
        },
      ],
    },
    {
      type: "button",
      text: "Contact Support",
      action: "contact_support",
      url: "mailto:support@example.com",
      variant: "outline",
    },
  ];

  const handleButtonPress = (action: string, url?: string) => {
    if (action === "contact_support" && url) {
      Linking.openURL(url);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <MessageBlockRenderer
          blocks={helpContent}
          onButtonPress={handleButtonPress}
        />
      </View>
    </ScrollView>
  );
}

/**
 * Example: System Announcement
 */
export function SystemAnnouncementCard() {
  const announcement: MessageBlock[] = [
    {
      type: "heading",
      level: 2,
      content: [{ text: "New Features Available!" }],
    },
    {
      type: "paragraph",
      content: [
        { text: "We've released several exciting updates to improve your experience:" },
      ],
    },
    {
      type: "list",
      ordered: false,
      items: [
        {
          content: [
            { text: "Dark mode support", styles: ["bold"] },
          ],
        },
        {
          content: [
            { text: "Enhanced performance and faster loading times" },
          ],
        },
        {
          content: [
            { text: "New " },
            { text: "MessageBlockRenderer", styles: ["code"] },
            { text: " for rich content" },
          ],
        },
        {
          content: [
            { text: "Improved offline capabilities" },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        { text: "Read the full " },
        { text: "changelog", href: "/changelog" },
        { text: " to learn more." },
      ],
    },
  ];

  return (
    <Card>
      <CardContent>
        <MessageBlockRenderer blocks={announcement} />
      </CardContent>
    </Card>
  );
}

/**
 * Example: Complex Multi-Section Content
 */
export function ComplexContentExample() {
  const router = useRouter();

  const complexContent: MessageBlock[] = [
    {
      type: "heading",
      level: 1,
      content: [{ text: "Monthly Production Report" }],
    },
    {
      type: "paragraph",
      content: [
        { text: "Summary of production activities for " },
        { text: "December 2025", styles: ["bold"] },
        { text: "." },
      ],
    },
    {
      type: "divider",
    },
    {
      type: "heading",
      level: 2,
      content: [{ text: "Key Metrics" }],
    },
    {
      type: "list",
      ordered: false,
      items: [
        {
          content: [
            { text: "Total Tasks Completed: " },
            { text: "247", styles: ["bold"] },
          ],
        },
        {
          content: [
            { text: "Service Orders: " },
            { text: "89", styles: ["bold"] },
          ],
        },
        {
          content: [
            { text: "Efficiency Rate: " },
            { text: "94.5%", styles: ["bold"] },
          ],
        },
      ],
    },
    {
      type: "heading",
      level: 2,
      content: [{ text: "Highlights" }],
    },
    {
      type: "paragraph",
      content: [
        { text: "This month showed " },
        { text: "exceptional performance", styles: ["bold"] },
        { text: " across all departments. Special recognition to the " },
        { text: "Production Team", styles: ["italic"] },
        { text: " for exceeding targets." },
      ],
    },
    {
      type: "image",
      url: "https://via.placeholder.com/800x400/15803d/ffffff?text=Performance+Chart",
      alt: "Monthly performance chart",
      caption: "Production metrics for December 2025",
    },
    {
      type: "heading",
      level: 2,
      content: [{ text: "Areas for Improvement" }],
    },
    {
      type: "list",
      ordered: true,
      items: [
        {
          content: [{ text: "Reduce material waste by 5%" }],
        },
        {
          content: [{ text: "Improve communication between shifts" }],
        },
        {
          content: [{ text: "Streamline quality control processes" }],
          items: [
            {
              content: [{ text: "Implement automated checks" }],
            },
            {
              content: [{ text: "Add additional QC checkpoints" }],
            },
          ],
        },
      ],
    },
    {
      type: "quote",
      content: [
        {
          text: "Quality is never an accident; it is always the result of intelligent effort.",
        },
      ],
      author: "John Ruskin",
    },
    {
      type: "divider",
    },
    {
      type: "heading",
      level: 2,
      content: [{ text: "Next Steps" }],
    },
    {
      type: "paragraph",
      content: [
        { text: "Review the detailed metrics in the " },
        { text: "analytics dashboard", href: "/analytics" },
        { text: " or download the " },
        { text: "full PDF report", href: "/reports/december-2025.pdf" },
        { text: "." },
      ],
    },
    {
      type: "button",
      text: "View Analytics Dashboard",
      action: "view_analytics",
      url: "/analytics",
      variant: "default",
    },
  ];

  const handleButtonPress = (action: string, url?: string) => {
    if (action === "view_analytics" && url) {
      router.push(url as any);
    }
  };

  const handleLinkPress = (url: string) => {
    if (url.startsWith("/")) {
      router.push(url as any);
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <MessageBlockRenderer
          blocks={complexContent}
          onLinkPress={handleLinkPress}
          onButtonPress={handleButtonPress}
        />
      </View>
    </ScrollView>
  );
}

/**
 * Example: Error/Alert Message
 */
export function ErrorAlertExample() {
  const errorMessage: MessageBlock[] = [
    {
      type: "heading",
      level: 2,
      content: [{ text: "Action Required" }],
    },
    {
      type: "paragraph",
      content: [
        { text: "Your session is about to expire. Please " },
        { text: "save your work", styles: ["bold"] },
        { text: " and log in again to continue." },
      ],
    },
    {
      type: "button",
      text: "Log In Again",
      action: "login",
      url: "/auth/login",
      variant: "default",
    },
  ];

  return (
    <Card>
      <CardContent>
        <MessageBlockRenderer blocks={errorMessage} />
      </CardContent>
    </Card>
  );
}
