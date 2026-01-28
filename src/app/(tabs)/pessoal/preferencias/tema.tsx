import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import { IconSun, IconMoon, IconSettings } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { ThemeMode } from "@/types/theme";

interface ThemePreviewCardProps {
  title: string;
  colors: {
    background: string;
    card: string;
    primary: string;
    text: string;
    muted: string;
  };
}

function ThemePreviewCard({ title, colors }: ThemePreviewCardProps) {
  return (
    <View
      style={{
        width: "100%",
        backgroundColor: colors.background,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.muted,
      }}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.card,
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.muted,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
          }}
        >
          {title}
        </Text>
      </View>

      {/* Content */}
      <View style={{ padding: 12, gap: 8 }}>
        <View
          style={{
            backgroundColor: colors.primary,
            height: 8,
            borderRadius: 4,
            width: "60%",
          }}
        />
        <View
          style={{
            backgroundColor: colors.muted,
            height: 6,
            borderRadius: 3,
            width: "40%",
          }}
        />
        <View
          style={{
            backgroundColor: colors.muted,
            height: 6,
            borderRadius: 3,
            width: "80%",
          }}
        />
      </View>
    </View>
  );
}

interface ThemeOptionProps {
  mode: ThemeMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onPress: () => void;
}

function ThemeOption({ mode, title, description, icon, selected, onPress }: ThemeOptionProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}: ${description}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 12,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.primary : colors.border,
      }}
    >
      {/* Custom Radio Circle */}
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: selected ? colors.primary : colors.mutedForeground,
          backgroundColor: selected ? colors.primary : "transparent",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        {selected && (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.card,
            }}
          />
        )}
      </View>

      {/* Icon */}
      <View style={{ marginRight: 12 }}>
        {icon}
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <Text variant="small" style={{ fontWeight: "600", color: colors.foreground }}>
          {title}
        </Text>
        <Text variant="xs" style={{ color: colors.mutedForeground, marginTop: 2 }}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

export default function PreferencesThemeScreen() {
  const { theme, setTheme, colors, isDark } = useTheme();

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
  };

  const themeOptions: Array<{
    mode: ThemeMode;
    title: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      mode: "system",
      title: "Sistema",
      description: "Usar configuração do sistema",
      icon: <IconSettings size={20} color={colors.foreground} />,
    },
    {
      mode: "light",
      title: "Claro",
      description: "Tema claro sempre",
      icon: <IconSun size={20} color={colors.foreground} />,
    },
    {
      mode: "dark",
      title: "Escuro",
      description: "Tema escuro sempre",
      icon: <IconMoon size={20} color={colors.foreground} />,
    },
  ];

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>
              Escolha como o aplicativo deve aparecer para você
            </CardDescription>
          </CardHeader>
          <CardContent style={{ gap: 12 }}>
            {themeOptions.map((option) => (
              <ThemeOption
                key={option.mode}
                mode={option.mode}
                title={option.title}
                description={option.description}
                icon={option.icon}
                selected={theme === option.mode}
                onPress={() => handleThemeChange(option.mode)}
              />
            ))}
          </CardContent>
        </Card>

        {/* Theme Preview Card */}
        <Card>
          <CardHeader>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <CardTitle>Visualização</CardTitle>
                <CardDescription>
                  Como o tema atual aparece no aplicativo
                </CardDescription>
              </View>
              <ThemeToggle size={20} />
            </View>
          </CardHeader>
          <CardContent>
            <ThemePreviewCard
              title={`Tema ${isDark ? "Escuro" : "Claro"}`}
              colors={{
                background: colors.background,
                card: colors.card,
                primary: colors.primary,
                text: colors.foreground,
                muted: colors.mutedForeground,
              }}
            />
          </CardContent>
        </Card>

        {/* Color Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Paleta de Cores</CardTitle>
            <CardDescription>
              Cores principais do tema atual
            </CardDescription>
          </CardHeader>
          <CardContent style={{ gap: 12 }}>
            {[
              { name: "Primária", color: colors.primary, description: "Cor principal da marca" },
              { name: "Fundo", color: colors.background, description: "Cor de fundo principal" },
              { name: "Cartão", color: colors.card, description: "Cor de fundo dos cartões" },
              { name: "Texto", color: colors.foreground, description: "Cor do texto principal" },
              { name: "Texto Secundário", color: colors.mutedForeground, description: "Cor do texto secundário" },
            ].map((colorInfo) => (
              <View
                key={colorInfo.name}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  backgroundColor: colors.muted,
                  borderRadius: 8,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: colorInfo.color,
                    marginRight: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="small" style={{ fontWeight: "600" }}>
                    {colorInfo.name}
                  </Text>
                  <Text variant="xs" style={{ color: colors.mutedForeground }}>
                    {colorInfo.description}
                  </Text>
                </View>
                <Text
                  variant="xs"
                  style={{
                    fontFamily: "monospace",
                    color: colors.mutedForeground,
                  }}
                >
                  {colorInfo.color.toUpperCase()}
                </Text>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sobre os Temas</CardTitle>
          </CardHeader>
          <CardContent style={{ gap: 8 }}>
            <Text variant="small" style={{ color: colors.foreground }}>
              • <Text variant="small" style={{ fontWeight: "600" }}>Sistema:</Text> Segue automaticamente a preferência do seu dispositivo
            </Text>
            <Text variant="small" style={{ color: colors.foreground }}>
              • <Text variant="small" style={{ fontWeight: "600" }}>Claro:</Text> Interface com cores claras, ideal para ambientes bem iluminados
            </Text>
            <Text variant="small" style={{ color: colors.foreground }}>
              • <Text variant="small" style={{ fontWeight: "600" }}>Escuro:</Text> Interface com cores escuras, reduz o cansaço visual
            </Text>
            <View style={{ marginTop: 8, padding: 12, backgroundColor: colors.muted, borderRadius: 8 }}>
              <Text variant="xs" style={{ color: colors.mutedForeground }}>
                Sua preferência é salva automaticamente e aplicada em todo o aplicativo.
              </Text>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}
