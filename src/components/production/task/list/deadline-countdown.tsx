import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { fontSize, fontWeight } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";
import { TASK_STATUS } from "../../../../constants";
import type { Task } from "../../../../types";

interface DeadlineCountdownProps {
  task: Task;
}

/**
 * DeadlineCountdown component - matches web version
 * Displays remaining time in DD:HH:MM:SS format
 * Updates every second
 * Shows red text when overdue
 * Only displays for IN_PRODUCTION tasks with a deadline
 */
export function DeadlineCountdown({ task }: DeadlineCountdownProps) {
  const { colors } = useTheme();
  const [timeDisplay, setTimeDisplay] = useState<string>("-");

  useEffect(() => {
    // Only show countdown for IN_PRODUCTION tasks with a deadline
    if (
      task.status !== TASK_STATUS.IN_PRODUCTION ||
      !task.term ||
      task.status === TASK_STATUS.COMPLETED ||
      task.status === TASK_STATUS.CANCELLED
    ) {
      setTimeDisplay("-");
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const deadlineDate = new Date(task.term!);

      // Calculate the difference in milliseconds
      const diffMs = Math.abs(deadlineDate.getTime() - now.getTime());

      // Convert to seconds, minutes, hours, and days
      const totalSeconds = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSeconds / (24 * 60 * 60));
      const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = totalSeconds % 60;

      // Format as DD:HH:MM:SS
      const formattedTime = [
        days.toString().padStart(2, "0"),
        hours.toString().padStart(2, "0"),
        minutes.toString().padStart(2, "0"),
        seconds.toString().padStart(2, "0"),
      ].join(":");

      setTimeDisplay(formattedTime);
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [task.term, task.status]);

  // Check if task is overdue
  const isOverdue =
    task.term &&
    task.status === TASK_STATUS.IN_PRODUCTION &&
    new Date(task.term) < new Date();

  return (
    <ThemedText
      style={StyleSheet.flatten([
        styles.text,
        { color: colors.foreground }, // Ensure text uses theme color
        isOverdue && { color: "#dc2626", fontWeight: fontWeight.semibold }, // Red-600 for overdue
      ])}
      numberOfLines={1}
    >
      {timeDisplay}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: fontSize.xs, // Match serial number size
    fontFamily: "monospace",
  },
});
