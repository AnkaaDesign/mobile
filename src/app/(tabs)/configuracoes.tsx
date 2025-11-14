
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { IconUser, IconBell, IconPalette, IconLock, IconChevronRight } from "@tabler/icons-react-native";
import { ThemedSafeAreaView } from "@/components/ui/themed-safe-area-view";
import { useColorScheme } from "nativewind";
import { routes } from "@/constants";

export default function SettingsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const settingsItems = [
    {
      id: "profile",
      title: "Meu Perfil",
      subtitle: "Editar informações pessoais",
      icon: IconUser,
      route: `/(tabs)${routes.personal.myProfile.root}`,
    },
    {
      id: "notifications",
      title: "Notificações",
      subtitle: "Configurar preferências de notificação",
      icon: IconBell,
      route: `/(tabs)${routes.personal.preferences.root}/notifications`,
    },
    {
      id: "theme",
      title: "Tema",
      subtitle: "Aparência do aplicativo",
      icon: IconPalette,
      route: `/(tabs)${routes.personal.preferences.root}/theme`,
    },
    {
      id: "privacy",
      title: "Privacidade",
      subtitle: "Configurações de privacidade",
      icon: IconLock,
      route: `/(tabs)${routes.personal.preferences.root}/privacy`,
    },
  ];

  return (
    <ThemedSafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        <View className="px-4 py-4 border-b border-border">
          <Text className="text-2xl font-bold text-foreground">Configurações</Text>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          <View className="space-y-2">
            {settingsItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(item.route as any)}
                className="bg-card rounded-lg p-4 flex-row items-center"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isDarkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)",
                  }}
                >
                  <item.icon size={20} color="#22c55e" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-base font-medium text-foreground">{item.title}</Text>
                  <Text className="text-sm text-muted-foreground mt-0.5">{item.subtitle}</Text>
                </View>
                <IconChevronRight size={20} color={isDarkMode ? "#6b7280" : "#9ca3af"} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </ThemedSafeAreaView>
  );
}
