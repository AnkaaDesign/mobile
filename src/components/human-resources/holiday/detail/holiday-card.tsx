
import type { Holiday } from '../../../../types';
import { HOLIDAY_TYPE_LABELS } from "@/constants";
import { formatDate } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";

interface HolidayCardProps {
  holiday: Holiday;
}

export function HolidayCard({ holiday }: HolidayCardProps) {
  // Get badge variant based on holiday type
  const getTypeBadgeVariant = () => {
    switch (holiday.type) {
      case "NATIONAL":
        return "destructive";
      case "STATE":
        return "warning";
      case "MUNICIPAL":
        return "info";
      case "OPTIONAL":
        return "secondary";
      default:
        return "default";
    }
  };

  // Format the date with day of week
  const formatDateWithDay = (date: Date) => {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString("pt-BR", { weekday: "long" });
    const formattedDate = formatDate(date);
    return `${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}, ${formattedDate}`;
  };

  const getStatusText = () => {
    if (new Date(holiday.date) > new Date()) {
      return `Falta${Math.ceil((new Date(holiday.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias`;
    }
    if (new Date(holiday.date).toDateString() === new Date().toDateString()) {
      return "Hoje";
    }
    return `Há ${Math.floor((new Date().getTime() - new Date(holiday.date).getTime()) / (1000 * 60 * 60 * 24))} dias`;
  };

  return (
    <DetailCard title="Informações do Feriado" icon="calendar">
      <DetailField label="Nome" icon="tag" value={holiday.name} />
      <DetailField label="Data" icon="calendar" value={formatDateWithDay(holiday.date)} />
      {holiday.type && (
        <DetailField
          label="Tipo"
          icon="map-pin"
          value={
            <Badge variant={getTypeBadgeVariant()}>
              {HOLIDAY_TYPE_LABELS[holiday.type]}
            </Badge>
          }
        />
      )}
      <DetailField label="Status" icon="info-circle" value={getStatusText()} />
    </DetailCard>
  );
}
