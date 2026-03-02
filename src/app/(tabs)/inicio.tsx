
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { useFavorites } from "@/contexts/favorites-context";
import { useState, useEffect, useCallback } from "react";
import { getIconInfoByPath } from "@/utils/page-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { spacing, borderRadius } from "@/constants/design-system";
import { useHomeDashboard } from "@/hooks/dashboard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { HomeDashboardSection, HomeDashboardSkeleton, TimeEntriesCard, RecentMessagesList } from "@/components/home-dashboard";

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
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: dashboardResponse, isLoading: isDashboardLoading, refetch, isRefetching } = useHomeDashboard({ platform: "mobile" });
  const userPrivilege = user?.sector?.privileges;
  const needsTimeEntries =
    userPrivilege === SECTOR_PRIVILEGES.LOGISTIC ||
    userPrivilege === SECTOR_PRIVILEGES.DESIGNER ||
    userPrivilege === SECTOR_PRIVILEGES.PRODUCTION ||
    userPrivilege === SECTOR_PRIVILEGES.WAREHOUSE;

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return null;
  }

  const handleNavigate = (path: string) => {
    router.push(path as any);
  };

  const renderFavoriteCard = (fav: { id: string; path: string; title: string }) => {
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
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={{ padding: 16 }}>
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

          {/* Favoritos - FIRST (hidden when empty) */}
          {favorites.length > 0 && (
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Icon name="star" size="sm" color="#eab308" />
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
                  Favoritos
                </Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {favorites.map((fav) => renderFavoriteCard(fav))}
              </View>
            </View>
          )}

          {/* Dashboard Section */}
          {isDashboardLoading ? (
            <HomeDashboardSkeleton />
          ) : (
            dashboardResponse?.data && <HomeDashboardSection data={dashboardResponse.data} sector={userPrivilege} />
          )}
          {needsTimeEntries && <TimeEntriesCard />}

          {/* Recent Messages - card layout */}
          {dashboardResponse?.data?.recentMessages && dashboardResponse.data.recentMessages.length > 0 && (
            <RecentMessagesList
              messages={dashboardResponse.data.recentMessages}
              unreadCount={dashboardResponse.data.counts.unreadMessages}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}
