/**
 * <DetailScreen> — canonical detail-page template.
 *
 * Encapsulates: DetailPageHeader, pull-to-refresh, edit-button visibility
 * (privilege + status), delete confirmation, 404 → dismissTo(notFoundFallback),
 * useScreenReady, status-aware redirect via useStatusGuard.
 *
 * dataLoader.phases slot lets a screen wait on a sequence of queries before
 * declaring itself ready (cronograma uses this for its two-phase
 * minimal/full task-detail include). Required by Area 6.
 *
 * TODO(area-6): the cronograma multi-context split (agenda/historico/tarefa)
 * still needs to be wired by the area-6 implementation agent. The template
 * now exposes the dataLoader.phases slot but the per-context routing into it
 * is consumer-owned.
 */
import React, { ReactNode, useCallback, useMemo } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet, ActivityIndicator } from "react-native";
import type { UseQueryResult, UseMutationResult } from "@tanstack/react-query";

import { useTheme } from "@/lib/theme";
import { ThemedView } from "@/components/ui/themed-view";
import { ErrorScreen } from "@/components/ui/error-screen";
import { DetailPageHeader, type BaseEntity, type IconComponent, type BadgeConfig } from "@/components/ui/detail-page-header";
import type { PageAction } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useNav } from "@/contexts/nav";
import { useStatusGuard, type StatusGuardConfig } from "@/hooks/use-status-guard";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { usePrivilegeGate, type PrivilegeReq } from "@/hooks/use-privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";
import type { AppRoute } from "@/constants/routes.types";
import { spacing } from "@/constants/design-system";

/**
 * Context object passed as the second argument to <DetailScreen> children.
 * Lets consumers conditionally render status-change actions without
 * re-implementing the editable predicate.
 */
export interface DetailScreenChildContext {
  /** True when the entity is in an editable status (or no editGuard set). */
  isEditable: boolean;
  /** True when the entity is in a terminal/non-editable status. */
  isTerminal: boolean;
  /** Optional sequenced phase queries (mirrors the dataLoader.phases prop). */
  phases?: UseQueryResult<any>[];
}

export interface DetailScreenProps<T extends BaseEntity> {
  query: UseQueryResult<T | { data?: T } | any>;
  icon: IconComponent;
  /**
   * Resolves the title displayed in the header. Required for transactional
   * entities lacking a `name` field (Borrow, PpeDelivery, Maintenance).
   * When omitted, falls back to `entity.name`.
   */
  title?: (entity: T) => string;
  subtitle?: (entity: T) => ReactNode;
  badges?: (entity: T) => BadgeConfig[];
  status?: (entity: T) => { label: string; variant?: any };
  editRoute?: (entity: T) => AppRoute;
  deleteAction?: {
    mutation: UseMutationResult<any, unknown, string>;
    confirmText?: string;
    successRoute?: AppRoute;
  };
  /**
   * Privilege required to DELETE this entity. Defaults to `privilege` (page
   * access) for backwards compatibility. Pass a stricter requirement (e.g.
   * ADMIN-only) when deletion must be gated separately from edit/view — e.g.
   * WAREHOUSE may manage orders/suppliers but must never delete them.
   */
  deletePrivilege?: PrivilegeReq;
  /**
   * Overflow-menu actions rendered in the header. Status / privilege
   * filtering is the consumer's responsibility — pass an empty array (or
   * filter the list) when an action is not currently allowed.
   */
  actions?: PageAction[];
  privilege?: PrivilegeReq;
  /** Status allowlist for edit visibility. */
  editGuard?: StatusGuardConfig<T>;
  /** Where to dismissTo on a 404 / load failure. */
  notFoundFallback?: AppRoute;
  /**
   * Sequenced loading phases — every phase must finish loading before the
   * children render. Used by cronograma for two-phase task-detail include.
   */
  dataLoader?: { phases: UseQueryResult<any>[] };
  /**
   * Body content. Receives the loaded entity plus a context object exposing
   * `isEditable` / `isTerminal` so consumers can conditionally render
   * status-change actions without re-implementing the predicate.
   */
  children: (entity: T, ctx: DetailScreenChildContext) => ReactNode;
  /**
   * Optional ref to the internal ScrollView.
   */
  scrollRef?: React.RefObject<ScrollView | null>;
}

function unwrapEntity<T extends BaseEntity>(q: DetailScreenProps<T>["query"]): T | undefined {
  const d: any = q.data;
  if (!d) return undefined;
  if (typeof d === "object" && "data" in d && d.data && typeof d.data === "object") return d.data as T;
  return d as T;
}

