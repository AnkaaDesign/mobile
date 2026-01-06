/**
 * Example: Scheduling Notifications
 *
 * This example shows how to schedule local notifications for different scenarios.
 */

import React, { useState } from 'react';
import { Button, View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import {
  scheduleTaskNotification,
  scheduleOrderNotification,
  schedulePPENotification,
  scheduleLocalNotification,
  scheduleDailyNotification,
  scheduleWeeklyNotification,
  scheduleReminder,
  cancelScheduledNotification,
  cancelAllScheduledNotifications,
  getAllScheduledNotifications,
} from '@/services/notifications';

export default function SchedulingNotificationsExample() {
  const [scheduledIds, setScheduledIds] = useState<string[]>([]);

  /**
   * Schedule a task reminder for 1 hour from now
   */
  async function scheduleTaskReminder() {
    try {
      const notificationTime = new Date();
      notificationTime.setHours(notificationTime.getHours() + 1);

      const notificationId = await scheduleTaskNotification(
        'task-123',
        'Task Due Soon',
        'Your task "Complete Project Report" is due in 1 hour',
        notificationTime,
        {
          importance: 'HIGH',
          requiresAction: true,
        }
      );

      setScheduledIds((prev) => [...prev, notificationId]);

      Alert.alert('Success', 'Task reminder scheduled for 1 hour from now');
      console.log('Scheduled task notification:', notificationId);
    } catch (error) {
      Alert.alert('Error', `Failed to schedule notification: ${error}`);
    }
  }

  /**
   * Schedule an order delivery notification
   */
  async function scheduleOrderDelivery() {
    try {
      const deliveryTime = new Date();
      deliveryTime.setDate(deliveryTime.getDate() + 2); // 2 days from now
      deliveryTime.setHours(14, 0, 0, 0); // 2:00 PM

      const notificationId = await scheduleOrderNotification(
        'order-456',
        'Order Arriving Soon',
        'Your order is expected to arrive today',
        deliveryTime
      );

      setScheduledIds((prev) => [...prev, notificationId]);

      Alert.alert('Success', 'Order delivery notification scheduled');
      console.log('Scheduled order notification:', notificationId);
    } catch (error) {
      Alert.alert('Error', `Failed to schedule notification: ${error}`);
    }
  }

  /**
   * Schedule a PPE request approval reminder
   */
  async function schedulePPEReminder() {
    try {
      const reminderTime = new Date();
      reminderTime.setMinutes(reminderTime.getMinutes() + 30); // 30 minutes from now

      const notificationId = await schedulePPENotification(
        'ppe-request-789',
        'PPE Request Pending',
        'You have a pending PPE request that needs approval',
        reminderTime
      );

      setScheduledIds((prev) => [...prev, notificationId]);

      Alert.alert('Success', 'PPE reminder scheduled for 30 minutes from now');
      console.log('Scheduled PPE notification:', notificationId);
    } catch (error) {
      Alert.alert('Error', `Failed to schedule notification: ${error}`);
    }
  }

  /**
   * Schedule a custom notification with specific data
   */
  async function scheduleCustomNotification() {
    try {
      const notificationTime = new Date();
      notificationTime.setMinutes(notificationTime.getMinutes() + 5); // 5 minutes from now

      const notificationId = await scheduleLocalNotification(
        {
          title: 'Custom Notification',
          body: 'This is a custom notification with specific data',
          data: {
            screen: 'CustomScreen',
            params: { customId: '12345' },
            customField: 'customValue',
          },
          sound: true,
          badge: 1,
        },
        notificationTime
      );

      setScheduledIds((prev) => [...prev, notificationId]);

      Alert.alert('Success', 'Custom notification scheduled for 5 minutes from now');
      console.log('Scheduled custom notification:', notificationId);
    } catch (error) {
      Alert.alert('Error', `Failed to schedule notification: ${error}`);
    }
  }

  /**
   * Schedule a daily reminder at 9:00 AM
   */
  async function scheduleDailyReminder() {
    try {
      const notificationId = await scheduleDailyNotification(
        {
          title: 'Daily Reminder',
          body: "Don't forget to check your tasks for today!",
          data: {
            screen: 'TaskList',
          },
        },
        9, // Hour (9 AM)
        0 // Minute
      );

      setScheduledIds((prev) => [...prev, notificationId]);

      Alert.alert('Success', 'Daily reminder scheduled for 9:00 AM');
      console.log('Scheduled daily notification:', notificationId);
    } catch (error) {
      Alert.alert('Error', `Failed to schedule notification: ${error}`);
    }
  }

  /**
   * Schedule a weekly reminder for Monday at 10:00 AM
   */
  async function scheduleWeeklyReminder() {
    try {
      const notificationId = await scheduleWeeklyNotification(
        {
          title: 'Weekly Review',
          body: "Time for your weekly review. Let's check your progress!",
          data: {
            screen: 'WeeklyReview',
          },
        },
        2, // Weekday (2 = Monday, 1 = Sunday)
        10, // Hour (10 AM)
        0 // Minute
      );

      setScheduledIds((prev) => [...prev, notificationId]);

      Alert.alert('Success', 'Weekly reminder scheduled for Mondays at 10:00 AM');
      console.log('Scheduled weekly notification:', notificationId);
    } catch (error) {
      Alert.alert('Error', `Failed to schedule notification: ${error}`);
    }
  }

  /**
   * Schedule a reminder with snooze functionality
   */
  async function scheduleReminderWithSnooze() {
    try {
      const reminderTime = new Date();
      reminderTime.setMinutes(reminderTime.getMinutes() + 10);

      const notificationId = await scheduleReminder(
        'original-notif-id',
        {
          title: 'Reminder',
          body: 'This is a snoozed reminder',
          data: {
            screen: 'ReminderDetail',
            isReminder: true,
          },
        },
        reminderTime
      );

      setScheduledIds((prev) => [...prev, notificationId]);

      Alert.alert('Success', 'Reminder scheduled for 10 minutes from now');
      console.log('Scheduled reminder:', notificationId);
    } catch (error) {
      Alert.alert('Error', `Failed to schedule notification: ${error}`);
    }
  }

  /**
   * View all scheduled notifications
   */
  async function viewScheduledNotifications() {
    try {
      const scheduled = await getAllScheduledNotifications();

      if (scheduled.length === 0) {
        Alert.alert('Scheduled Notifications', 'No notifications scheduled');
        return;
      }

      const message = scheduled
        .map((notif, index) => {
          const trigger = notif.trigger as any;
          const time = trigger.date
            ? new Date(trigger.date).toLocaleString()
            : 'Unknown';

          return `${index + 1}. ${notif.content.title}\n   Scheduled: ${time}`;
        })
        .join('\n\n');

      Alert.alert('Scheduled Notifications', message);
    } catch (error) {
      Alert.alert('Error', `Failed to get scheduled notifications: ${error}`);
    }
  }

  /**
   * Cancel the first scheduled notification
   */
  async function cancelFirstNotification() {
    if (scheduledIds.length === 0) {
      Alert.alert('No Notifications', 'No scheduled notifications to cancel');
      return;
    }

    try {
      const idToCancel = scheduledIds[0];
      await cancelScheduledNotification(idToCancel);

      setScheduledIds((prev) => prev.filter((id) => id !== idToCancel));

      Alert.alert('Success', 'Notification cancelled');
      console.log('Cancelled notification:', idToCancel);
    } catch (error) {
      Alert.alert('Error', `Failed to cancel notification: ${error}`);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async function cancelAllNotifications() {
    try {
      await cancelAllScheduledNotifications();
      setScheduledIds([]);

      Alert.alert('Success', 'All scheduled notifications cancelled');
    } catch (error) {
      Alert.alert('Error', `Failed to cancel notifications: ${error}`);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Scheduling Notifications</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>One-Time Notifications</Text>

        <Button title="Schedule Task Reminder (1 hour)" onPress={scheduleTaskReminder} />

        <Button title="Schedule Order Delivery (2 days)" onPress={scheduleOrderDelivery} />

        <Button title="Schedule PPE Reminder (30 min)" onPress={schedulePPEReminder} />

        <Button title="Schedule Custom Notification (5 min)" onPress={scheduleCustomNotification} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recurring Notifications</Text>

        <Button title="Schedule Daily Reminder (9 AM)" onPress={scheduleDailyReminder} />

        <Button
          title="Schedule Weekly Reminder (Mon 10 AM)"
          onPress={scheduleWeeklyReminder}
        />

        <Button title="Schedule Reminder with Snooze" onPress={scheduleReminderWithSnooze} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage Scheduled</Text>

        <Text style={styles.info}>Scheduled: {scheduledIds.length} notification(s)</Text>

        <Button title="View All Scheduled" onPress={viewScheduledNotifications} />

        <Button
          title="Cancel First Notification"
          onPress={cancelFirstNotification}
          disabled={scheduledIds.length === 0}
        />

        <Button
          title="Cancel All Notifications"
          onPress={cancelAllNotifications}
          color="#FF6B6B"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
});
