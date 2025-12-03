import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useChangeLog } from "@/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Header } from "@/components/ui/header";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
// import { showToast } from "@/components/ui/toast";
import { IconFileText, IconRefresh } from "@tabler/icons-react-native";
import { TouchableOpacity } from "react-native";

// Import modular components
import {
  ChangeLogCard,
  ChangesDiffCard,
  UserCard,
  EntityLinkCard,
} from "@/components/administration/change-log/detail";
import { ChangeLogDetailSkeleton } from "@/components/administration/change-log/skeleton/change-log-detail-skeleton";

export default function ChangeLogDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useChangeLog(id, {
    include: {
      user: true,
    },
    enabled: !!id && id !== "",
  });

  const changeLog = response?.data;

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      Alert.alert("Sucesso", "Dados atualizados com sucesso");
    });
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
        <Header
          title="Detalhes do Registro"
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
          <ChangeLogDetailSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (error || !changeLog || !id || id === "") {
    return (
      <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
        <Header
          title="Detalhes do Registro"
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
          <View style={styles.container}>
            <Card>
              <CardContent style={styles.errorContent}>
                <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                  <IconFileText size={32} color={colors.mutedForeground} />
                </View>
                <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                  Registro não encontrado
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                  O registro de alteração solicitado não foi encontrado ou pode ter sido removido.
                </ThemedText>
                <Button onPress={() => router.back()}>
                  <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
                </Button>
              </CardContent>
            </Card>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
      {/* Header */}
      <Header
        title="Detalhes do Registro"
        showBackButton={true}
        onBackPress={() => router.back()}
        rightAction={
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
        }
      />

      <ScrollView
        style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Main Change Log Information */}
          <ChangeLogCard changeLog={changeLog} />

          {/* Changes Diff (Before/After) */}
          <ChangesDiffCard changeLog={changeLog} />

          {/* User Who Made the Change */}
          <UserCard changeLog={changeLog} />

          {/* Entity Link */}
          <EntityLinkCard changeLog={changeLog} />

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
});
