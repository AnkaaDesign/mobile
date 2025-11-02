import { Drawer } from "expo-router/drawer";
import { useTheme } from "@/lib/theme";
import { Platform } from "react-native";

// Import the drawer content component
import DrawerContent from '@/navigation/OriginalMenuDrawer';

export default function TabsLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerStyle: {
          backgroundColor: colors.card,
          width: Platform.OS === 'web' ? 280 : '80%',
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.foreground,
        contentStyle: {
          backgroundColor: isDark ? "#1c1c1c" : "#e8e8e8",
        },
        sceneContainerStyle: {
          backgroundColor: isDark ? "#1c1c1c" : "#e8e8e8",
          paddingHorizontal: Platform.OS === 'ios' ? 16 : 12,
        },
        // Enable lazy loading for better performance
        lazy: true,
        // Unmount inactive screens to save memory
        unmountOnBlur: false,
      }}
    />
  );
}
