import { useEffect, useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, Alert, RefreshControl, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { NOTIFICATION_CHANNEL, ALERT_TYPE } from "@/constants";
import type { NotificationPreference } from "@/types/preferences";
import { useAuth } from "@/contexts/auth-context";

// Define notification groups
const NOTIFICATION_GROUPS = {
  TASK: {
    title: "Task Notifications",
    description: "Notifications related to tasks and assignments",
    types: [
      {
        type: "TASK_ASSIGNED",
        label: "Task Assigned",
        description: "When a new task is assigned to you",
        mandatory: false,
      },
      {
        type: "TASK_STATUS_CHANGE",
        label: "Task Status Changes",
        description: "When a task status is updated",
        mandatory: true,
      },
      {
        type: "TASK_DUE_SOON",
        label: "Task Due Soon",
        description: "Reminders for upcoming task deadlines",
        mandatory: false,
      },
      {
        type: "TASK_OVERDUE",
        label: "Task Overdue",
        description: "When a task becomes overdue",
        mandatory: true,
      },
    ],
  },
  ORDER: {
    title: "Order Notifications",
    description: "Notifications about inventory orders",
    types: [
      {
        type: "ORDER_CREATED",
        label: "Order Created",
        description: "When a new order is created",
        mandatory: false,
      },
      {
        type: "ORDER_STATUS_CHANGE",
        label: "Order Status Updates",
        description: "When order status changes",
        mandatory: false,
      },
      {
        type: "ORDER_RECEIVED",
        label: "Order Received",
        description: "When an order is received",
        mandatory: false,
      },
      {
        type: "DELIVERY_DELAY",
        label: "Delivery Delays",
        description: "Alerts for delayed deliveries",
        mandatory: true,
      },
    ],
  },
  INVENTORY: {
    title: "Inventory Notifications",
    description: "Stock and inventory alerts",
    types: [
      {
        type: "LOW_STOCK",
        label: "Low Stock",
        description: "When items are running low",
        mandatory: true,
      },
      {
        type: "STOCK_OUT",
        label: "Stock Out",
        description: "When items are out of stock",
        mandatory: true,
      },
      {
        type: "REORDER_NEEDED",
        label: "Reorder Needed",
        description: "When items need to be reordered",
        mandatory: false,
      },
    ],
  },
  HR: {
    title: "HR Notifications",
    description: "Human resources and employee-related notifications",
    types: [
      {
        type: "VACATION_APPROVED",
        label: "Vacation Approved",
        description: "When your vacation request is approved",
        mandatory: false,
      },
      {
        type: "VACATION_REJECTED",
        label: "Vacation Rejected",
        description: "When your vacation request is rejected",
        mandatory: false,
      },
      {
        type: "WARNING_ISSUED",
        label: "Warning Issued",
        description: "When you receive a warning",
        mandatory: true,
      },
      {
        type: "PPE_DELIVERY",
        label: "PPE Delivery",
        description: "PPE equipment delivery notifications",
        mandatory: false,
      },
    ],
  },
  SYSTEM: {
    title: "System Notifications",
    description: "System alerts and updates",
    types: [
      {
        type: "SYSTEM_UPDATE",
        label: "System Updates",
        description: "Important system updates and announcements",
        mandatory: true,
      },
      {
        type: "MAINTENANCE",
        label: "Maintenance Alerts",
        description: "Scheduled maintenance notifications",
        mandatory: true,
      },
    ],
  },
};

type NotificationChannelType = "push" | "email" | "sms";

interface PreferenceState {
  [key: string]: NotificationChannelType[];
}

interface ChannelTogglesProps {
  channels: NotificationChannelType[];
  selected: NotificationChannelType[];
  disabled: boolean;
  onChange: (channels: NotificationChannelType[]) => void;
}

function ChannelToggles({ channels, selected, disabled, onChange }: ChannelTogglesProps) {
  const { colors } = useTheme();

  const toggle = (channel: NotificationChannelType) => {
    if (disabled) return;

    const newSelected = selected.includes(channel)
      ? selected.filter((c) => c !== channel)
      : [...selected, channel];

    onChange(newSelected);
  };

  const getChannelIcon = (channel: NotificationChannelType) => {
    switch (channel) {
      case "push":
        return "📱";
      case "email":
        return "📧";
      case "sms":
        return "💬";
      default:
        return "🔔";
    }
  };

  const getChannelLabel = (channel: NotificationChannelType) => {
    switch (channel) {
      case "push":
        return "Push";
      case "email":
        return "Email";
      case "sms":
        return "SMS";
      default:
        return channel;
    }
  };

  return (
    <View style={styles.channelToggles}>
      {channels.map((channel) => {
        const isSelected = selected.includes(channel);
        return (
          <View key={channel} style={styles.channelToggle}>
            <View
              style={[
                styles.channelToggleButton,
                {
                  backgroundColor: isSelected ? colors.primary : colors.muted,
                  opacity: disabled ? 0.5 : 1,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={styles.channelIcon}>{getChannelIcon(channel)}</Text>
              <ThemedText
                style={[
                  styles.channelLabel,
                  { color: isSelected ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {getChannelLabel(channel)}
              </ThemedText>
              <Switch
                checked={isSelected}
                onCheckedChange={() => toggle(channel)}
                disabled={disabled}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

interface PreferenceItemProps {
  type: string;
  label: string;
  description: string;
  mandatory: boolean;
  selected: NotificationChannelType[];
  onChange: (channels: NotificationChannelType[]) => void;
}

function PreferenceItem({
  type,
  label,
  description,
  mandatory,
  selected,
  onChange,
}: PreferenceItemProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.preferenceItem, { borderBottomColor: colors.border }]}>
      <View style={styles.preferenceHeader}>
        <View style={styles.preferenceInfo}>
          <View style={styles.preferenceTitleRow}>
            <ThemedText style={styles.preferenceLabel}>{label}</ThemedText>
            {mandatory && (
              <View style={[styles.mandatoryBadge, { backgroundColor: colors.destructive }]}>
                <ThemedText style={[styles.mandatoryText, { color: colors.destructiveForeground }]}>
                  Mandatory
                </ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={[styles.preferenceDescription, { color: colors.mutedForeground }]}>
            {description}
          </ThemedText>
        </View>
      </View>

      <ChannelToggles
        channels={["push", "email", "sms"]}
        selected={selected}
        disabled={mandatory}
        onChange={onChange}
      />
    </View>
  );
}

interface PreferenceSectionProps {
  title: string;
  description: string;
  types: Array<{
    type: string;
    label: string;
    description: string;
    mandatory: boolean;
  }>;
  preferences: PreferenceState;
  onChange: (type: string, channels: NotificationChannelType[]) => void;
}

function PreferenceSection({
  title,
  description,
  types,
  preferences,
  onChange,
}: PreferenceSectionProps) {
  const { colors } = useTheme();

  return (
    <Accordion type="multiple" collapsible className="w-full">
      <AccordionItem value={title}>
        <AccordionTrigger>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
            <ThemedText style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
              {description}
            </ThemedText>
          </View>
        </AccordionTrigger>
        <AccordionContent>
          <View style={styles.sectionContent}>
            {types.map((item) => (
              <PreferenceItem
                key={item.type}
                type={item.type}
                label={item.label}
                description={item.description}
                mandatory={item.mandatory}
                selected={preferences[item.type] || []}
                onChange={(channels) => onChange(item.type, channels)}
              />
            ))}
          </View>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default function NotificationPreferencesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [preferences, setPreferences] = useState<PreferenceState>({});
  const [originalPreferences, setOriginalPreferences] = useState<PreferenceState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize default preferences
  const initializeDefaultPreferences = useCallback(() => {
    const defaults: PreferenceState = {};

    Object.values(NOTIFICATION_GROUPS).forEach((group) => {
      group.types.forEach((item) => {
        if (item.mandatory) {
          // Mandatory notifications have all channels enabled
          defaults[item.type] = ["push", "email", "sms"];
        } else {
          // Optional notifications default to push only
          defaults[item.type] = ["push"];
        }
      });
    });

    return defaults;
  }, []);

  // Load preferences from API
  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);

      // TODO: Replace with actual API call
      // const response = await getPreferences({ userId: user?.id });
      // if (response.success && response.data) {
      //   const loadedPrefs = parseApiPreferences(response.data);
      //   setPreferences(loadedPrefs);
      //   setOriginalPreferences(loadedPrefs);
      // } else {
      //   const defaults = initializeDefaultPreferences();
      //   setPreferences(defaults);
      //   setOriginalPreferences(defaults);
      // }

      // For now, use defaults
      const defaults = initializeDefaultPreferences();
      setPreferences(defaults);
      setOriginalPreferences(defaults);
    } catch (error: any) {
      Alert.alert("Error", "Failed to load notification preferences");
      const defaults = initializeDefaultPreferences();
      setPreferences(defaults);
      setOriginalPreferences(defaults);
    } finally {
      setIsLoading(false);
    }
  }, [user, initializeDefaultPreferences]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPreferences();
    setIsRefreshing(false);
  }, [loadPreferences]);

  const handlePreferenceChange = (type: string, channels: NotificationChannelType[]) => {
    // Check if it's a mandatory notification
    let isMandatory = false;
    Object.values(NOTIFICATION_GROUPS).forEach((group) => {
      const item = group.types.find((t) => t.type === type);
      if (item?.mandatory) {
        isMandatory = true;
      }
    });

    if (isMandatory) {
      Alert.alert(
        "Cannot Modify",
        "This notification type is mandatory and cannot be disabled.",
        [{ text: "OK" }]
      );
      return;
    }

    // Validate at least one channel is selected
    if (channels.length === 0) {
      Alert.alert(
        "Invalid Selection",
        "At least one notification channel must be enabled.",
        [{ text: "OK" }]
      );
      return;
    }

    setPreferences((prev) => ({
      ...prev,
      [type]: channels,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // TODO: Implement API call to save preferences
      // const response = await updatePreferences(user?.preferencesId, {
      //   notifications: formatPreferencesForApi(preferences),
      // });

      // if (response.success) {
      //   setOriginalPreferences(preferences);
      //   Alert.alert("Success", "Notification preferences saved successfully");
      // }

      // For now, simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOriginalPreferences(preferences);
      Alert.alert("Success", "Notification preferences saved successfully");
    } catch (error: any) {
      Alert.alert("Error", "Failed to save notification preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset to Defaults",
      "Are you sure you want to reset all notification preferences to default values?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            const defaults = initializeDefaultPreferences();
            setPreferences(defaults);
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setPreferences(originalPreferences);
  };

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, styles.loadingContainer, { backgroundColor: colors.background }]}
        edges={[]}
      >
        <ThemedText>Loading preferences...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Notification Preferences</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Choose how you want to be notified
          </ThemedText>
        </View>

        {/* Notification Groups */}
        {Object.entries(NOTIFICATION_GROUPS).map(([key, group]) => (
          <Card key={key} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <PreferenceSection
              title={group.title}
              description={group.description}
              types={group.types}
              preferences={preferences}
              onChange={handlePreferenceChange}
            />
          </Card>
        ))}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
            style={styles.actionButton}
          >
            <ThemedText>{isSaving ? "Saving..." : "Save Changes"}</ThemedText>
          </Button>

          {hasChanges && (
            <Button
              variant="outline"
              onPress={handleCancel}
              disabled={isSaving}
              style={styles.actionButton}
            >
              <ThemedText>Cancel</ThemedText>
            </Button>
          )}

          <Button
            variant="outline"
            onPress={handleReset}
            disabled={isSaving}
            style={styles.actionButton}
          >
            <ThemedText>Reset to Defaults</ThemedText>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: 13,
  },
  sectionContent: {
    gap: spacing.sm,
  },
  preferenceItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  preferenceHeader: {
    marginBottom: spacing.sm,
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  mandatoryBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  mandatoryText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  preferenceDescription: {
    fontSize: 13,
  },
  channelToggles: {
    gap: spacing.sm,
  },
  channelToggle: {
    marginVertical: spacing.xs,
  },
  channelToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  channelIcon: {
    fontSize: 20,
  },
  channelLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  actionButtons: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    width: "100%",
  },
});
