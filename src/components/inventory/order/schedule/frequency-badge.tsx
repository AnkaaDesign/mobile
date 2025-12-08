import { Badge, BadgeProps } from "@/components/ui/badge";
import { SCHEDULE_FREQUENCY, SCHEDULE_FREQUENCY_LABELS } from "@/constants";

interface FrequencyBadgeProps {
  frequency: SCHEDULE_FREQUENCY;
}

export function FrequencyBadge({ frequency }: FrequencyBadgeProps) {
  const getFrequencyVariant = (): BadgeProps["variant"] => {
    switch (frequency) {
      case SCHEDULE_FREQUENCY.DAILY:
        return "blue"; // Blue for daily
      case SCHEDULE_FREQUENCY.WEEKLY:
        return "teal"; // Teal for weekly
      case SCHEDULE_FREQUENCY.MONTHLY:
        return "warning"; // Orange/amber for monthly
      default:
        return "muted";
    }
  };

  return (
    <Badge
      variant={getFrequencyVariant()}
      size="sm"
      style={{ alignSelf: "flex-start" }}
    >
      {SCHEDULE_FREQUENCY_LABELS[frequency as keyof typeof SCHEDULE_FREQUENCY_LABELS]}
    </Badge>
  );
}