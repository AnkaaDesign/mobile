import React from "react";
import { View, StyleSheet, ScrollView, Image } from "react-native";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { routes } from "@/constants/routes";
import { routeToMobilePath } from "@/lib/route-mapper";
import {
  IconBeach,
  IconCalendarEvent,
  IconClock,
  IconReceipt,
  IconActivity,
  IconPackage,
  IconShieldCheck,
  IconAlertTriangle,
  IconUserCircle,
} from "@tabler/icons-react-native";

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
}

const personalMenuItems: MenuItem[] = [
  {
    id: "my-vacations",
    title: "Minhas Férias",
    description: "Consulte suas férias programadas",
    icon: IconBeach,
    route: routes.personal.myVacations.root,
  },
  {
    id: "holidays",
    title: "Feriados",
    description: "Visualize os feriados do ano",
    icon: IconCalendarEvent,
    route: routes.personal.myHolidays.root,
  },
  {
    id: "time-calculations",
    title: "Cálculos de Ponto",
    description: "Consulte seus cálculos de ponto",
    icon: IconClock,
    route: routes.personal.timeCalculations.root,
  },
  {
    id: "payroll",
    title: "Holerite",
    description: "Acesse seus holerites",
    icon: IconReceipt,
    route: routes.personal.payroll.root,
  },
  {
    id: "my-activities",
    title: "Minhas Atividades",
    description: "Acompanhe suas atividades",
    icon: IconActivity,
    route: routes.personal.myActivities.root,
  },
  {
    id: "my-borrows",
    title: "Meus Empréstimos",
    description: "Visualize seus empréstimos",
    icon: IconPackage,
    route: routes.personal.myBorrows.root,
  },
  {
    id: "my-ppe-deliveries",
    title: "Minhas Entregas de EPI",
    description: "Consulte suas entregas de EPIs",
    icon: IconShieldCheck,
    route: routes.personal.myPpeDeliveries.root,
  },
  {
    id: "my-warnings",
    title: "Meus Avisos",
    description: "Visualize seus avisos",
    icon: IconAlertTriangle,
    route: routes.personal.myWarnings.root,
  },
];

export default function PersonalScreen() {
  const { user } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {user?.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <IconUserCircle size={64} color="#3b82f6" />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <ThemedText style={styles.userName}>{user?.name || "Usuário"}</ThemedText>
              <ThemedText style={styles.userPosition}>
                {user?.position?.name || "Cargo não definido"}
              </ThemedText>
              <ThemedText style={styles.userSector}>
                {user?.sector?.name || "Setor não definido"}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <ThemedText style={styles.sectionTitle}>Meus Dados</ThemedText>
          {personalMenuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <View key={item.id} style={styles.menuItem}>
                <View style={styles.menuItemContent}>
                  <View style={styles.menuItemIcon}>
                    <IconComponent size={24} color="#3b82f6" />
                  </View>
                  <View style={styles.menuItemText}>
                    <ThemedText style={styles.menuItemTitle}>{item.title}</ThemedText>
                    <ThemedText style={styles.menuItemDescription}>
                      {item.description}
                    </ThemedText>
                  </View>
                </View>
                <Button
                  onPress={() => router.push(routeToMobilePath(item.route) as any)}
                  variant="outline"
                  style={styles.menuItemButton}
                >
                  <ThemedText style={styles.buttonText}>Acessar</ThemedText>
                </Button>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: "white",
    padding: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#1f2937",
  },
  userPosition: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 2,
  },
  userSector: {
    fontSize: 14,
    color: "#9ca3af",
  },
  menuSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1f2937",
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
    color: "#1f2937",
  },
  menuItemDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
    color: "#6b7280",
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
