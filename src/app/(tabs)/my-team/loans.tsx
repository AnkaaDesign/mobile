import React from "react";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from '../../../constants';
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { View, ScrollView , StyleSheet} from "react-native";
import { IconPackage, IconUser, IconClock, IconCheck } from "@tabler/icons-react-native";

// Mock data for demonstration
const mockLoans = [
  {
    id: "1",
    employeeName: "Marcos Pereira",
    item: "Furadeira Elétrica",
    loanDate: "10/07/2025",
    returnDate: "17/07/2025",
    status: "Ativo",
    daysRemaining: 3,
  },
  {
    id: "2",
    employeeName: "Juliana Rocha",
    item: "Kit de Ferramentas",
    loanDate: "05/07/2025",
    returnDate: "15/07/2025",
    status: "Devolvido",
    daysRemaining: 0,
  },
  {
    id: "3",
    employeeName: "Eduardo Santos",
    item: "Equipamento de Segurança",
    loanDate: "12/07/2025",
    returnDate: "19/07/2025",
    status: "Atrasado",
    daysRemaining: -2,
  },
];

export default function MyTeamLoansScreen() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo":
        return "#3b82f6";
      case "Devolvido":
        return "#10b981";
      case "Atrasado":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Ativo":
        return IconClock;
      case "Devolvido":
        return IconCheck;
      case "Atrasado":
        return IconClock;
      default:
        return IconClock;
    }
  };

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <IconPackage size={24} color="#3b82f6" />
          <ThemedText style={styles.title}>Empréstimos da Equipe</ThemedText>
        </View>

        <ThemedText style={styles.description}>Acompanhe os empréstimos de equipamentos pelos colaboradores do seu setor</ThemedText>

        <ScrollView style={styles.content}>
          {mockLoans.map((loan) => {
            const StatusIcon = getStatusIcon(loan.status);
            return (
              <View key={loan.id} style={styles.loanCard}>
                <View style={styles.loanHeader}>
                  <View style={styles.employeeInfo}>
                    <View style={styles.employeeIcon}>
                      <IconUser size={20} color="#6b7280" />
                    </View>
                    <View style={styles.employeeDetails}>
                      <ThemedText style={styles.employeeName}>{loan.employeeName}</ThemedText>
                      <ThemedText style={styles.itemName}>{loan.item}</ThemedText>
                    </View>
                  </View>

                  <View style={styles.statusSection}>
                    <View style={StyleSheet.flatten([styles.statusBadge, { backgroundColor: getStatusColor(loan.status) + "20" }])}>
                      <StatusIcon size={12} color={getStatusColor(loan.status)} />
                      <ThemedText style={StyleSheet.flatten([styles.statusText, { color: getStatusColor(loan.status) }])}>{loan.status}</ThemedText>
                    </View>
                  </View>
                </View>

                <View style={styles.loanDetails}>
                  <View style={styles.dateInfo}>
                    <ThemedText style={styles.dateLabel}>Empréstimo:</ThemedText>
                    <ThemedText style={styles.dateValue}>{loan.loanDate}</ThemedText>
                  </View>

                  <View style={styles.dateInfo}>
                    <ThemedText style={styles.dateLabel}>Devolução:</ThemedText>
                    <ThemedText style={styles.dateValue}>{loan.returnDate}</ThemedText>
                  </View>

                  {loan.status === "Ativo" && (
                    <View style={styles.remainingInfo}>
                      <ThemedText style={styles.remainingLabel}>Dias restantes:</ThemedText>
                      <ThemedText style={StyleSheet.flatten([styles.remainingValue, { color: loan.daysRemaining <= 1 ? "#ef4444" : "#3b82f6" }])}>{loan.daysRemaining} dias</ThemedText>
                    </View>
                  )}

                  {loan.status === "Atrasado" && (
                    <View style={styles.remainingInfo}>
                      <ThemedText style={styles.remainingLabel}>Atraso:</ThemedText>
                      <ThemedText style={StyleSheet.flatten([styles.remainingValue, { color: "#ef4444" }])}>{Math.abs(loan.daysRemaining)} dias</ThemedText>
                    </View>
                  )}
                </View>
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
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  loanCard: {
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
  loanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  employeeInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  employeeIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemName: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
  },
  statusSection: {
    alignItems: "flex-end",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  loanDetails: {
    gap: 8,
  },
  dateInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  remainingInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  remainingLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  remainingValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
