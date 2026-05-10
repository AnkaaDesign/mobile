/**
 * <ListScreen> — canonical list-page template.
 *
 * Encapsulates: PageHeader, pull-to-refresh wired to query.refetch,
 * infinite-scroll onEndReached, list skeleton, error retry, primary-action
 * gating via PrivilegeGate, useScreenReady(!query.isLoading).
 *
 * Accepts either a `useQuery` result (single fetch — flat list) or a
 * `useInfiniteQuery` result (paged — uses fetchNextPage). Detection is
 * by presence of `fetchNextPage` on the query object.
 */
import React, { ReactNode, useCallback } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import type { UseQueryResult, UseInfiniteQueryResult } from "@tanstack/react-query";

import { useTheme } from "@/lib/theme";
import { ThemedView } from "@/components/ui/themed-view";
import { ErrorScreen } from "@/components/ui/error-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useNav } from "@/contexts/nav";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { usePrivilegeGate, type PrivilegeReq } from "@/hooks/use-privilege-gate";
import type { AppRoute } from "@/constants/routes.types";
import { SECTOR_PRIVILEGES } from "@/constants";
import { spacing } from "@/constants/design-system";

export interface BulkAction<T> {
  id: string;
  label: string;
  onPress: (selected: T[]) => void;
  destructive?: boolean;
  privilege?: PrivilegeReq;
}

export interface ListScreenProps<T> {
  title: string;
  icon?: string;
  query: UseInfiniteQueryResult<any> | UseQueryResult<T[] | { data?: T[] } | any>;
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
  emptyState?: { title: string; description?: string; icon?: string };
  search?: { placeholder?: string; value?: string; onChange: (q: string) => void };
  filters?: ReactNode;
  primaryAction?: { label: string; route: AppRoute; privilege?: PrivilegeReq };
  bulkActions?: BulkAction<T>[];
  privilege?: PrivilegeReq;
  onItemPress?: (item: T) => AppRoute | void;
}

function isInfiniteQuery(q: any): q is UseInfiniteQueryResult<any> {
  return q && typeof q.fetchNextPage === "function";
}

function flattenInfinitePages<T>(q: UseInfiniteQueryResult<any>): T[] {
  const pages = (q.data as any)?.pages as any[] | undefined;
  if (!Array.isArray(pages)) return [];
  const flat: T[] = [];
  for (const p of pages) {
    if (Array.isArray(p)) flat.push(...(p as T[]));
    else if (Array.isArray(p?.data)) flat.push(...(p.data as T[]));
    else if (Array.isArray(p?.items)) flat.push(...(p.items as T[]));
  }
  return flat;
}

function extractItems<T>(q: ListScreenProps<T>["query"]): T[] {
  if (isInfiniteQuery(q)) return flattenInfinitePages<T>(q);
  const d: any = (q as UseQueryResult<any>).data;
  if (Array.isArray(d)) return d as T[];
  if (Array.isArray(d?.data)) return d.data as T[];
  if (Array.isArray(d?.items)) return d.items as T[];
  return [];
}

function InnerListScreen<T>({
  title,
  icon,
  query,
  renderItem,
  keyExtractor,
  emptyState,
  filters,
  primaryAction,
  onItemPress,
}: ListScreenProps<T>) {
  const { colors } = useTheme();
  const nav = useNav();
  useScreenReady(!query.isLoading);

  // Gate the primary action button on its declared privilege. Hooks must
  // run unconditionally — pass BASIC as a no-op when no privilege is set.
  const primaryActionPriv = usePrivilegeGate(
    primaryAction?.privilege ?? SECTOR_PRIVILEGES.BASIC,
  );
  const showPrimaryAction =
    !!primaryAction && (!primaryAction.privilege || primaryActionPriv.allowed);

  const items = extractItems<T>(query);

  const handleRefresh = useCallback(() => {
    query.refetch();
  }, [query]);

  const handleEndReached = useCallback(() => {
    if (!isInfiniteQuery(query)) return;
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  const renderListItem = useCallback(
    ({ item }: { item: T }) => {
      const child = renderItem(item);
      if (!onItemPress) return <>{child}</>;
      return (
        <View
          onTouchEnd={() => {
            const target = onItemPress(item);
            if (target) nav.push(target);
          }}
        >
          {child}
        </View>
      );
    },
    [renderItem, onItemPress, nav],
  );

  if (query.isLoading) {
    return (
      <ThemedView style={styles.root}>
        <PageHeader title={title} icon={icon} variant="list" />
        <View style={styles.body}>
          <ListSkeleton itemCount={6} />
        </View>
      </ThemedView>
    );
  }

  if (query.isError) {
    return (
      <ThemedView style={styles.root}>
        <PageHeader title={title} icon={icon} variant="list" />
        <ErrorScreen error={query.error as any} onRetry={() => query.refetch()} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.root}>
      <PageHeader
        title={title}
        icon={icon}
        variant="list"
        actions={
          showPrimaryAction && primaryAction
            ? [
                {
                  key: "primary",
                  label: primaryAction.label,
                  onPress: () => nav.push(primaryAction.route),
                  variant: "default",
                },
              ]
            : []
        }
      />
      {filters ? <View style={styles.filters}>{filters}</View> : null}
      <FlatList
        data={items}
        renderItem={renderListItem}
        keyExtractor={keyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching || (isInfiniteQuery(query) && query.isFetching && !query.isFetchingNextPage)}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          emptyState ? (
            <EmptyState
              title={emptyState.title}
              description={emptyState.description}
              icon={emptyState.icon}
            />
          ) : null
        }
        ListFooterComponent={
          isInfiniteQuery(query) && query.isFetchingNextPage ? (
            <View style={styles.footerSpinner}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.content}
      />
    </ThemedView>
  );
}

export function ListScreen<T>(props: ListScreenProps<T>) {
  if (props.privilege) {
    return (
      <PrivilegeGate required={props.privilege} fallback="unauthorized">
        <InnerListScreen {...props} />
      </PrivilegeGate>
    );
  }
  return <InnerListScreen {...props} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
    padding: spacing.md,
  },
  filters: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  content: {
    padding: spacing.md,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  footerSpinner: {
    paddingVertical: spacing.md,
  },
});
