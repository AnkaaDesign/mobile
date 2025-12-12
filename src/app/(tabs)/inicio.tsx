
import { View, Text, ScrollView, Pressable } from "react-native";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { hasPrivilege, isTeamLeader } from "@/utils";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  // Return null if user is not logged in (during logout transition)
  if (!user) {
    return null;
  }

  // Check user permissions
  const canAccessInventory = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const isUserDesigner = hasPrivilege(user, SECTOR_PRIVILEGES.DESIGNER);
  const isUserLeader = isTeamLeader(user);
  // Team leadership is now determined by managedSector relationship
  // Designers get full catalogue access, leaders get read-only access
  const canAccessPainting = isUserDesigner || isUserLeader;
  // Determine which catalogue route to use based on user role
  // Designers go to full catalogue, leaders go to read-only basic catalogue
  const catalogueRoute = isUserDesigner
    ? routes.painting.catalog.root
    : '/pintura/catalogo-basico';

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

          {canAccessInventory && (
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
          )}

          {canAccessPainting && (
            <Pressable
              onPress={() => router.push(routeToMobilePath(catalogueRoute) as any)}
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
          )}
        </View>
      </View>
    </ScrollView>
  );
}
