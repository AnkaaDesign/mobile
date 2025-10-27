import React from "react";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { ScrollView, View, Alert } from "react-native";
import { useAirbrushingDetail, useAirbrushingMutations } from '../../../../../hooks';
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconEdit, IconTrash, IconBrush, IconUser, IconTruck, IconCalendar, IconCurrencyDollar } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { formatCurrency, formatDate } from '../../../../../utils';
import { AIRBRUSHING_STATUS, AIRBRUSHING_STATUS_LABELS } from '../../../../../constants';
import { getBadgeVariantFromStatus } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from '../../../../../utils';
import { SECTOR_PRIVILEGES } from '../../../../../constants';

export default function AirbrushingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { deleteAsync } = useAirbrushingMutations();

  const {
    data: airbrushingResponse,
    isLoading,
    error,
  } = useAirbrushingDetail(id as string, {
    include: {
      task: {
        include: {
          customer: true,
          truck: true,
          services: true,
          logoPaints: {
            include: {
              paint: true,
            },
          },
          generalPainting: {
            include: {
              paint: true,
            },
          },
        },
      },
      receipts: true,
      nfes: true,
      artworks: true,
    },
  });

  const airbrushing = airbrushingResponse?.data;

  // Permission check
  const canEdit = React.useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.LEADER) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  const canDelete = React.useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  const handleEdit = React.useCallback(() => {
    router.push(`/production/airbrushing/edit/${id}`);
  }, [id]);

  const handleDelete = React.useCallback(async () => {
    Alert.alert(
      "Excluir Airbrushing",
      "Tem certeza que deseja excluir este airbrushing? Esta ação é irreversível.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(id as string);
              router.back();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir o airbrushing");
            }
          },
        },
      ]
    );
  }, [deleteAsync, id]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Carregando...",
            headerBackTitle: "Voltar",
          }}
        />
        <LoadingScreen />
      </>
    );
  }

  if (error || !airbrushing) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Erro",
            headerBackTitle: "Voltar",
          }}
        />
        <ErrorScreen
          title="Erro ao carregar airbrushing"
          message={error?.message || "Airbrushing não encontrado"}
        />
      </>
    );
  }

  const statusBadgeVariant = getBadgeVariantFromStatus(airbrushing.status, "AIRBRUSHING_STATUS");

  return (
    <>
      <Stack.Screen
        options={{
          title: "Airbrushing",
          headerBackTitle: "Voltar",
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: spacing.xs }}>
              {canEdit && (
                <Button variant="ghost" size="icon" onPress={handleEdit}>
                  <IconEdit size={20} color={colors.foreground} />
                </Button>
              )}
              {canDelete && (
                <Button variant="ghost" size="icon" onPress={handleDelete}>
                  <IconTrash size={20} color={colors.destructive} />
                </Button>
              )}
            </View>
          ),
        }}
      />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: spacing.md }}>
          {/* Status Header */}
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
              <IconBrush size={20} color={colors.primary} />
              <ThemedText style={{ fontSize: 18, fontWeight: "600" }}>
                Status do Airbrushing
              </ThemedText>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <ThemedText style={{ fontSize: 16 }}>
                {AIRBRUSHING_STATUS_LABELS[airbrushing.status as AIRBRUSHING_STATUS]}
              </ThemedText>
              <Badge variant={statusBadgeVariant}>
                {AIRBRUSHING_STATUS_LABELS[airbrushing.status as AIRBRUSHING_STATUS]}
              </Badge>
            </View>
          </Card>

          {/* Task Information */}
          {airbrushing.task && (
            <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }}>
                <IconUser size={20} color={colors.primary} />
                <ThemedText style={{ fontSize: 18, fontWeight: "600" }}>
                  Informações da Tarefa
                </ThemedText>
              </View>

              <View style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <ThemedText style={{ color: colors.muted, fontSize: 14 }}>
                    Nome da Tarefa:
                  </ThemedText>
                  <ThemedText style={{ fontWeight: "500", fontSize: 14 }}>
                    {airbrushing.task.name}
                  </ThemedText>
                </View>

                {airbrushing.task.customer && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <ThemedText style={{ color: colors.muted, fontSize: 14 }}>
                      Cliente:
                    </ThemedText>
                    <ThemedText style={{ fontWeight: "500", fontSize: 14 }}>
                      {airbrushing.task.customer.fantasyName}
                    </ThemedText>
                  </View>
                )}

                {airbrushing.task.truck && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <ThemedText style={{ color: colors.muted, fontSize: 14 }}>
                      Veículo:
                    </ThemedText>
                    <ThemedText style={{ fontWeight: "500", fontSize: 14 }}>
                      {airbrushing.task.truck.model} - {airbrushing.task.truck.plate}
                    </ThemedText>
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* Dates and Price */}
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }}>
              <IconCalendar size={20} color={colors.primary} />
              <ThemedText style={{ fontSize: 18, fontWeight: "600" }}>
                Datas e Valores
              </ThemedText>
            </View>

            <View style={{ gap: spacing.sm }}>
              {airbrushing.startDate && (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <ThemedText style={{ color: colors.muted, fontSize: 14 }}>
                    Data de Início:
                  </ThemedText>
                  <ThemedText style={{ fontWeight: "500", fontSize: 14 }}>
                    {formatDate(airbrushing.startDate)}
                  </ThemedText>
                </View>
              )}

              {airbrushing.finishDate && (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <ThemedText style={{ color: colors.muted, fontSize: 14 }}>
                    Data de Finalização:
                  </ThemedText>
                  <ThemedText style={{ fontWeight: "500", fontSize: 14 }}>
                    {formatDate(airbrushing.finishDate)}
                  </ThemedText>
                </View>
              )}

              {airbrushing.price && (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <ThemedText style={{ color: colors.muted, fontSize: 14 }}>
                    Preço:
                  </ThemedText>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                    <IconCurrencyDollar size={16} color={colors.success} />
                    <ThemedText style={{ fontWeight: "600", fontSize: 14, color: colors.success }}>
                      {formatCurrency(airbrushing.price)}
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>
          </Card>

          {/* Paints Information */}
          {airbrushing.task?.logoPaints?.length || airbrushing.task?.generalPainting ? (
            <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }}>
                <IconBrush size={20} color={colors.primary} />
                <ThemedText style={{ fontSize: 18, fontWeight: "600" }}>
                  Tintas Utilizadas
                </ThemedText>
              </View>

              <View style={{ gap: spacing.md }}>
                {(airbrushing.task.generalPainting as any)?.paint && (
                  <View>
                    <ThemedText style={{ fontWeight: "500", marginBottom: spacing.xs }}>
                      Tinta Geral:
                    </ThemedText>
                    <Badge variant="secondary">
                      {(airbrushing.task.generalPainting as any)?.paint?.name}
                    </Badge>
                  </View>
                )}

                {airbrushing.task.logoPaints?.length > 0 && (
                  <View>
                    <ThemedText style={{ fontWeight: "500", marginBottom: spacing.xs }}>
                      Tintas do Logo ({airbrushing.task.logoPaints.length}):
                    </ThemedText>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                      {airbrushing.task.logoPaints.map((logoPaint) => (
                        <Badge key={logoPaint.id} variant="outline">
                          {(logoPaint as any)?.paint?.name || "Tinta sem nome"}
                        </Badge>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </Card>
          ) : null}

          {/* Files */}
          {(airbrushing.receipts?.length || airbrushing.nfes?.length || airbrushing.artworks?.length) ? (
            <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
              <ThemedText style={{ fontSize: 18, fontWeight: "600", marginBottom: spacing.md }}>
                Arquivos
              </ThemedText>

              <View style={{ gap: spacing.md }}>
                {airbrushing.receipts?.length > 0 && (
                  <View>
                    <ThemedText style={{ fontWeight: "500", marginBottom: spacing.xs }}>
                      Recibos ({airbrushing.receipts.length}):
                    </ThemedText>
                    {airbrushing.receipts.map((file) => (
                      <ThemedText key={file.id} style={{ fontSize: 14, color: colors.muted }}>
                        • {file.filename}
                      </ThemedText>
                    ))}
                  </View>
                )}

                {airbrushing.nfes?.length > 0 && (
                  <View>
                    <ThemedText style={{ fontWeight: "500", marginBottom: spacing.xs }}>
                      NFEs ({airbrushing.nfes.length}):
                    </ThemedText>
                    {airbrushing.nfes.map((file) => (
                      <ThemedText key={file.id} style={{ fontSize: 14, color: colors.muted }}>
                        • {file.filename}
                      </ThemedText>
                    ))}
                  </View>
                )}

                {airbrushing.artworks?.length > 0 && (
                  <View>
                    <ThemedText style={{ fontWeight: "500", marginBottom: spacing.xs }}>
                      Arte ({airbrushing.artworks.length}):
                    </ThemedText>
                    {airbrushing.artworks.map((file) => (
                      <ThemedText key={file.id} style={{ fontSize: 14, color: colors.muted }}>
                        • {file.filename}
                      </ThemedText>
                    ))}
                  </View>
                )}
              </View>
            </Card>
          ) : null}

          {/* Services */}
          {airbrushing.task?.services?.length > 0 && (
            <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
              <ThemedText style={{ fontSize: 18, fontWeight: "600", marginBottom: spacing.md }}>
                Serviços ({airbrushing.task.services.length})
              </ThemedText>

              <View style={{ gap: spacing.sm }}>
                {airbrushing.task.services.map((service) => (
                  <View key={service.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <ThemedText style={{ flex: 1, fontSize: 14 }}>
                      {(service as any)?.name}
                    </ThemedText>
                    {(service as any)?.price && (
                      <ThemedText style={{ fontSize: 14, color: colors.success, fontWeight: "500" }}>
                        {formatCurrency((service as any)?.price)}
                      </ThemedText>
                    )}
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Metadata */}
          <Card style={{ padding: spacing.md }}>
            <ThemedText style={{ fontSize: 18, fontWeight: "600", marginBottom: spacing.md }}>
              Informações do Sistema
            </ThemedText>

            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <ThemedText style={{ color: colors.muted, fontSize: 14 }}>
                  Criado em:
                </ThemedText>
                <ThemedText style={{ fontSize: 14 }}>
                  {formatDate(airbrushing.createdAt)}
                </ThemedText>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <ThemedText style={{ color: colors.muted, fontSize: 14 }}>
                  Atualizado em:
                </ThemedText>
                <ThemedText style={{ fontSize: 14 }}>
                  {formatDate(airbrushing.updatedAt)}
                </ThemedText>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </>
  );
}