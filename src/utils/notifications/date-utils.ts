/**
 * Date utility functions for notification grouping and formatting
 */

/**
 * Format notification date as relative time (e.g., "2 hours ago")
 */
export function formatNotificationTime(date: Date | string): string {
  const notificationDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

  // Just now (< 1 minute)
  if (diffInSeconds < 60) {
    return 'Agora mesmo';
  }

  // Minutes ago
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? '1 minuto atrás' : `${diffInMinutes} minutos atrás`;
  }

  // Hours ago
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hora atrás' : `${diffInHours} horas atrás`;
  }

  // Days ago
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays === 1 ? '1 dia atrás' : `${diffInDays} dias atrás`;
  }

  // Weeks ago
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? '1 semana atrás' : `${diffInWeeks} semanas atrás`;
  }

  // Months ago
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? '1 mês atrás' : `${diffInMonths} meses atrás`;
  }

  // Years ago
  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? '1 ano atrás' : `${diffInYears} anos atrás`;
}

/**
 * Check if a date is today
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is yesterday
 */
function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Check if a date is within the last 7 days (excluding today and yesterday)
 */
function isThisWeek(date: Date): boolean {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  return date > sevenDaysAgo && !isToday(date) && !isYesterday(date);
}

/**
 * Group notifications by date sections
 */
export type DateSection = 'Hoje' | 'Ontem' | 'Esta Semana' | 'Mais Antigos';

export function getDateSection(date: Date | string): DateSection {
  const notificationDate = typeof date === 'string' ? new Date(date) : date;

  if (isToday(notificationDate)) {
    return 'Hoje';
  }

  if (isYesterday(notificationDate)) {
    return 'Ontem';
  }

  if (isThisWeek(notificationDate)) {
    return 'Esta Semana';
  }

  return 'Mais Antigos';
}

/**
 * Group notifications into sections by date
 */
export interface NotificationSection<T> {
  title: DateSection;
  data: T[];
}

export function groupNotificationsByDate<T extends { createdAt: Date | string }>(
  notifications: T[]
): NotificationSection<T>[] {
  const sections: Record<DateSection, T[]> = {
    'Hoje': [],
    'Ontem': [],
    'Esta Semana': [],
    'Mais Antigos': [],
  };

  // Group notifications
  notifications.forEach((notification) => {
    const section = getDateSection(notification.createdAt);
    sections[section].push(notification);
  });

  // Convert to array format and filter out empty sections
  const sectionOrder: DateSection[] = ['Hoje', 'Ontem', 'Esta Semana', 'Mais Antigos'];

  return sectionOrder
    .filter((title) => sections[title].length > 0)
    .map((title) => ({
      title,
      data: sections[title],
    }));
}
