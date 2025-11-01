
import { ScrollView, StyleSheet, Pressable } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON_LABELS } from '../../../constants';
import { formatDate } from '../../../utils';
import type { User } from '../../../types';
import type { TeamActivityFilters } from './team-activity-filter-modal';

interface TeamActivityFilterTagsProps {
  filters: TeamActivityFilters;
  onRemoveFilter: (filterKey: keyof TeamActivityFilters, value?: string) => void;
  teamMembers: User[];
}

export const TeamActivityFilterTags = ({ filters, onRemoveFilter, teamMembers }: TeamActivityFilterTagsProps) => {
  const { colors } = useTheme();

  // Get user name by ID
  const getUserName = (userId: string) => {
    const user = teamMembers.find((u) => u.id === userId);
    return user?.name || "Desconhecido";
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container} contentContainerStyle={styles.content}>
      {/* User filters */}
      {filters.userIds?.map((userId) => (
        <Pressable
          key={`user-${userId}`}
          onPress={() => onRemoveFilter("userIds", userId)}
          style={[styles.tag, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}
        >
          <ThemedText style={[styles.tagText, { color: colors.primary }]}>{getUserName(userId)}</ThemedText>
          <IconX size={14} color={colors.primary} />
        </Pressable>
      ))}

      {/* Operation filters */}
      {filters.operations?.map((operation) => (
        <Pressable
          key={`operation-${operation}`}
          onPress={() => onRemoveFilter("operations", operation)}
          style={[styles.tag, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}
        >
          <ThemedText style={[styles.tagText, { color: colors.primary }]}>
            {ACTIVITY_OPERATION_LABELS[operation as keyof typeof ACTIVITY_OPERATION_LABELS] || operation}
          </ThemedText>
          <IconX size={14} color={colors.primary} />
        </Pressable>
      ))}

      {/* Reason filters */}
      {filters.reasons?.map((reason) => (
        <Pressable
          key={`reason-${reason}`}
          onPress={() => onRemoveFilter("reasons", reason)}
          style={[styles.tag, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}
        >
          <ThemedText style={[styles.tagText, { color: colors.primary }]}>
            {ACTIVITY_REASON_LABELS[reason as keyof typeof ACTIVITY_REASON_LABELS] || reason}
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
