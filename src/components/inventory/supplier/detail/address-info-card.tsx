import { View } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import type { Supplier } from "@/types";
import { cn } from "@/lib/utils";
import { formatCEP } from "@/utils";

interface AddressInfoCardProps {
  supplier: Supplier;
  className?: string;
}

export function AddressInfoCard({ supplier, className }: AddressInfoCardProps) {
  const hasAddress = supplier.address || supplier.city || supplier.state || supplier.zipCode;
  const fullAddress = [
    supplier.address,
    supplier.addressNumber,
    supplier.addressComplement,
    supplier.neighborhood,
    supplier.city,
    supplier.state,
    supplier.zipCode ? formatCEP(supplier.zipCode) : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Card className={cn("shadow-sm border border-border flex flex-col", className)} level={1}>
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <View className="p-2 rounded-lg bg-primary/10">
            <Icon name="map-pin" size={20} className="text-primary" />
          </View>
          <Text className="text-xl font-semibold">Endereço</Text>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        <View className="space-y-6">
          {hasAddress ? (
            <>
              {/* Full Address Display */}
              {fullAddress && (
                <View className="bg-muted/30 rounded-lg p-4 mb-6">
                  <View className="flex flex-row items-center gap-2 mb-2">
                    <Icon name="map-pin" size={16} />
                    <Text className="text-sm text-muted-foreground">Endereço Completo</Text>
                  </View>
                  <Text className="text-base text-foreground leading-relaxed">{fullAddress}</Text>
                </View>
              )}

              {/* Address Components */}
              <View className="space-y-4">
                {supplier.address && (
                  <View className="flex flex-row justify-between items-center bg-muted/50 rounded-lg px-4 py-3">
                    <View className="flex flex-row items-center gap-2">
                      <Icon name="road" size={16} />
                      <Text className="text-sm font-medium text-muted-foreground">Logradouro</Text>
                    </View>
                    <Text className="text-sm font-semibold text-foreground">{supplier.address}</Text>
                  </View>
                )}

                {supplier.addressNumber && (
                  <View className="flex flex-row justify-between items-center bg-muted/50 rounded-lg px-4 py-3">
                    <View className="flex flex-row items-center gap-2">
                      <Icon name="home" size={16} />
                      <Text className="text-sm font-medium text-muted-foreground">Número</Text>
                    </View>
                    <Text className="text-sm font-semibold text-foreground">{supplier.addressNumber}</Text>
                  </View>
                )}

                {supplier.addressComplement && (
                  <View className="flex flex-row justify-between items-center bg-muted/50 rounded-lg px-4 py-3">
                    <View className="flex flex-row items-center gap-2">
                      <Icon name="building" size={16} />
                      <Text className="text-sm font-medium text-muted-foreground">Complemento</Text>
                    </View>
                    <Text className="text-sm font-semibold text-foreground">{supplier.addressComplement}</Text>
                  </View>
                )}

                {supplier.neighborhood && (
                  <View className="flex flex-row justify-between items-center bg-muted/50 rounded-lg px-4 py-3">
                    <Text className="text-sm font-medium text-muted-foreground">Bairro</Text>
                    <Text className="text-sm font-semibold text-foreground">{supplier.neighborhood}</Text>
                  </View>
                )}

                {supplier.city && (
                  <View className="flex flex-row justify-between items-center bg-muted/50 rounded-lg px-4 py-3">
                    <Text className="text-sm font-medium text-muted-foreground">Cidade</Text>
                    <Text className="text-sm font-semibold text-foreground">{supplier.city}</Text>
                  </View>
                )}

                {supplier.state && (
                  <View className="flex flex-row justify-between items-center bg-muted/50 rounded-lg px-4 py-3">
                    <Text className="text-sm font-medium text-muted-foreground">Estado</Text>
                    <Text className="text-sm font-semibold text-foreground">{supplier.state}</Text>
                  </View>
                )}

                {supplier.zipCode && (
                  <View className="flex flex-row justify-between items-center bg-muted/50 rounded-lg px-4 py-3">
                    <Text className="text-sm font-medium text-muted-foreground">CEP</Text>
                    <Text className="text-sm font-semibold text-foreground font-mono">{formatCEP(supplier.zipCode)}</Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            /* Empty State */
            <View className="text-center py-8">
              <View className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Icon name="map-pin" size={32} className="text-muted-foreground" />
              </View>
              <Text className="text-lg font-semibold mb-2 text-foreground">Nenhum endereço cadastrado</Text>
              <Text className="text-sm text-muted-foreground">Este fornecedor não possui endereço cadastrado.</Text>
            </View>
          )}
        </View>
      </CardContent>
    </Card>
  );
}
