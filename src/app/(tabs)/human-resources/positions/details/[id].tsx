import React, { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { usePosition } from '../../../../../hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE } from '../../../../../constants';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Header } from "@/components/ui/header";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBriefcase, IconRefresh, IconEdit } from "@tabler/icons-react-native";
import { routeToMobilePath } from "@/lib/route-mapper";
import { TouchableOpacity } from "react-native";
import { showToast } from "@/components/ui/toast";

// Import modular components
import { PositionCard, SalaryInfoCard, EmployeesCard, RemunerationsCard } from "@/components/human-resources/position/detail";
import { PositionDetailSkeleton } from "@/components/human-resources/position/skeleton";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { Card as CardComponent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconHistory } from "@tabler/icons-react-native";

export default function PositionDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = usePosition(id, {
    include: {
      users: {
        include: {
          position: true,
        },
      },
      remunerations: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: {
          users: true,
          remunerations: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  const position = response?.data;

  const handleEdit = () => {
    if (position) {
      router.push(routeToMobilePath(routes.humanResources.positions.edit(position.id)) as any);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      showToast({ message: "Dados atualizados com sucesso", type: "success" });
    });
  }, [refetch]);

  if (isLoading) {
    return <PositionDetailSkeleton />;
  }

  if (error || !position || !id || id === "") {
    return (
      <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card>
            <CardContent style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconBriefcase size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>Cargo não encontrado</ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                O cargo solicitado não foi encontrado ou pode ter sido removido.
              </ThemedText>
              <Button onPress={() => router.back()}>
                <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
              </Button>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
      {/* Header */}
      <Header
        title={position.name}
        showBackButton={true}
        onBackPress={() => router.back()}
        rightAction={
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={handleRefresh}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.muted,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
              disabled={refreshing}
            >
              <IconRefresh size={18} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEdit}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <IconEdit size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Modular Components */}
          <PositionCard position={position} />
          <SalaryInfoCard position={position} />
          <EmployeesCard position={position} />
          <RemunerationsCard position={position} />

          {/* Changelog Timeline */}
          <CardComponent>
            <CardHeader>
              <CardTitle style={styles.sectionTitle}>
                <View style={styles.titleRow}>
                  <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
                    <IconHistory size={18} color={colors.primary} />
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Histórico de Alterações</ThemedText>
                </View>
              </CardTitle>
            </CardHeader>
            <CardContent style={{ paddingHorizontal: 0 }}>
              <ChangelogTimeline entityType={CHANGE_LOG_ENTITY_TYPE.POSITION} entityId={position.id} entityName={position.name} entityCreatedAt={position.createdAt} maxHeight={400} />
            </CardContent>
          </CardComponent>

          {/* Bottom spacing for mobile navigation */}
          <View style={{ height: spacing.xxl * 2 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  errorContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});
