import { View, StyleSheet } from "react-native";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { fontSize } from "@/constants/design-system";
import { formatDate, formatRelativeTime } from "@/utils";

interface ObservationMetadataCardProps {
  createdAt: string | Date;
  updatedAt: string | Date;
}

export function ObservationMetadataCard({ createdAt, updatedAt }: ObservationMetadataCardProps) {
  const { colors } = useTheme();

  const createdDate = new Date(createdAt);
  const updatedDate = new Date(updatedAt);
  const hasBeenUpdated = createdDate.getTime() !== updatedDate.getTime();

  return (
    <DetailCard title="Metadados" icon="calendar">
      <DetailField
        label="Criada em"
        icon="calendar"
        value={
          <View>
            <ThemedText style={[styles.dateValue, { color: colors.foreground }]}>
              {formatDate(createdDate)}
            </ThemedText>
            <ThemedText style={[styles.dateRelative, { color: colors.mutedForeground }]}>
              {formatRelativeTime(createdDate)}
            </ThemedText>
          </View>
        }
      />

      {hasBeenUpdated && (
        <DetailField
          label="Atualizada em"
          icon="calendar"
          value={
            <View>
              <ThemedText style={[styles.dateValue, { color: colors.foreground }]}>
                {formatDate(updatedDate)}
              </ThemedText>
              <ThemedText style={[styles.dateRelative, { color: colors.mutedForeground }]}>
                {formatRelativeTime(updatedDate)}
              </ThemedText>
            </View>
          }
        />
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  dateValue: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  dateRelative: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
