import React, { useState, useMemo } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/contexts/auth-context";
import { useUsers } from "@/hooks/useUser";
import { useTheme } from "@/contexts/theme-context";
import {
  IconCalculator,
  IconUser,
  IconChevronRight,
  IconClock,
  IconCalendar
} from "@tabler/icons-react-native";
import { USER_STATUS } from "@/constants/enums";

export default function TimeCalculationsScreen() {
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();

  // Get team members from the same sector
  const { data: usersResponse, isLoading: isLoadingUsers } = useUsers({
    where: {
      position: {
        sectorId: currentUser?.sectorId || currentUser?.managedSectorId,
      },
      status: {
        in: [
          USER_STATUS.EXPERIENCE_PERIOD_1,
          USER_STATUS.EXPERIENCE_PERIOD_2,
          USER_STATUS.CONTRACTED,
        ],
      },
    },
    include: {
      position: {
        include: {
          sector: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const teamMembers = usersResponse?.data || [];

  const handleViewCalculations = (userId: string, userName: string) => {
    // Navigate to the existing calculations page with the user's ID
    router.push({
      pathname: "/integrations/secullum/calculations/list",
      params: { userId, userName },
    });
  };

  if (!currentUser?.sectorId && !currentUser?.managedSectorId) {
    return (
      <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
        <ThemedView style={styles.container}>
          <EmptyState
            icon={IconCalculator}
            title="Setor não encontrado"
            description="Você precisa estar associado a um setor para visualizar os cálculos de ponto da sua equipe."
          />
        </ThemedView>
      </PrivilegeGuard>
    );
  }

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <IconCalculator size={28} color={colors.primary} />
            <ThemedText style={styles.title}>Cálculos de Ponto</ThemedText>
          </View>
          <ThemedText style={styles.subtitle}>
            Visualize os cálculos de ponto dos colaboradores do seu setor
          </ThemedText>
        </View>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <IconClock size={20} color={colors.primary} />
            <ThemedText style={styles.infoText}>
              Acompanhe as horas trabalhadas, horas extras e outros registros de ponto
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <IconCalendar size={20} color={colors.primary} />
            <ThemedText style={styles.infoText}>
              Período de cálculo: do dia 25 do mês anterior até o dia 25 do mês atual
            </ThemedText>
          </View>
        </Card>

        {/* Team Members List */}
        {isLoadingUsers ? (
          <View style={styles.loadingContainer}>
            <Loading />
            <ThemedText style={styles.loadingText}>
              Carregando colaboradores...
            </ThemedText>
          </View>
        ) : teamMembers.length === 0 ? (
          <EmptyState
            icon={IconUser}
            title="Nenhum colaborador encontrado"
            description="Não há colaboradores ativos no seu setor no momento."
          />
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <ThemedText style={styles.sectionTitle}>
              Selecione um colaborador ({teamMembers.length})
            </ThemedText>
            {teamMembers.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.userCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => handleViewCalculations(user.id, user.name)}
                android_ripple={{ color: colors.primary + "20" }}
              >
                <View style={styles.userCardContent}>
                  <View style={styles.userInfo}>
                    <View
                      style={[
                        styles.userAvatar,
                        { backgroundColor: colors.primary + "20" },
                      ]}
                    >
                      <ThemedText
                        style={[styles.userInitial, { color: colors.primary }]}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </ThemedText>
                    </View>
                    <View style={styles.userDetails}>
                      <ThemedText style={styles.userName}>{user.name}</ThemedText>
                      {user.position && (
                        <ThemedText style={styles.userPosition}>
                          {user.position.name}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                  <IconChevronRight size={20} color={colors.text + "60"} />
                </View>
              </TouchableOpacity>
            ))}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        )}
      </ThemedView>
    </PrivilegeGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  infoCard: {
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  userCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  userCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  userInitial: {
    fontSize: 20,
    fontWeight: "700",
  },
  userDetails: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  userPosition: {
    fontSize: 14,
    opacity: 0.6,
  },
  bottomSpacing: {
    height: 20,
  },
});
