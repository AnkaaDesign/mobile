
import { View, Text, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { InfoRow } from "@/components/ui/info-row";
import { FrequencyBadge } from "./frequency-badge";
import type { OrderSchedule } from '../../../../types';
import { SCHEDULE_FREQUENCY } from "@/constants";
import { formatDate } from "@/utils";

interface ScheduleInfoCardProps {
  schedule: OrderSchedule;
}

export function ScheduleInfoCard({ schedule }: ScheduleInfoCardProps) {
  const getScheduleDetails = () => {
    switch (schedule.frequency) {
      case SCHEDULE_FREQUENCY.WEEKLY:
        return schedule.dayOfWeek
          ? `Toda ${getDayOfWeekLabel(schedule.dayOfWeek)}`
          : "-";
      case SCHEDULE_FREQUENCY.MONTHLY:
        return schedule.dayOfMonth
          ? `Dia ${schedule.dayOfMonth} de cada mês`
          : "-";
      case SCHEDULE_FREQUENCY.DAILY:
        return "Todos os dias";
      default:
        return "-";
    }
  };

  const getDayOfWeekLabel = (day: string) => {
    const dayMap: Record<string, string> = {
      MONDAY: "Segunda-feira",
      TUESDAY: "Terça-feira",
      WEDNESDAY: "Quarta-feira",
      THURSDAY: "Quinta-feira",
      FRIDAY: "Sexta-feira",
      SATURDAY: "Sábado",
      SUNDAY: "Domingo",
    };
    return dayMap[day] || "";
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Informações do Agendamento</Text>
        <FrequencyBadge frequency={schedule.frequency} />
      </View>

      <View style={styles.content}>
        <InfoRow
          label="Periodicidade"
          value={getScheduleDetails()}
        />
        <InfoRow
          label="Ativo"
          value={schedule.isActive ? "Sim" : "Não"}
        />
        {schedule.specificDate && (
          <InfoRow
            label="Data Específica"
            value={formatDate(schedule.specificDate)}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  content: {
    gap: 8,
  },
});