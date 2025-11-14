import { useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { IconChevronLeft, IconChevronRight, IconUser, IconUsers } from "@tabler/icons-react-native";
import { spacing } from "@/constants/design-system";
import { VACATION_STATUS } from "@/constants";
import { getDaysInMonth, getMonthName, isDateInRange, isSameDay } from "@/utils";
import type { Vacation } from '../../../types';

interface TeamVacationCalendarProps {
  vacations: Vacation[];
  onVacationPress: (vacationId: string) => void;
}

interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
  vacations: Vacation[];
  availableCount: number;
  totalTeamSize: number;
}

export const TeamVacationCalendar = ({ vacations, onVacationPress }: TeamVacationCalendarProps) => {
  const { colors } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate team size (unique users in vacations)
  const teamSize = useMemo(() => {
    const uniqueUsers = new Set(vacations.filter((v) => v.userId).map((v) => v.userId));
    return uniqueUsers.size;
  }, [vacations]);

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);

    const daysInMonth = getDaysInMonth(month, year);

    // Get first day of week (0 = Sunday)
    const firstDayOfWeek = firstDay.getDay();

    // Generate days array
    const days: DayInfo[] = [];

    // Add previous month days
    const prevMonthLastDay = new Date(year, month, 0);
    const prevMonthDays = prevMonthLastDay.getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date,
        isCurrentMonth: false,
        vacations: [],
        availableCount: teamSize,
        totalTeamSize: teamSize,
      });
    }

    // Add current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayVacations = vacations.filter((vacation) => {
        if (vacation.status === VACATION_STATUS.CANCELLED || vacation.status === VACATION_STATUS.REJECTED) {
          return false;
        }
        return isDateInRange(date, new Date(vacation.startAt), new Date(vacation.endAt));
      });

      days.push({
        date,
        isCurrentMonth: true,
        vacations: dayVacations,
        availableCount: teamSize - dayVacations.length,
        totalTeamSize: teamSize,
      });
    }

    // Add next month days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        vacations: [],
        availableCount: teamSize,
        totalTeamSize: teamSize,
      });
    }

    return days;
  }, [currentDate, vacations, teamSize]);

  // Get coverage percentage for a day
  const getCoveragePercentage = (dayInfo: DayInfo): number => {
    if (dayInfo.totalTeamSize === 0) return 100;
    return (dayInfo.availableCount / dayInfo.totalTeamSize) * 100;
  };

  // Get coverage color
  const getCoverageColor = (percentage: number): string => {
    if (percentage >= 80) return colors.success;
    if (percentage >= 60) return "#f59e0b"; // warning
    if (percentage >= 40) return "#fb923c"; // orange
    return colors.destructive;
  };

  const isToday = (date: Date): boolean => {
    return isSameDay(date, new Date());
  };

  const renderDay = (dayInfo: DayInfo, index: number) => {
    const coveragePercentage = getCoveragePercentage(dayInfo);
    const hasVacations = dayInfo.vacations.length > 0;
    const today = isToday(dayInfo.date);

    return (
      <TouchableOpacity
        key={`${dayInfo.date.toISOString()}-${index}`}
        style={StyleSheet.flatten([
          styles.dayCell,
          { borderColor: colors.border },
          !dayInfo.isCurrentMonth && styles.otherMonthDay,
          today && StyleSheet.flatten([styles.todayCell, { borderColor: colors.primary }]),
        ])}
        onPress={() => {
          if (dayInfo.vacations.length === 1) {
            onVacationPress(dayInfo.vacations[0].id);
          }
        }}
        disabled={!hasVacations}
      >
        {/* Date number */}
        <ThemedText
          style={StyleSheet.flatten([
            styles.dayNumber,
            !dayInfo.isCurrentMonth && styles.otherMonthText,
            today && StyleSheet.flatten([styles.todayText, { color: colors.primary }]),
          ])}
        >
          {dayInfo.date.getDate()}
        </ThemedText>

        {/* Vacation indicators */}
        {hasVacations && (
          <View style={styles.vacationIndicators}>
            {dayInfo.vacations.length === 1 ? (
              <IconUser size={12} color={colors.mutedForeground} />
            ) : (
              <View style={styles.multipleIndicator}>
                <IconUsers size={12} color={colors.mutedForeground} />
                <ThemedText style={styles.vacationCount}>{dayInfo.vacations.length}</ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Coverage bar */}
        {dayInfo.isCurrentMonth && (
          <View style={styles.coverageBarContainer}>
            <View
              style={StyleSheet.flatten([
                styles.coverageBar,
                {
                  width: `${coveragePercentage}%`,
                  backgroundColor: getCoverageColor(coveragePercentage),
                },
              ])}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <IconChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <ThemedText style={styles.monthYear}>
            {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
          </ThemedText>
          <TouchableOpacity onPress={goToToday}>
            <ThemedText style={StyleSheet.flatten([styles.todayButton, { color: colors.primary }])}>Hoje</ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <IconChevronRight size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={StyleSheet.flatten([styles.legendDot, { backgroundColor: colors.success }])} />
          <ThemedText style={styles.legendText}>{">=80% disponível"}</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={StyleSheet.flatten([styles.legendDot, { backgroundColor: "#f59e0b" }])} />
          <ThemedText style={styles.legendText}>60-79%</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={StyleSheet.flatten([styles.legendDot, { backgroundColor: "#fb923c" }])} />
          <ThemedText style={styles.legendText}>40-59%</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={StyleSheet.flatten([styles.legendDot, { backgroundColor: colors.destructive }])} />
          <ThemedText style={styles.legendText}>{"<40%"}</ThemedText>
        </View>
      </View>

      {/* Week days header */}
      <View style={styles.weekDaysHeader}>
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <ThemedText style={styles.weekDayText}>{day}</ThemedText>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <ScrollView style={styles.calendarScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarGrid}>{calendarDays.map((dayInfo, index) => renderDay(dayInfo, index))}</View>
      </ScrollView>

      {/* Team summary */}
      <View style={StyleSheet.flatten([styles.summary, { backgroundColor: colors.muted, borderColor: colors.border }])}>
        <View style={styles.summaryItem}>
          <IconUsers size={20} color={colors.foreground} />
          <ThemedText style={styles.summaryLabel}>Tamanho da equipe:</ThemedText>
          <ThemedText style={styles.summaryValue}>{teamSize}</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  navButton: {
    padding: spacing.xs,
  },
  headerCenter: {
    alignItems: "center",
    gap: spacing.xs,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: "700",
  },
  todayButton: {
    fontSize: 13,
    fontWeight: "600",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    opacity: 0.8,
  },
  weekDaysHeader: {
    flexDirection: "row",
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  weekDayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.7,
  },
  calendarScroll: {
    flex: 1,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.xs,
  },
  dayCell: {
    width: "14.28%", // 100% / 7 days
    aspectRatio: 1,
    borderWidth: 1,
    padding: 4,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  todayCell: {
    borderWidth: 2,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: "600",
  },
  todayText: {
    fontWeight: "700",
  },
  otherMonthText: {
    opacity: 0.5,
  },
  vacationIndicators: {
    marginTop: 2,
  },
  multipleIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  vacationCount: {
    fontSize: 10,
    fontWeight: "700",
  },
  coverageBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#e5e7eb",
  },
  coverageBar: {
    height: "100%",
  },
  summary: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },
});
