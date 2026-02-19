import { View, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { CollaboratorForm } from "@/components/administration/collaborator/form/collaborator-form";
import { useUser } from "@/hooks/useUser";
import { useTheme } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { Skeleton } from "@/components/ui/skeleton";
import { spacing, borderRadius } from "@/constants/design-system";

export default function EditCollaboratorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: user, isLoading, error } = useUser(id, {
    // Use optimized select for better performance - fetches only fields needed for form
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      cpf: true,
      pis: true,
      birth: true,
      status: true,
      isActive: true,
      verified: true,
      avatarId: true,
      payrollNumber: true,
      performanceLevel: true,
      // Address fields for form
      address: true,
      addressNumber: true,
      addressComplement: true,
      neighborhood: true,
      city: true,
      state: true,
      zipCode: true,
      // Status tracking dates for form
      effectedAt: true,
      exp1StartAt: true,
      exp1EndAt: true,
      exp2StartAt: true,
      exp2EndAt: true,
      dismissedAt: true,
      // IDs for form selectors
      sectorId: true,
      positionId: true,
      // Timestamps
      createdAt: true,
      updatedAt: true,
      // Relations with minimal select for form dropdowns
      sector: {
        select: {
          id: true,
          name: true,
        },
      },
      position: {
        select: {
          id: true,
          name: true,
        },
      },
      managedSector: {
        select: {
          id: true,
          name: true,
        },
      },
      // PPE size for form
      ppeSize: true,
    },
  });

  useScreenReady(!isLoading);

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          {/* Form card skeleton */}
          <View style={{ backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="40%" height={18} style={{ marginBottom: spacing.md }} />
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={{ marginBottom: spacing.md }}>
                <Skeleton width="30%" height={14} style={{ marginBottom: spacing.xs }} />
                <Skeleton width="100%" height={44} borderRadius={8} />
              </View>
            ))}
          </View>
          {/* Second card */}
          <View style={{ backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="45%" height={18} style={{ marginBottom: spacing.md }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={{ marginBottom: spacing.md }}>
                <Skeleton width="30%" height={14} style={{ marginBottom: spacing.xs }} />
                <Skeleton width="100%" height={44} borderRadius={8} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  if (error || !user) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          Erro ao carregar colaborador
        </Text>
      </View>
    );
  }

  return <CollaboratorForm mode="update" user={user?.data} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
