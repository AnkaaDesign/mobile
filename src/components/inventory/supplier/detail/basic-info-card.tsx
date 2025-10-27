import { View } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import type { Supplier } from "@/types";
import { cn } from "@/lib/utils";
import { maskCNPJ } from "@/utils";
import { CustomerLogoDisplay } from "@/components/ui/customer-logo-display";

interface BasicInfoCardProps {
  supplier: Supplier;
  className?: string;
}

export function BasicInfoCard({ supplier, className }: BasicInfoCardProps) {
  return (
    <Card className={cn("shadow-sm border border-border flex flex-col", className)} level={1}>
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <View className="p-2 rounded-lg bg-primary/10">
            <Icon name="building" size={20} className="text-primary" />
          </View>
          <Text className="text-xl font-semibold">Informações Básicas</Text>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        <View className="space-y-6">
          {/* Logo Section */}
          <View className="flex justify-center mb-6">
            <CustomerLogoDisplay
              logo={supplier.logo}
              customerName={supplier.fantasyName}
              size="2xl"
              shape="rounded"
            />
          </View>

          {/* Basic Information Section */}
          <View>
            <Text className="text-base font-semibold mb-4 text-foreground">Identificação</Text>
            <View className="space-y-4">
              <View className="flex flex-row justify-between items-center bg-muted/50 rounded-lg px-4 py-3">
                <Text className="text-sm font-medium text-muted-foreground">Nome Fantasia</Text>
                <Text className="text-sm font-semibold text-foreground">{supplier.fantasyName}</Text>
              </View>

              {supplier.corporateName && (
                <View className="flex flex-row justify-between items-center bg-muted/50 rounded-lg px-4 py-3">
                  <Text className="text-sm font-medium text-muted-foreground">Razão Social</Text>
                  <Text className="text-sm font-semibold text-foreground">{supplier.corporateName}</Text>
                </View>
              )}

              {supplier.cnpj && (
                <View className="flex flex-row justify-between items-center bg-muted/50 rounded-lg px-4 py-3">
                  <View className="flex flex-row items-center gap-2">
                    <Icon name="certificate" size={16} />
                    <Text className="text-sm font-medium text-muted-foreground">CNPJ</Text>
                  </View>
                  <Text className="text-sm font-semibold text-foreground">{maskCNPJ(supplier.cnpj)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
