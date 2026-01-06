/**
 * Deep Linking Usage Examples
 *
 * This file demonstrates how to use the deep linking system
 * throughout the Ankaa Design mobile app.
 */

import { generateDeepLink, generateUniversalLink, generateNotificationLink, ROUTE_MAP } from './deep-linking';
import { Share } from 'react-native';

// =====================================================
// Example 1: Sharing a Task via Deep Link
// =====================================================

export async function shareTask(taskId: string) {
  // Generate a universal link (works on web and in-app)
  const link = generateUniversalLink('Task', taskId);

  try {
    await Share.share({
      message: `Check out this task: ${link}`,
      url: link, // iOS only
      title: 'Share Task',
    });
  } catch (error) {
    console.error('Error sharing task:', error);
  }
}

// =====================================================
// Example 2: Sharing an Order via Custom Scheme
// =====================================================

export function getOrderDeepLink(orderId: string): string {
  // Generate a custom scheme deep link (ankaadesign://order/123)
  return generateDeepLink('Order', orderId);
}

// =====================================================
// Example 3: Generating QR Code for Service Order
// =====================================================

export async function generateServiceOrderQRCode(serviceOrderId: string): Promise<string> {
  // Use universal link for QR codes (better compatibility)
  const link = generateUniversalLink('ServiceOrder', serviceOrderId);

  // Use a QR code library to generate the QR code
  // Example with 'qrcode' library:
  // const QRCode = require('qrcode');
  // const qrCodeDataUrl = await QRCode.toDataURL(link);
  // return qrCodeDataUrl;

  return link; // Return link for demo purposes
}

// =====================================================
// Example 4: Email Integration
// =====================================================

export function generateEmployeeEmailLink(employeeId: string): string {
  // Generate universal link for email
  const link = generateUniversalLink('Employee', employeeId);

  // HTML email template
  const emailHtml = `
    <html>
      <body>
        <h2>Employee Profile Updated</h2>
        <p>Click the link below to view the updated profile:</p>
        <a href="${link}">View Employee Profile</a>
      </body>
    </html>
  `;

  return emailHtml;
}

// =====================================================
// Example 5: Push Notification with Deep Link
// =====================================================

export interface PushNotificationPayload {
  title: string;
  body: string;
  data: {
    url?: string;
    entityType?: string;
    entityId?: string;
  };
}

export function createTaskNotificationPayload(taskId: string, taskTitle: string): PushNotificationPayload {
  // Option 1: Using notification link format
  const notificationLink = generateNotificationLink('Task', taskId);

  return {
    title: 'New Task Assigned',
    body: `You have been assigned: ${taskTitle}`,
    data: {
      url: notificationLink,
    },
  };
}

export function createOrderNotificationPayload(orderId: string, orderNumber: string): PushNotificationPayload {
  // Option 2: Using entity type and ID (will be converted to deep link)
  return {
    title: 'Order Updated',
    body: `Order ${orderNumber} has been updated`,
    data: {
      entityType: 'Order',
      entityId: orderId,
    },
  };
}

// =====================================================
// Example 6: SMS Integration
// =====================================================

export function generateOrderSMSMessage(orderId: string, orderNumber: string): string {
  const link = generateUniversalLink('Order', orderId);

  return `Your order ${orderNumber} is ready for pickup. View details: ${link}`;
}

// =====================================================
// Example 7: In-App Navigation Helper
// =====================================================

export function navigateToEntity(entityType: keyof typeof ROUTE_MAP, entityId: string) {
  const { router } = require('expo-router');

  // Get the route from the route map
  const route = ROUTE_MAP[entityType];

  if (route) {
    // Replace [id] placeholder with actual ID
    const finalRoute = route.replace('[id]', entityId);

    // Navigate to the route
    router.push(finalRoute);
  } else {
    console.error(`No route found for entity type: ${entityType}`);
    router.push('/(tabs)'); // Fallback to home
  }
}

// Usage:
// navigateToEntity('Task', '123');
// navigateToEntity('Order', '456');

// =====================================================
// Example 8: Batch Share Multiple Items
// =====================================================

export async function shareMultipleItems(items: Array<{ type: keyof typeof ROUTE_MAP; id: string; title: string }>) {
  const links = items.map((item) => {
    const link = generateUniversalLink(item.type, item.id);
    return `- ${item.title}: ${link}`;
  });

  const message = `Check out these items:\n\n${links.join('\n')}`;

  try {
    await Share.share({
      message,
      title: 'Shared Items',
    });
  } catch (error) {
    console.error('Error sharing items:', error);
  }
}

// Usage:
// shareMultipleItems([
//   { type: 'Task', id: '123', title: 'Install Graphics' },
//   { type: 'Order', id: '456', title: 'Order #456' },
// ]);

// =====================================================
// Example 9: Copy Link to Clipboard
// =====================================================

