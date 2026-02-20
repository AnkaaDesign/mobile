import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { Card } from "./card";
import { ThemedText } from "./themed-text";
import { Icon } from "./icon";
import { useTheme } from "@/lib/theme";
import {
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from "@/constants/design-system";
import { IconBrandWhatsapp } from "@tabler/icons-react-native";

/**
 * Standard Detail Page Layout Component
 *
 * Based on the task (cronograma) detail page pattern.
 * Ensures consistent spacing, layout, and design across all detail pages.
 *
 * Field pattern: icon + label above, value in a bordered muted card below.
 *
 * Usage:
 * ```tsx
 * <DetailPageLayout refreshing={isRefreshing} onRefresh={handleRefresh}>
 *   <DetailCard title="Informações Gerais" icon="clipboard-list">
 *     <DetailField label="Nome" value={data.name} icon="tag" />
 *     <DetailField label="Status" value={<Badge>{data.status}</Badge>} icon="circle-check" />
 *     <DetailPhoneField label="Telefone" phone="27999792035" icon="phone" />
 *   </DetailCard>
 * </DetailPageLayout>
 * ```
 */

// ─── Format phone for display ────────────────────────────────────────────────

const formatPhoneDisplay = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// ─── DetailPageLayout ────────────────────────────────────────────────────────

interface DetailPageLayoutProps {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: any;
}

export function DetailPageLayout({
  children,
  refreshing = false,
  onRefresh,
  contentContainerStyle,
}: DetailPageLayoutProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

// ─── DetailCard ──────────────────────────────────────────────────────────────

interface DetailCardProps {
  title: string;
  icon?: string;
  iconColor?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  style?: any;
}

/**
 * Standard Detail Card
 *
 * Card with icon + title header, border separator, and content area.
 * Matches the task detail page section card pattern.
 */
export function DetailCard({
  title,
  icon,
  iconColor,
  badge,
  children,
  style,
}: DetailCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={[styles.card, style]}>
      <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.cardHeaderLeft}>
          {icon && (
            <Icon
              name={icon}
              size={20}
              color={iconColor || colors.primary}
            />
          )}
          <ThemedText style={styles.cardTitle}>{title}</ThemedText>
        </View>
        {badge}
      </View>
      <View style={styles.cardContent}>{children}</View>
    </Card>
  );
}

// ─── DetailField ─────────────────────────────────────────────────────────────

interface DetailFieldProps {
  label: string;
  value: React.ReactNode;
  icon?: string;
  iconColor?: string;
  monospace?: boolean;
  style?: any;
}

/**
 * Standard Detail Field
 *
 * Displays a label-value pair matching the task detail page pattern:
 * - Icon (18px) + Label text above
 * - Value inside a bordered muted card below
 */
export function DetailField({
  label,
  value,
  icon,
  iconColor,
  monospace = false,
  style,
}: DetailFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.fieldRow, style]}>
      <View style={styles.fieldLabel}>
        {icon && (
          <Icon
            name={icon}
            size={18}
            color={iconColor || colors.mutedForeground}
          />
        )}
        <ThemedText
          style={[styles.labelText, { color: colors.mutedForeground }]}
        >
          {label}
        </ThemedText>
      </View>
      <View
        style={[
          styles.fieldValueCard,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        {typeof value === "string" || typeof value === "number" ? (
          <ThemedText
            style={[
              styles.valueText,
              { color: colors.foreground },
              monospace && styles.monospace,
            ]}
          >
            {value}
          </ThemedText>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

// ─── DetailPhoneField ────────────────────────────────────────────────────────

interface DetailPhoneFieldProps {
  label: string;
  phone: string;
  icon?: string;
  style?: any;
}

/**
 * Standard Detail Phone Field
 *
 * Displays a phone number with call + WhatsApp actions inside a bordered card.
 * Green tappable phone text on left, WhatsApp icon on right.
 */
export function DetailPhoneField({
  label,
  phone,
  icon,
  style,
}: DetailPhoneFieldProps) {
  const { colors } = useTheme();

  const handleCallPhone = useCallback(() => {
    const cleaned = phone.replace(/\D/g, "");
    const phoneUrl = `tel:${cleaned}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert("Erro", "Não foi possível abrir o discador");
        }
      })
      .catch(() => {
        Alert.alert("Erro", "Não foi possível abrir o discador");
      });
  }, [phone]);

  const handleWhatsApp = useCallback(async () => {
    const cleaned = phone.replace(/\D/g, "");
    const phoneWithCountry = cleaned.startsWith("55")
      ? cleaned
      : `55${cleaned}`;
    try {
      await Linking.openURL(`whatsapp://send?phone=${phoneWithCountry}`);
    } catch {
      try {
        await Linking.openURL(`https://wa.me/${phoneWithCountry}`);
      } catch {
        Alert.alert("Erro", "Não foi possível abrir o WhatsApp");
      }
    }
  }, [phone]);

  return (
    <View style={[styles.fieldRow, style]}>
      <View style={styles.fieldLabel}>
        {icon && (
          <Icon name={icon} size={18} color={colors.mutedForeground} />
        )}
        <ThemedText
          style={[styles.labelText, { color: colors.mutedForeground }]}
        >
          {label}
        </ThemedText>
      </View>
      <View
        style={[
          styles.fieldValueCard,
          styles.phoneRow,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={handleCallPhone}
          activeOpacity={0.7}
          style={styles.phoneButton}
        >
          <ThemedText style={[styles.phoneText, { color: "#16a34a" }]}>
            {formatPhoneDisplay(phone)}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleWhatsApp}
          activeOpacity={0.7}
          style={styles.whatsappButton}
        >
          <IconBrandWhatsapp size={20} color="#16a34a" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── DetailSection ───────────────────────────────────────────────────────────

interface DetailSectionProps {
  title?: string;
  children: React.ReactNode;
  style?: any;
}

/**
 * Detail Section
 *
 * Groups related fields with optional section title.
 */
export function DetailSection({
  title,
  children,
  style,
}: DetailSectionProps) {
  return (
    <View style={[styles.section, style]}>
      {title && <ThemedText style={styles.sectionTitle}>{title}</ThemedText>}
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Layout
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },

  // Card
  card: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
    marginRight: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    flexShrink: 1,
  },
  cardContent: {
    gap: spacing.md,
  },

  // Field
  fieldRow: {
    gap: spacing.xs, // 4px between label row and value card
  },
  fieldLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs, // 4px between icon and label text
  },
  labelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  fieldValueCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
  },
  valueText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  monospace: {
    fontFamily: "monospace",
  },

  // Phone field
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  phoneButton: {
    paddingVertical: 2,
  },
  phoneText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  whatsappButton: {
    padding: 4,
  },

  // Section
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    marginTop: spacing.sm,
  },
  sectionContent: {
    gap: spacing.md,
  },
});
