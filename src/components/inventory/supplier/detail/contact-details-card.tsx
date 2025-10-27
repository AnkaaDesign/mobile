import { View, Linking } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import type { Supplier } from "@/types";
import { cn } from "@/lib/utils";
import { formatBrazilianPhone } from "@/utils";

interface ContactDetailsCardProps {
  supplier: Supplier;
  className?: string;
}

export function ContactDetailsCard({ supplier, className }: ContactDetailsCardProps) {
  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsAppPress = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const whatsappNumber = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    Linking.openURL(`https://wa.me/${whatsappNumber}`);
  };

  const handleWebsitePress = (site: string) => {
    const url = site.startsWith("http") ? site : `https://${site}`;
    Linking.openURL(url);
  };

  return (
    <Card className={cn("shadow-sm border border-border flex flex-col", className)} level={1}>
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <View className="p-2 rounded-lg bg-primary/10">
            <Icon name="phone-call" size={20} className="text-primary" />
          </View>
          <Text className="text-xl font-semibold">Informações de Contato</Text>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        <View className="space-y-6">
          {/* Email Section */}
          {supplier.email && (
            <View>
              <Text className="text-base font-semibold mb-4 text-foreground">E-mail</Text>
              <View className="flex flex-row justify-between items-center bg-muted/50 rounded-lg px-4 py-3">
                <View className="flex flex-row items-center gap-2">
                  <Icon name="mail" size={16} />
                  <Text className="text-sm font-medium text-muted-foreground">E-mail Principal</Text>
                </View>
                <Button
                  variant="link"
                  onPress={() => handleEmailPress(supplier.email!)}
                  className="p-0 h-auto"
                >
                  <Text className="text-sm font-semibold text-green-600">{supplier.email}</Text>
                </Button>
              </View>
            </View>
          )}

          {/* Phone Numbers Section */}
          {supplier.phones && supplier.phones.length > 0 && (
            <View className={supplier.email ? "pt-6 border-t border-border/50" : ""}>
              <Text className="text-base font-semibold mb-4 text-foreground">Telefones</Text>
              <View className="space-y-3">
                {supplier.phones.map((phone, index) => (
                  <View key={index} className="flex flex-row justify-between items-center bg-muted/50 rounded-lg px-4 py-3">
                    <View className="flex flex-row items-center gap-2">
                      <Icon name="phone" size={16} />
                      <Text className="text-sm font-medium text-muted-foreground">
                        Telefone {supplier.phones!.length > 1 ? `${index + 1}` : ""}
                      </Text>
                    </View>
                    <View className="flex flex-row items-center gap-3">
                      <Button
                        variant="link"
                        onPress={() => handlePhonePress(phone)}
                        className="p-0 h-auto"
                      >
                        <Text className="text-sm font-semibold text-green-600 font-mono">
                          {formatBrazilianPhone(phone)}
                        </Text>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => handleWhatsAppPress(phone)}
                        className="p-1"
                      >
                        <Icon name="brand-whatsapp" size={20} className="text-green-600" />
                      </Button>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Website Section */}
          {supplier.site && (
            <View className={supplier.email || (supplier.phones && supplier.phones.length > 0) ? "pt-6 border-t border-border/50" : ""}>
              <Text className="text-base font-semibold mb-4 text-foreground">Website</Text>
              <View className="flex flex-row justify-between items-center bg-muted/50 rounded-lg px-4 py-3">
                <View className="flex flex-row items-center gap-2">
                  <Icon name="world" size={16} />
                  <Text className="text-sm font-medium text-muted-foreground">Site</Text>
                </View>
                <Button
                  variant="link"
                  onPress={() => handleWebsitePress(supplier.site!)}
                  className="p-0 h-auto"
                >
                  <Text className="text-sm font-semibold text-green-600">{supplier.site}</Text>
                </Button>
              </View>
            </View>
          )}

          {/* Empty State */}
          {!supplier.email && (!supplier.phones || supplier.phones.length === 0) && !supplier.site && (
            <View className="text-center py-8">
              <View className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Icon name="phone-call" size={32} className="text-muted-foreground" />
              </View>
              <Text className="text-lg font-semibold mb-2 text-foreground">Nenhuma informação de contato</Text>
              <Text className="text-sm text-muted-foreground">Este fornecedor não possui informações de contato cadastradas.</Text>
            </View>
          )}
        </View>
      </CardContent>
    </Card>
  );
}
