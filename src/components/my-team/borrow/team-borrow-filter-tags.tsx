
import { ScrollView, StyleSheet, Pressable } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { BORROW_STATUS, BORROW_STATUS_LABELS } from "@/constants";
import { formatDate } from "@/utils";
import type { User } from '../../../types';
import type { TeamBorrowFilters } from './team-borrow-filter-drawer-content';

interface TeamBorrowFilterTagsProps {
  filters: TeamBorrowFilters;
  onRemoveFilter: (filterKey: keyof TeamBorrowFilters, value?: string) => void;
  teamMembers: User[];
}

export const TeamBorrowFilterTags = ({ filters, onRemoveFilter, teamMembers }: TeamBorrowFilterTagsProps) => {
  const { colors } = useTheme();

  // Get user name by ID
  const getUserName = (userId: string) => {
    const user = teamMembers.find((u) => u.id === userId);
    return user?.name || "Desconhecido";
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container} contentContainerStyle={styles.content}>
      {/* User filters */}
      {filters.userIds?.map((userId: string) => (
        <Pressable
          key={`user-${userId}`}
          onPress={() => onRemoveFilter("userIds", userId)}
          style={[styles.tag, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}
        >
          <ThemedText style={[styles.tagText, { color: colors.primary }]}>{getUserName(userId)}</ThemedText>
          <IconX size={14} color={colors.primary} />
        </Pressable>
      ))}

      {/* Status filters */}
      {filters.statuses?.map((status) => (
        <Pressable
          key={`status-${status}`}
          onPress={() => onRemoveFilter("statuses", status)}
          style={[styles.tag, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}
        >
          <ThemedText style={[styles.tagText, { color: colors.primary }]}>
            {BORROW_STATUS_LABELS[status as BORROW_STATUS] || status}
          </ThemedText>
          <IconX size={14} color={colors.primary} />
        </Pressable>
      ))}

      {/* Start date filter */}
      {filters.startDate && (
        <Pressable
          onPress={() => onRemoveFilter("startDate")}
          style={[styles.tag, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}
        >
          <ThemedText style={[styles.tagText, { color: colors.primary }]}>Início: {formatDate(filters.startDate)}</ThemedText>
          <IconX size={14} color={colors.primary} />
        </Pressable>
      )}

      {/* End date filter */}
      {filters.endDate && (
        <Pressable
          onPress={() => onRemoveFilter("endDate")}
          style={[styles.tag, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}
        >
          <ThemedText style={[styles.tagText, { color: colors.primary }]}>Fim: {formatDate(filters.endDate)}</ThemedText>
          <IconX size={14} color={colors.primary} />
        </Pressable>
      )}

      {/* Return start date filter */}
      {filters.returnStartDate && (
        <Pressable
          onPress={() => onRemoveFilter("returnStartDate")}
          style={[styles.tag, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}
        >
          <ThemedText style={[styles.tagText, { color: colors.primary }]}>Devolução Início: {formatDate(filters.returnStartDate)}</ThemedText>
          <IconX size={14} color={colors.primary} />
        </Pressable>
      )}

      {/* Return end date filter */}
      {filters.returnEndDate && (
        <Pressable
          onPress={() => onRemoveFilter("returnEndDate")}
          style={[styles.tag, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}
        >
          <ThemedText style={[styles.tagText, { color: colors.primary }]}>Devolução Fim: {formatDate(filters.returnEndDate)}</ThemedText>
          <IconX size={14} color={colors.primary} />
        </Pressable>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  content: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
