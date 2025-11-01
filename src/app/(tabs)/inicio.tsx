
import { View, Text, ScrollView, Pressable } from "react-native";
import { UnderConstruction } from "@/components/ui/under-construction";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { useRouter } from "expo-router";
import { routes } from '../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Quick access cards */}
        <View style={{ gap: 12 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.foreground,
            marginTop: 8,
          }}>
            Acesso Rápido
          </Text>

          <Pressable
            onPress={() => router.push(routeToMobilePath(routes.production.schedule.list) as any)}
            style={{
              backgroundColor: colors.card,
              padding: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Icon name="calendar" size="lg" color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{
                color: colors.foreground,
                fontSize: 16,
                fontWeight: "600",
              }}>
                Cronograma de Produção
              </Text>
              <Text style={{
                color: colors.mutedForeground,
                fontSize: 14,
              }}>
                Ver ordens de serviço
              </Text>
            </View>
            <Icon name="chevron-right" size="md" color={colors.mutedForeground} />
          </Pressable>

          <Pressable
            onPress={() => router.push(routeToMobilePath(routes.inventory.products.list) as any)}
            style={{
              backgroundColor: colors.card,
              padding: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Icon name="package" size="lg" color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{
                color: colors.foreground,
                fontSize: 16,
                fontWeight: "600",
              }}>
                Produtos do Estoque
              </Text>
              <Text style={{
                color: colors.mutedForeground,
                fontSize: 14,
              }}>
                Gerenciar inventário
              </Text>
            </View>
            <Icon name="chevron-right" size="md" color={colors.mutedForeground} />
          </Pressable>

          <Pressable
            onPress={() => router.push(routeToMobilePath(routes.painting.catalog.root) as any)}
            style={{
              backgroundColor: colors.card,
              padding: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Icon name="palette" size="lg" color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{
                color: colors.foreground,
                fontSize: 16,
                fontWeight: "600",
              }}>
                Catálogo de Tintas
              </Text>
              <Text style={{
                color: colors.mutedForeground,
                fontSize: 14,
              }}>
                Ver fórmulas disponíveis
              </Text>
            </View>
            <Icon name="chevron-right" size="md" color={colors.mutedForeground} />
          </Pressable>
        </View>

        <UnderConstruction title="Dashboard" />
      </View>
    </ScrollView>
  );
}
