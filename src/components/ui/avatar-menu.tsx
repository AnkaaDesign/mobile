import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { useRouter } from "expo-router";
import { routes } from '../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { Icon } from "./icon";

interface AvatarMenuProps {
  onClose?: () => void;
}

export function AvatarMenu({ onClose }: AvatarMenuProps) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [userCardLayout, setUserCardLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });

  // Enhanced theme colors matching updated navigation design
  const drawerBackgroundColor = isDark ? "#171717" : "#fafafa"; // neutral-900 : neutral-50
  const drawerTextColor = isDark ? "#f5f5f5" : "#0a0a0a"; // neutral-100 : neutral-950
  const activeBackgroundColor = "#16a34a"; // green-600 - unified brand color
  const hoverBackgroundColor = isDark ? "#262626" : "#f0f0f0"; // neutral-800 : neutral-100
  const borderColor = isDark ? "#404040" : "#e5e5e5"; // neutral-700 : neutral-200
  const cardBackgroundColor = isDark ? "#262626" : "#ffffff"; // neutral-800 : white
  const mutedTextColor = isDark ? "#a3a3a3" : "#6b7280"; // neutral-400 : neutral-500

  const handleNavigation = (routePath: string) => {
    setIsVisible(false);
    onClose?.();

    if (!routePath || typeof routePath !== "string") {
      console.warn("Invalid route path provided to avatar menu navigation");
      return;
    }

    try {
      // Convert route constant to mobile path and navigate
      const mobilePath = routeToMobilePath(routePath);
      router.push(mobilePath as any);
    } catch (error) {
      console.error("Avatar menu navigation failed:", error);
      // Try fallback to home
      try {
        router.push(routeToMobilePath(routes.home) as any);
      } catch (fallbackError) {
        console.error("Fallback navigation also failed:", fallbackError);
      }
    }
  };

  const toggleMenu = () => {
    setIsVisible(!isVisible);
  };

  return (
    <>
      {/* User Card Button */}
      <TouchableOpacity
        onPress={toggleMenu}
        onLayout={(event) => {
          const { width, height, x, y } = event.nativeEvent.layout;
          setUserCardLayout({ width, height, x, y });
        }}
        className="flex-row items-center p-3 rounded-xl"
        style={({ pressed }) => ({
          backgroundColor: pressed ? hoverBackgroundColor : "transparent",
        })}
        activeOpacity={0.8}
      >
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{
            backgroundColor: activeBackgroundColor,
            // Enhanced shadow for modern look
            shadowColor: activeBackgroundColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text className="text-white font-bold text-lg">{user?.name?.charAt(0)?.toUpperCase() || "U"}</Text>
        </View>
        <View className="flex-1 ml-3">
          <Text className="font-semibold text-base" style={{ color: drawerTextColor }} numberOfLines={1} ellipsizeMode="tail">
            {user?.name || "Usuário"}
          </Text>
          <Text className="text-sm" style={{ color: mutedTextColor, opacity: 0.8 }} numberOfLines={1} ellipsizeMode="tail">
            {user?.email || "email@exemplo.com"}
          </Text>
        </View>
        {/* Chevron icon to indicate expandable */}
        <Icon name={isVisible ? "chevronUp" : "chevronDown"} size={20} color={drawerTextColor} />
      </TouchableOpacity>

      {/* Popover Modal */}
      <Modal transparent visible={isVisible} animationType="fade" onRequestClose={() => setIsVisible(false)}>
        <Pressable className="flex-1" style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }} onPress={() => setIsVisible(false)}>
          <View
            className="absolute rounded-xl border"
            style={{
              backgroundColor: cardBackgroundColor,
              borderColor: borderColor,
              width: userCardLayout.width + 48 || 260,
              top: userCardLayout.y + userCardLayout.height + 48, // Position below user card with 8px gap
              right: 4, // Keep some margin from right edge
              // Enhanced shadow for modern look
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.3 : 0.15,
              shadowRadius: 16,
              elevation: 12,
            }}
            onStartShouldSetResponder={() => true} // Prevent modal close when touching inside
          >
            {/* Menu Items - No user info header since it's already in sidebar */}
            <View className="py-2">
              <TouchableOpacity
                onPress={() => handleNavigation(routes.pessoal.meuPerfil)}
                className="flex-row items-center px-4 py-3.5 mx-2 rounded-lg"
                style={({ pressed }) => ({
                  backgroundColor: pressed ? hoverBackgroundColor : "transparent",
                })}
                activeOpacity={0.8}
              >
                <View className="w-6 h-6 items-center justify-center flex-shrink-0">
                  <Icon name="profile" size={22} color={drawerTextColor} />
                </View>
                <Text className="ml-3 text-base font-medium flex-1" style={{ color: drawerTextColor }}>
                  Meu Perfil
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleNavigation(routes.pessoal.preferencias.root)}
                className="flex-row items-center px-4 py-3.5 mx-2 rounded-lg"
                style={({ pressed }) => ({
                  backgroundColor: pressed ? hoverBackgroundColor : "transparent",
                })}
                activeOpacity={0.8}
              >
                <View className="w-6 h-6 items-center justify-center flex-shrink-0">
                  <Icon name="settings" size={22} color={drawerTextColor} />
                </View>
                <Text className="ml-3 text-base font-medium flex-1" style={{ color: drawerTextColor }}>
                  Configurações
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
