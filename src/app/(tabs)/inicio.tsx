
import { View, Text, ScrollView, Pressable } from "react-native";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { useFavorites } from "@/contexts/favorites-context";
import { useState, useEffect, useCallback } from "react";
import { getMostAccessedPages, getRecentPages, PageAccess } from "@/utils/page-tracker";
import { getIconInfoByPath } from "@/utils/page-icons";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const [mostAccessedPages, setMostAccessedPages] = useState<PageAccess[]>([]);
  const [recentPages, setRecentPages] = useState<PageAccess[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const loadPageData = useCallback(async () => {
    const [mostAccessed, recent] = await Promise.all([
      getMostAccessedPages(6),
      getRecentPages(6),
    ]);
    setMostAccessedPages(mostAccessed);
    setRecentPages(recent);
  }, []);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Return null if user is not logged in (during logout transition)
  if (!user) {
    return null;
  }

  const handleNavigate = (path: string) => {
    router.push(path as any);
  };

  const renderPageCard = (page: { path: string; title: string; count?: number }, index: number) => {
    const iconInfo = getIconInfoByPath(page.path);
    const IconComponent = iconInfo.icon;

    return (
      <Pressable
        key={`${page.path}-${index}`}
        onPress={() => handleNavigate(page.path)}
        style={{
          backgroundColor: colors.muted,
          padding: 8,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
          width: "31%",
        }}
      >
        <View
          style={{
            backgroundColor: iconInfo.color,
            padding: 6,
            borderRadius: 6,
            alignSelf: "flex-start",
            marginBottom: 4,
          }}
        >
          <IconComponent size={14} color="#ffffff" />
        </View>
        <Text
          style={{
            color: colors.foreground,
            fontSize: 11,
            fontWeight: "600",
          }}
          numberOfLines={2}
        >
          {page.title}
        </Text>
        {page.count !== undefined && (
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 10,
              marginTop: 2,
            }}
          >
            {page.count} {page.count === 1 ? "acesso" : "acessos"}
          </Text>
        )}
      </Pressable>
    );
  };

  const renderFavoriteCard = (fav: { id: string; path: string; title: string }, index: number) => {
    const iconInfo = getIconInfoByPath(fav.path);
    const IconComponent = iconInfo.icon;

    return (
      <Pressable
        key={fav.id}
        onPress={() => handleNavigate(fav.path)}
        style={{
          backgroundColor: colors.muted,
          padding: 8,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
          width: "31%",
        }}
      >
        <View
          style={{
            backgroundColor: iconInfo.color,
            padding: 6,
            borderRadius: 6,
            alignSelf: "flex-start",
            marginBottom: 4,
          }}
        >
          <IconComponent size={14} color="#ffffff" />
        </View>
        <Text
          style={{
            color: colors.foreground,
            fontSize: 11,
            fontWeight: "600",
          }}
          numberOfLines={2}
        >
          {fav.title}
        </Text>
      </Pressable>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16 }}>
        {/* Background wrapper */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            gap: 20,
          }}
        >
          {/* Header with greeting and time */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                {getGreeting()}, {user?.name?.split(" ")[0] || "Usuário"}!
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                {currentTime.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: colors.foreground }}>
              {currentTime.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </Text>
          </View>

          {/* Favoritos */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icon name="star" size="md" color="#eab308" />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Favoritos
              </Text>
            </View>
            {favorites.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {favorites.map((fav, index) => renderFavoriteCard(fav, index))}
              </View>
            ) : (
              <Text style={{ color: colors.mutedForeground, fontSize: 14, paddingVertical: 8 }}>
                Marque páginas como favoritas para acessá-las rapidamente.
              </Text>
            )}
          </View>

          {/* Recentes */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icon name="clock" size="md" color="#3b82f6" />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Recentes
              </Text>
            </View>
            {recentPages.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {recentPages.map((page, index) => renderPageCard(page, index))}
              </View>
            ) : (
              <Text style={{ color: colors.mutedForeground, fontSize: 14, paddingVertical: 8 }}>
                Navegue pelo sistema para ver suas páginas recentes aqui.
              </Text>
            )}
          </View>

          {/* Mais Acessadas */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icon name="flame" size="md" color="#f97316" />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Mais Acessadas
              </Text>
            </View>
            {mostAccessedPages.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {mostAccessedPages.map((page, index) => renderPageCard({ ...page, count: page.count }, index))}
              </View>
            ) : (
              <Text style={{ color: colors.mutedForeground, fontSize: 14, paddingVertical: 8 }}>
                Navegue pelo sistema para ver suas páginas mais acessadas aqui.
              </Text>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
