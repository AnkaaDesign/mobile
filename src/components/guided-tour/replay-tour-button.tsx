import { Pressable, Text, View, StyleSheet, Alert } from "react-native";
import { IconPlayerPlay, IconRoute } from "@tabler/icons-react-native";
import { useAuth } from "@/contexts/auth-context";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useOptionalTour } from "./tour-context";

/**
 * Card-style button to replay the guided tour. Only visible to PRODUCTION
 * sector users.
 */
export function ReplayTourButton() {
  const { user } = useAuth();
  const tour = useOptionalTour();

  if (!tour) return null;
  if (user?.sector?.privileges !== SECTOR_PRIVILEGES.PRODUCTION) return null;

  const handlePress = () => {
    Alert.alert(
      "Repetir Tour",
      "Vamos refazer o tour guiado pelo aplicativo. Tudo o que aparecer na tela durante o tour é apenas demonstração.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Começar",
          onPress: async () => {
            await tour.resetCompletion();
            tour.start();
          },
        },
      ]
    );
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <View style={styles.iconWrap}>
        <IconRoute size={20} color="#2563EB" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Repetir Tour</Text>
        <Text style={styles.subtitle}>
          Refaça a apresentação guiada do aplicativo a qualquer momento.
        </Text>
      </View>
      <IconPlayerPlay size={18} color="#64748B" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginVertical: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
});