function InnerDetailScreen<T extends BaseEntity>(props: DetailScreenProps<T>) {
  const { colors } = useTheme();
  const nav = useNav();
  const entity = unwrapEntity<T>(props.query);

  // Phases must all be loaded before we declare ready / show body.
  const phasesLoaded = (props.dataLoader?.phases ?? []).every((p) => !p.isLoading);
  const isReady = !props.query.isLoading && phasesLoaded;
  useScreenReady(isReady);

  // Status guard: drives `isEditable` for the edit-button visibility.
  // editGuard runs even when no redirect is configured — the inline banner
  // path is handled by the consumer rendering `children` against `isEditable`.
  const guard = useStatusGuard<T>(entity, {
    field: props.editGuard?.field,
    editable: props.editGuard?.editable ?? [],
    redirectOnBlock: props.editGuard?.redirectOnBlock,
    message: props.editGuard?.message,
  });
  const editGuardActive = !!props.editGuard;

  const editPriv = usePrivilegeGate(props.privilege ?? SECTOR_PRIVILEGES.BASIC);
  // Delete is gated separately so a sector can manage an entity without being
  // able to delete it. Falls back to the page privilege when not specified.
  const deletePriv = usePrivilegeGate(props.deletePrivilege ?? props.privilege ?? SECTOR_PRIVILEGES.BASIC);

  const handleEdit = useCallback(() => {
    if (!entity || !props.editRoute) return;
    nav.push(props.editRoute(entity));
  }, [entity, props.editRoute, nav]);

  const handleDelete = useCallback(() => {
    if (!entity || !props.deleteAction) return;
    const { mutation, confirmText, successRoute } = props.deleteAction;
    Alert.alert(
      "Confirmar exclusão",
      confirmText ?? "Tem certeza que deseja excluir? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await nav.withLoading(async () => mutation.mutateAsync(entity.id));
              if (successRoute) nav.dismissTo(successRoute);
              else nav.goBack();
            } catch {
              // API client surfaces errors. Stay on the screen.
            }
          },
        },
      ],
    );
  }, [entity, props.deleteAction, nav]);

  // 404 — dismissTo configured fallback when the load completed with no entity.
  React.useEffect(() => {
    if (!props.query.isLoading && !props.query.isError && !entity && props.notFoundFallback) {
      nav.dismissTo(props.notFoundFallback);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.query.isLoading, props.query.isError, entity]);

  // Filter overflow actions on `hidden` flag (consumer should also pre-filter
  // on privilege/status; this is a defensive last pass).
  // Must run before the early returns below to keep hook order stable.
  const overflowActions = useMemo(
    () => (props.actions ?? []).filter((a) => !a.hidden),
    [props.actions],
  );

  if (props.query.isLoading || !phasesLoaded) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (props.query.isError) {
    return <ErrorScreen error={props.query.error as any} onRetry={() => props.query.refetch()} />;
  }

  if (!entity) {
    // notFoundFallback effect will navigate; render placeholder until then.
    return <ThemedView style={styles.centered} />;
  }

  const showEditButton =
    !!props.editRoute && editPriv.allowed && (!editGuardActive || guard.isEditable);

  const resolvedTitle = props.title ? props.title(entity) : entity.name ?? "";

  const childContext: DetailScreenChildContext = {
    isEditable: editGuardActive ? guard.isEditable : true,
    isTerminal: editGuardActive ? guard.isTerminal : false,
    phases: props.dataLoader?.phases,
  };

  return (
    <ScrollView
      ref={props.scrollRef}
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={props.query.isRefetching}
          onRefresh={() => props.query.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.headerWrap}>
        <DetailPageHeader<T>
          entity={entity}
          icon={props.icon}
          displayName={resolvedTitle}
          onRefresh={() => props.query.refetch()}
          onEdit={handleEdit}
          subtitle={props.subtitle?.(entity)}
          badges={props.badges?.(entity) ?? []}
          actions={overflowActions}
          showEditButton={showEditButton}
          isRefreshing={props.query.isRefetching}
        />
      </View>
      {!showEditButton && editGuardActive && guard.isTerminal ? (
        <View style={[styles.banner, { backgroundColor: colors.muted }]}>
          <ThemedText style={styles.bannerText}>
            {guard.message ?? "Este registro está em um estado finalizado e não pode ser editado."}
          </ThemedText>
        </View>
      ) : null}
      {props.status ? (
        <View style={styles.statusRow}>
          <Badge variant={(props.status(entity).variant as any) ?? "default"}>
            {props.status(entity).label}
          </Badge>
        </View>
      ) : null}
      <View style={styles.body}>
        {props.children(entity, childContext)}
      </View>
      {props.deleteAction && deletePriv.allowed ? (
        <View style={styles.deleteRow}>
          <ThemedText
            onPress={handleDelete}
            style={{ color: colors.destructive, fontWeight: "600" }}
          >
            Excluir
          </ThemedText>
        </View>
      ) : null}
      <View style={{ height: spacing.xxl * 2 }} />
    </ScrollView>
  );
}

export function DetailScreen<T extends BaseEntity>(props: DetailScreenProps<T>) {
  if (props.privilege) {
    return (
      <PrivilegeGate required={props.privilege} fallback="unauthorized">
        <InnerDetailScreen {...props} />
      </PrivilegeGate>
    );
  }
  return <InnerDetailScreen {...props} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  banner: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
  },
  bannerText: {
    fontSize: 14,
  },
  statusRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  body: {
    padding: spacing.md,
  },
  deleteRow: {
    padding: spacing.lg,
    alignItems: "center",
  },
});
