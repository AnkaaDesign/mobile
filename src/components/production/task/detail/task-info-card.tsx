import React, { useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Linking, Alert } from "react-native";
import { DetailCard, DetailField, DetailPhoneField } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

import type { Task, Truck } from '../../../../types';
import type { Responsible } from '@/types/responsible';
import {
  RESPONSIBLE_ROLE_LABELS,
  ResponsibleRole,
} from '@/types/responsible';
import { TaskStatusBadge } from "../list/task-status-badge";
import { formatChassis } from "@/utils";
import { getSpotLabel } from "@/types/garage";

import {
  IconBrandWhatsapp,
} from "@tabler/icons-react-native";
import { TRUCK_CATEGORY_LABELS, IMPLEMENT_TYPE_LABELS, COMMISSION_STATUS_LABELS } from "@/constants/enum-labels";

// Format phone number for display
const formatPhoneDisplay = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

interface TaskInfoCardProps {
  task: Task & {
    truck?: Truck;
    customer?: {
      fantasyName: string;
      corporateName?: string | null;
    };
    negotiatingWith?: {
      name: string;
      phone: string;
    };
    responsibles?: Responsible[];
    details?: string;
  };
  truckDimensions?: {
    width: number;
    height: number;
  } | null;
  /** Whether user can view financial fields (invoiceTo, commission). Defaults to false for safety. */
  canViewFinancialFields?: boolean;
  /** Whether user can view restricted fields (negotiatingWith, forecastDate, responsibles). Only ADMIN, FINANCIAL, COMMERCIAL, LOGISTIC, DESIGNER. Defaults to false for safety. */
  canViewRestrictedFields?: boolean;
  /** Whether user can view truck details (chassisNumber, category, implementType). Hidden from PRODUCTION users except team leaders. Defaults to true. */
  canViewTruckDetails?: boolean;
  /** Whether the current user is from the Designer sector. Used to filter responsibles (MARKETING only, COMMERCIAL fallback). */
  isDesignerUser?: boolean;
}

export const TaskInfoCard: React.FC<TaskInfoCardProps> = React.memo(({ task, truckDimensions, canViewFinancialFields = false, canViewRestrictedFields = false, canViewTruckDetails = true, isDesignerUser = false }) => {
  const { colors } = useTheme();

  // Handle phone call
  const handleCallPhone = useCallback((phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const phoneUrl = `tel:${cleaned}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Erro', 'Não foi possível abrir o discador');
        }
      })
      .catch(() => {
        Alert.alert('Erro', 'Não foi possível abrir o discador');
      });
  }, []);

  // Handle WhatsApp - opens app directly
  const handleWhatsApp = useCallback(async (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const phoneWithCountry = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
    const whatsappUrl = `whatsapp://send?phone=${phoneWithCountry}`;

    try {
      await Linking.openURL(whatsappUrl);
    } catch {
      try {
        await Linking.openURL(`https://wa.me/${phoneWithCountry}`);
      } catch {
        Alert.alert('Erro', 'Não foi possível abrir o WhatsApp');
      }
    }
  }, []);

  // Filter responsibles: Designers only see MARKETING responsibles (fallback to COMMERCIAL)
  const visibleResponsibles = React.useMemo(() => {
    if (!task.responsibles || task.responsibles.length === 0) return [];
    if (isDesignerUser) {
      const marketing = task.responsibles.filter(r => r.role === ResponsibleRole.MARKETING);
      return marketing.length > 0 ? marketing : task.responsibles.filter(r => r.role === ResponsibleRole.COMMERCIAL);
    }
    return task.responsibles;
  }, [task.responsibles, isDesignerUser]);
  const hasResponsibles = visibleResponsibles.length > 0;

  return (
    <DetailCard
      title="Informações Gerais"
      icon="clipboard-list"
      badge={<TaskStatusBadge status={task.status} size="md" />}
    >
      {/* Customer */}
      {task.customer && (
        <DetailField
          label="Razão Social"
          icon="building"
          value={task.customer?.corporateName || task.customer?.fantasyName || "-"}
        />
      )}

      {/* Responsibles - Each displayed as its own field */}
      {canViewRestrictedFields && hasResponsibles && visibleResponsibles.map((resp) => (
        resp.phone ? (
          <DetailPhoneField
            key={resp.id}
            label={`Responsável ${RESPONSIBLE_ROLE_LABELS[resp.role as ResponsibleRole]}`}
            phone={resp.phone}
            icon="user"
          />
        ) : (
          <DetailField
            key={resp.id}
            label={`Responsável ${RESPONSIBLE_ROLE_LABELS[resp.role as ResponsibleRole]}`}
            icon="user"
            value={resp.name}
          />
        )
      ))}

      {/* Legacy Negotiating With Contact */}
      {canViewRestrictedFields && !hasResponsibles && task.negotiatingWith && (
        task.negotiatingWith.phone ? (
          <DetailPhoneField
            label="Negociando com"
            phone={task.negotiatingWith.phone}
            icon="user"
          />
        ) : (
          <DetailField
            label="Negociando com"
            icon="user"
            value={task.negotiatingWith.name}
          />
        )
      )}

      {/* Sector */}
      {task.sector && (
        <DetailField label="Setor" icon="building-factory" value={task.sector.name} />
      )}

      {/* Commission Status */}
      {canViewFinancialFields && task.commission && (
        <DetailField
          label="Comissão"
          icon="coin"
          value={COMMISSION_STATUS_LABELS[task.commission as keyof typeof COMMISSION_STATUS_LABELS] || task.commission}
        />
      )}

      {/* Serial Number */}
      {task.serialNumber && (
        <DetailField label="Número de Série" icon="hash" value={task.serialNumber} monospace />
      )}

      {/* Plate */}
      {task.truck?.plate && (
        <DetailField label="Placa" icon="car" value={task.truck.plate.toUpperCase()} monospace />
      )}

      {/* Chassis Number */}
      {canViewTruckDetails && task.truck?.chassisNumber && (
        <DetailField label="Nº Chassi" icon="barcode" value={formatChassis(task.truck.chassisNumber)} />
      )}

      {/* Truck Category */}
      {canViewTruckDetails && task.truck?.category && (
        <DetailField
          label="Categoria"
          icon="category"
          value={TRUCK_CATEGORY_LABELS[task.truck.category as keyof typeof TRUCK_CATEGORY_LABELS]}
        />
      )}

      {/* Implement Type */}
      {canViewTruckDetails && task.truck?.implementType && (
        <DetailField
          label="Implemento"
          icon="tool"
          value={IMPLEMENT_TYPE_LABELS[task.truck.implementType as keyof typeof IMPLEMENT_TYPE_LABELS]}
        />
      )}

      {/* Truck Dimensions */}
      {task.truck && truckDimensions && (
        <DetailField
          label="Caminhão"
          icon="truck"
          value={`${truckDimensions.width}cm x ${truckDimensions.height}cm`}
        />
      )}

      {/* Local (Truck Spot) */}
      {task.truck?.spot && (
        <DetailField label="Local" icon="map-pin" value={getSpotLabel(task.truck.spot as any)} />
      )}

      {/* Details */}
      {task.details && (
        <DetailField
          label="Detalhes"
          icon="file-text"
          value={
            <ThemedText style={[styles.detailsText, { color: colors.mutedForeground }]}>
              {task.details}
            </ThemedText>
          }
        />
      )}
    </DetailCard>
  );
});

const styles = StyleSheet.create({
  detailsText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
