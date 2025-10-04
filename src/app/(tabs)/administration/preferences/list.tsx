import React from "react";
import { ScrollView } from "react-native";
import { router } from "expo-router";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedSafeAreaView } from "@/components/ui/themed-safe-area-view";
import { Header } from "@/components/ui/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import OptimizedTouchable from "@/components/ui/optimized-touchable";

interface PreferenceCategory {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  badge?: string;
  status?: "active" | "inactive" | "warning";
}

const preferenceCategories: PreferenceCategory[] = [
  {
    id: "general",
    title: "Configurações Gerais",
    description: "Informações da empresa, configurações padrão e personalizações",
    route: "/administration/preferences/general",
    icon: "settings",
    status: "active"
  },
  {
    id: "integrations",
    title: "Integrações",
    description: "APIs externas, webhooks e configurações de terceiros",
    route: "/administration/preferences/integrations",
    icon: "link",
    status: "active"
  },
  {
    id: "security",
    title: "Segurança",
    description: "Controles de acesso, políticas e permissões do sistema",
    route: "/administration/preferences/security",
    icon: "shield-check",
    status: "warning",
    badge: "Atenção"
  },
  {
    id: "backup",
    title: "Backup e Recuperação",
    description: "Configurações de backup automático e restauração",
    route: "/administration/preferences/backup",
    icon: "database",
    status: "active"
  }
];

const StatusBadge = ({ status }: { status?: "active" | "inactive" | "warning" }) => {
  if (!status) return null;

  const variants = {
    active: { variant: "success" as const, text: "Ativo" },
    inactive: { variant: "secondary" as const, text: "Inativo" },
    warning: { variant: "warning" as const, text: "Atenção" }
  };

  const config = variants[status as keyof typeof variants];

  return (
    <Badge variant={config.variant} size="sm">
      {config.text}
    </Badge>
  );
};

const PreferenceCategoryCard = ({ category }: { category: PreferenceCategory }) => {
  const handlePress = () => {
    router.push(category.route as any);
  };

  return (
    <OptimizedTouchable onPress={handlePress}>
      <Card className="mb-4">
        <CardHeader className="p-4">
          <div className="flex-row items-center justify-between mb-2">
            <div className="flex-row items-center flex-1">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                <Icon
                  name={category.icon}
                  size={24}
                  className="text-primary"
                />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base mb-1">
                  {category.title}
                </CardTitle>
                {category.badge && (
                  <Badge variant="outline" size="sm" style={{ marginBottom: 8 }}>
                    {category.badge}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex-col items-end">
              <StatusBadge status={category.status} />
              <Icon
                name="chevron-right"
                size={16}
                className="text-muted-foreground mt-1"
              />
            </div>
          </div>
          <CardDescription className="text-sm">
            {category.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </OptimizedTouchable>
  );
};

export default function SystemPreferencesListScreen() {
  return (
    <ThemedSafeAreaView>
      <Header
        title="Preferências do Sistema"
        showBackButton
      />
      <ThemedView className="flex-1">
        <ScrollView className="flex-1 p-4">
          <div className="mb-6">
            <Badge variant="outline" style={{ marginBottom: 12 }}>
              Administração
            </Badge>
            <p className="text-muted-foreground text-sm mb-4">
              Configure as preferências globais do sistema, integrações e políticas de segurança.
            </p>
          </div>

          {preferenceCategories.map((category) => (
            <PreferenceCategoryCard
              key={category.id}
              category={category}
            />
          ))}

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex-row items-center mb-2">
              <Icon
                name="info"
                size={16}
                className="text-muted-foreground mr-2"
              />
              <p className="text-sm font-medium text-muted-foreground">
                Informações Importantes
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Algumas configurações podem afetar o funcionamento de todo o sistema.
              Consulte a documentação antes de fazer alterações críticas.
            </p>
          </div>
        </ScrollView>
      </ThemedView>
    </ThemedSafeAreaView>
  );
}