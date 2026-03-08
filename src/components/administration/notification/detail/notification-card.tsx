
import type { Notification } from '../../../../types';
import { NOTIFICATION_TYPE_LABELS, NOTIFICATION_IMPORTANCE_LABELS } from "@/constants";
import { formatDateTime } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";

interface NotificationCardProps {
  notification: Notification;
}

export function NotificationCard({ notification }: NotificationCardProps) {
  const getImportanceBadgeVariant = () => {
    switch (notification.importance) {
      case "URGENT":
        return "destructive";
      case "HIGH":
        return "warning";
      case "NORMAL":
        return "default";
      case "LOW":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <DetailCard title="Notificação" icon="bell">
      <DetailField label="Título" value={notification.title} />
      <DetailField label="Mensagem" value={notification.body} />

      <DetailField
        label="Tipo"
        value={
          <Badge variant="secondary">
            {NOTIFICATION_TYPE_LABELS[notification.type]}
          </Badge>
        }
      />

      <DetailField
        label="Importância"
        value={
          <Badge variant={getImportanceBadgeVariant()}>
            {NOTIFICATION_IMPORTANCE_LABELS[notification.importance]}
          </Badge>
        }
      />

      {notification.scheduledAt && (
        <DetailField
          label="Agendada para"
          icon="calendar"
          value={formatDateTime(notification.scheduledAt)}
        />
      )}

      {notification.sentAt && (
        <DetailField
          label="Enviada em"
          icon="send"
          value={formatDateTime(notification.sentAt)}
        />
      )}
    </DetailCard>
  );
}
