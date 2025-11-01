
import { View, Text, StyleSheet} from "react-native";
import { SCHEDULE_FREQUENCY, SCHEDULE_FREQUENCY_LABELS } from '../../../../constants';

interface FrequencyBadgeProps {
  frequency: SCHEDULE_FREQUENCY;
}

export function FrequencyBadge({ frequency }: FrequencyBadgeProps) {
  const getFrequencyColor = () => {
    switch (frequency) {
      case SCHEDULE_FREQUENCY.DAILY:
        return "#3B82F6";
      case SCHEDULE_FREQUENCY.WEEKLY:
        return "#06B6D4";
      case SCHEDULE_FREQUENCY.MONTHLY:
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  return (
    <View style={StyleSheet.flatten([styles.badge, { backgroundColor: getFrequencyColor() + "20" }])}>
      <Text style={StyleSheet.flatten([styles.badgeText, { color: getFrequencyColor() }])}>
        {SCHEDULE_FREQUENCY_LABELS[frequency as keyof typeof SCHEDULE_FREQUENCY_LABELS]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});