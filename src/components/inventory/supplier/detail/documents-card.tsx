import { View } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import type { Supplier } from "@/types";
import type { File as AnkaaFile } from "@/types";
import { cn } from "@/lib/utils";
import { maskCNPJ } from "@/utils";
import { FileItem } from "@/components/file";

interface DocumentsCardProps {
  supplier: Supplier;
  className?: string;
  // Extended supplier type that includes document fields (for future use)
  contracts?: AnkaaFile[];
  certificates?: AnkaaFile[];
  otherDocuments?: AnkaaFile[];
}

export function DocumentsCard({
  supplier,
  className,
  contracts = [],
  certificates = [],
  otherDocuments = []
}: DocumentsCardProps) {
  const allDocuments = [...contracts, ...certificates, ...otherDocuments];
  const hasDocuments = supplier.cnpj || allDocuments.length > 0;

  return (
    <Card className={cn("shadow-sm border border-border flex flex-col", className)} level={1}>
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <View className="p-2 rounded-lg bg-primary/10">
            <Icon name="file-text" size={20} className="text-primary" />
          </View>
          <Text className="text-xl font-semibold">Documentos</Text>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        <View className="space-y-6">
          {hasDocuments ? (
            <>
              {/* CNPJ Information */}
              {supplier.cnpj && (
                <View>
                  <Text className="text-base font-semibold mb-4 text-foreground">Documentação Legal</Text>
                  <View className="space-y-4">
                    <View className="flex flex-row justify-between items-center bg-muted/50 rounded-lg px-4 py-3">
                      <View className="flex flex-row items-center gap-2">
                        <Icon name="building" size={16} />
                        <Text className="text-sm font-medium text-muted-foreground">CNPJ</Text>
                      </View>
                      <Text className="text-sm font-semibold text-foreground">{maskCNPJ(supplier.cnpj)}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Contracts Section */}
              {contracts.length > 0 && (
                <View>
                  <View className="flex flex-row items-center gap-2 mb-4">
                    <Icon name="file-type-pdf" size={20} className="text-red-500" />
                    <Text className="text-base font-semibold text-foreground">Contratos</Text>
                  </View>
                  <View className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {contracts.map((file) => (
                      <FileItem
                        key={file.id}
                        file={file}
                        viewMode="list"
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Certificates Section */}
              {certificates.length > 0 && (
                <View>
                  <View className="flex flex-row items-center gap-2 mb-4">
                    <Icon name="certificate" size={20} className="text-blue-500" />
                    <Text className="text-base font-semibold text-foreground">Certificados</Text>
                  </View>
                  <View className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {certificates.map((file) => (
                      <FileItem
                        key={file.id}
                        file={file}
                        viewMode="list"
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Other Documents Section */}
              {otherDocuments.length > 0 && (
                <View>
                  <View className="flex flex-row items-center gap-2 mb-4">
                    <Icon name="file-text" size={20} className="text-muted-foreground" />
                    <Text className="text-base font-semibold text-foreground">Outros Documentos</Text>
                  </View>
                  <View className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {otherDocuments.map((file) => (
                      <FileItem
                        key={file.id}
                        file={file}
                        viewMode="list"
                      />
                    ))}
                  </View>
                </View>
              )}
            </>
          ) : (
            <View className="text-center py-8">
              <View className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Icon name="file-text" size={32} className="text-muted-foreground" />
              </View>
              <Text className="text-lg font-semibold mb-2 text-foreground">Nenhum documento cadastrado</Text>
              <Text className="text-sm text-muted-foreground">Este fornecedor não possui documentos cadastrados.</Text>
            </View>
          )}
        </View>
      </CardContent>
    </Card>
  );
}
