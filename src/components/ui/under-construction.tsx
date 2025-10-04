import React from "react";
import { View, Text, ScrollView } from "react-native";
import { IconCircleCheck } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";

interface UnderConstructionProps {
  title: string;
  description?: string;
  icon?: string;
  showBackButton?: boolean;
}

export function UnderConstruction({
  title,
  description = "Esta funcionalidade será implementada em breve. Estamos trabalhando para trazer uma experiência completa.",
  icon = "construction",
  showBackButton = false,
}: UnderConstructionProps) {
  const { colors, isDark } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16, gap: 24 }}>
        <View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: colors.foreground,
              marginBottom: 4,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 14,
            }}
          >
            Esta página está em desenvolvimento.
          </Text>
        </View>

        <View
          style={{
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: colors.border,
            borderRadius: 8,
            minHeight: 400,
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <View style={{ alignItems: "center", gap: 16 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.muted,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 32 }}>🚧</Text>
            </View>

            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: colors.foreground,
                textAlign: "center",
              }}
            >
              Em Construção
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                textAlign: "center",
                maxWidth: 280,
                lineHeight: 20,
              }}
            >
              {description}
            </Text>

            {/* Feature preview items */}
            <View style={{ marginTop: 32, gap: 8 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.foreground,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Funcionalidades Previstas:
              </Text>

              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <IconCircleCheck size={16} color="#10b981" />
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.mutedForeground,
                    }}
                  >
                    Interface intuitiva e responsiva
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <IconCircleCheck size={16} color="#10b981" />
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.mutedForeground,
                    }}
                  >
                    Integração com sistema completo
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <IconCircleCheck size={16} color="#10b981" />
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.mutedForeground,
                    }}
                  >
                    Operações em tempo real
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

export default UnderConstruction;
