import React from "react";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from '../../constants';
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import { View, StyleSheet, ScrollView } from "react-native";
import { IconUsers, IconCurrencyDollar, IconCalendar, IconAlertTriangle, IconPackage } from "@tabler/icons-react-native";

const teamMenuItems = [
  {
    id: "commissions",
    title: "Comissões",
    description: "Gerencie as comissões da sua equipe",
    icon: IconCurrencyDollar,
    route: "/my-team/commissions",
  },
  {
    id: "vacations",
    title: "Férias",
    description: "Aprove solicitações de férias",
    icon: IconCalendar,
    route: "/my-team/vacations",
  },
  {
    id: "warnings",
    title: "Advertências",
    description: "Visualize advertências da equipe",
    icon: IconAlertTriangle,
    route: "/my-team/warnings",
  },
  {
    id: "loans",
    title: "Empréstimos",
    description: "Controle empréstimos da equipe",
    icon: IconPackage,
    route: "/my-team/loans",
  },
];

export default function MyTeamScreen() {
  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <IconUsers size={32} color="#3b82f6" />
          <ThemedText style={styles.title}>Meu Pessoal</ThemedText>
        </View>

        <ThemedText style={styles.subtitle}>Gerencie os colaboradores do seu setor</ThemedText>

        <ScrollView style={styles.content}>
          {teamMenuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <View key={item.id} style={styles.menuItem}>
                <View style={styles.menuItemContent}>
                  <View style={styles.menuItemIcon}>
                    <IconComponent size={24} color="#3b82f6" />
                  </View>
                  <View style={styles.menuItemText}>
                    <ThemedText style={styles.menuItemTitle}>{item.title}</ThemedText>
                    <ThemedText style={styles.menuItemDescription}>{item.description}</ThemedText>
                  </View>
                </View>
                <Button onPress={() => router.push(item.route as any)} variant="outline" style={styles.menuItemButton}>
                  <ThemedText style={styles.buttonText}>Acessar</ThemedText>
                </Button>
              </View>
            );
          })}
        </ScrollView>
      </ThemedView>
    </PrivilegeGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 24,
  },
  content: {
    flex: 1,
  },
  menuItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#eff6ff",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  menuItemButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonText: {
    color: "#3b82f6",
    fontWeight: "600",
  },
});