export async function copyTaskLinkToClipboard(taskId: string) {
  const Clipboard = require('@react-native-clipboard/clipboard');
  const link = generateUniversalLink('Task', taskId);

  Clipboard.setString(link);

  // Show success message
  const { Alert } = require('react-native');
  Alert.alert('Link Copied', 'The task link has been copied to your clipboard');
}

// =====================================================
// Example 10: Generate Link for Different Contexts
// =====================================================

export function getEntityLink(
  entityType: keyof typeof ROUTE_MAP,
  entityId: string,
  context: 'share' | 'notification' | 'email' | 'qr'
): string {
  switch (context) {
    case 'share':
    case 'email':
    case 'qr':
      // Use universal links for better compatibility
      return generateUniversalLink(entityType, entityId);

    case 'notification':
      // Use notification link format for push notifications
      return generateNotificationLink(entityType, entityId);

    default:
      // Default to custom scheme
      return generateDeepLink(entityType, entityId);
  }
}

// Usage:
// const shareLink = getEntityLink('Task', '123', 'share');
// const notifLink = getEntityLink('Task', '123', 'notification');
// const emailLink = getEntityLink('Task', '123', 'email');

// =====================================================
// Example 11: Handling Deep Link from External Source
// =====================================================

export async function handleExternalDeepLink(url: string) {
  const { handleDeepLink } = require('./deep-linking');
  const { useAuth } = require('@/contexts/auth-context');

  // Get authentication status
  // Note: This is a simplified example - in reality you'd get this from context
  const isAuthenticated = false; // Replace with actual auth check

  try {
    await handleDeepLink(url, isAuthenticated);
  } catch (error) {
    console.error('Error handling external deep link:', error);
    // Show error to user
    const { Alert } = require('react-native');
    Alert.alert('Error', 'Unable to open the link. Please try again.');
  }
}

// =====================================================
// Example 12: Building Dynamic Link with Query Params
// =====================================================

export function generateTaskLinkWithFilters(taskId: string, filters?: Record<string, string>): string {
  const baseLink = generateUniversalLink('Task', taskId);

  if (!filters || Object.keys(filters).length === 0) {
    return baseLink;
  }

  // Add query parameters
  const queryString = Object.entries(filters)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  return `${baseLink}?${queryString}`;
}

// Usage:
// const linkWithFilters = generateTaskLinkWithFilters('123', { view: 'timeline', tab: 'details' });
// Result: https://ankaadesign.com/app/task/123?view=timeline&tab=details

// =====================================================
// Example 13: Generating Links for Related Entities
// =====================================================

export function generateRelatedLinksForTask(taskData: {
  id: string;
  serviceOrderId?: string;
  customerId?: string;
  employeeIds?: string[];
}) {
  const links: Record<string, string> = {
    task: generateUniversalLink('Task', taskData.id),
  };

  if (taskData.serviceOrderId) {
    links.serviceOrder = generateUniversalLink('ServiceOrder', taskData.serviceOrderId);
  }

  if (taskData.customerId) {
    links.customer = generateUniversalLink('Customer', taskData.customerId);
  }

  if (taskData.employeeIds && taskData.employeeIds.length > 0) {
    links.employees = taskData.employeeIds.map((id) => generateUniversalLink('Employee', id));
  }

  return links;
}

// =====================================================
// Example 14: Testing Deep Links in Development
// =====================================================

export function testDeepLinks() {
  console.log('=== Deep Link Examples ===');

  // Test custom scheme
  console.log('Custom Scheme:', generateDeepLink('Task', '123'));

  // Test universal link
  console.log('Universal Link:', generateUniversalLink('Order', '456'));

  // Test notification link
  console.log('Notification Link:', generateNotificationLink('Employee', '789'));

  // Test all entity types
  const entityTypes: Array<keyof typeof ROUTE_MAP> = [
    'Task',
    'Order',
    'Employee',
    'ServiceOrder',
    'Item',
    'Borrow',
  ];

  entityTypes.forEach((type) => {
    console.log(`${type}:`, generateDeepLink(type, '999'));
  });
}

// Run in development:
// testDeepLinks();

// =====================================================
// Example 15: Validating Deep Link Before Sharing
// =====================================================

export async function validateAndShareLink(
  entityType: keyof typeof ROUTE_MAP,
  entityId: string
): Promise<boolean> {
  // Check if entity exists (make API call)
  // const entityExists = await checkEntityExists(entityType, entityId);

  // if (!entityExists) {
  //   Alert.alert('Error', 'This item no longer exists');
  //   return false;
  // }

  // Generate and share link
  const link = generateUniversalLink(entityType, entityId);

  try {
    await Share.share({
      message: link,
      title: `Share ${entityType}`,
    });
    return true;
  } catch (error) {
    console.error('Error sharing:', error);
    return false;
  }
}
