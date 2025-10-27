import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  IconBrush,
  IconSearch,
  IconColumns3,
  IconExternalLink,
  IconAlertCircle,
} from "@tabler/icons-react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/themed-text";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TaskTable } from "@/components/production/task/list/task-table";
import { useTheme } from "@/components/theme-provider";
import { borderRadius, fontSize, fontWeight, spacing } from "@/lib/constants";
import { useDebounce } from "@/hooks/useDebounce";
import { useTasks } from "@/hooks/useTask";
import { Task } from "@/types/task";
import { Paint } from "@/types/paint";
import { ColumnVisibilityDrawerV2 } from "@/components/ui/table-column-visibility-drawer-v2";
import { Button } from "@/components/ui/button";

interface PaintTasksCardProps {
  paint: Paint;
  maxHeight?: number;
}

const defaultVisibleColumns = [
  "name",
  "customer.fantasyName",
  "status",
  "finishedAt",
  "createdBy.name",
];

const allColumns = [
  { key: "name", label: "Tarefa" },
  { key: "customer.fantasyName", label: "Cliente" },
  { key: "sector.name", label: "Setor" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Prioridade" },
  { key: "entryDate", label: "Entrada" },
  { key: "startedAt", label: "Início" },
  { key: "finishedAt", label: "Conclusão" },
  { key: "term", label: "Prazo" },
  { key: "serialNumber", label: "Número Série" },
  { key: "plate", label: "Placa" },
  { key: "chassisNumber", label: "Chassi" },
  { key: "price", label: "Preço" },
  { key: "createdBy.name", label: "Criado por" },
  { key: "observation", label: "Observação" },
];

export function PaintTasksCard({ paint, maxHeight = 500 }: PaintTasksCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(defaultVisibleColumns);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Build query filters for tasks related to this paint
  const queryParams = useMemo(() => {
    return {
      where: {
        OR: [
          { paintId: paint.id },
          { logoPaints: { some: { id: paint.id } } },
        ],
      },
      include: {
        customer: true,
        sector: true,
        generalPainting: {
          include: {
            paintType: true,
            paintBrand: true,
          },
        },
        createdBy: true,
        updatedBy: true,
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { createdAt: "desc" as const },
      search: debouncedSearch,
      page: 1,
      limit: 50,
    };
  }, [paint.id, debouncedSearch]);

  const { data: tasksResponse, isLoading, error, refetch } = useTasks(queryParams);
  const tasks = tasksResponse?.data || [];

  const handleTaskPress = useCallback((task: Task) => {
    router.push(`/(tabs)/production/tasks/details/${task.id}`);
  }, [router]);

  const handleViewAll = useCallback(() => {
    router.push({
      pathname: "/(tabs)/production/tasks/list",
      params: { paintId: paint.id },
    });
  }, [router, paint.id]);

  const handleColumnsChange = useCallback((columns: Set<string>) => {
    setVisibleColumnKeys(Array.from(columns));
    setShowColumnManager(false);
  }, []);

  // Empty state (no tasks at all)
  if (!isLoading && tasks.length === 0 && !searchQuery) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconBrush size={20} color={colors.mutedForeground} />
            <ThemedText style={[styles.title, { color: colors.foreground }]}>
              Tarefas Relacionadas
            </ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={[styles.emptyState, { backgroundColor: colors.muted + "20" }]}>
            <IconBrush size={48} color={colors.mutedForeground} />
            <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nenhuma tarefa utiliza esta tinta
            </ThemedText>
            <ThemedText style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              As tarefas que utilizarem esta tinta aparecerão aqui
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  // Loading state
  if (isLoading && !tasks.length) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconBrush size={20} color={colors.mutedForeground} />
            <ThemedText style={[styles.title, { color: colors.foreground }]}>
              Tarefas Relacionadas
            </ThemedText>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Carregando tarefas...
          </ThemedText>
        </View>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconBrush size={20} color={colors.mutedForeground} />
            <ThemedText style={[styles.title, { color: colors.foreground }]}>
              Tarefas Relacionadas
            </ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={[styles.errorState, { backgroundColor: colors.destructive + "10" }]}>
            <IconAlertCircle size={32} color={colors.destructive} />
            <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
              Erro ao carregar tarefas
            </ThemedText>
            <Button onPress={() => refetch()} variant="destructive">
              <ThemedText style={{ color: colors.destructiveForeground }}>
                Tentar Novamente
              </ThemedText>
            </Button>
          </View>
        </View>
      </Card>
    );
  }

  // No results with search
  if (tasks.length === 0 && searchQuery) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconBrush size={20} color={colors.mutedForeground} />
            <ThemedText style={[styles.title, { color: colors.foreground }]}>
              Tarefas Relacionadas
            </ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.controlsContainer}>
            <View style={[styles.searchContainer, { backgroundColor: colors.muted }]}>
              <IconSearch size={18} color={colors.mutedForeground} />
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar tarefas..."
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>
          <View style={[styles.emptyState, { backgroundColor: colors.muted + "20" }]}>
            <IconSearch size={32} color={colors.mutedForeground} />
            <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nenhuma tarefa encontrada
            </ThemedText>
            <ThemedText style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              Tente ajustar sua busca
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  // Loaded state with data
  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconBrush size={20} color={colors.primary} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Tarefas Relacionadas
            {tasks.length > 0 && (
              <ThemedText style={[styles.count, { color: colors.mutedForeground }]}>
                {" "}({tasks.length})
              </ThemedText>
            )}
          </ThemedText>
        </View>
        <TouchableOpacity onPress={handleViewAll} style={styles.viewAllButton}>
          <ThemedText style={[styles.viewAllText, { color: colors.primary }]}>
            Ver Todas
          </ThemedText>
          <IconExternalLink size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search + Controls */}
        <View style={styles.controlsContainer}>
          <View style={[styles.searchContainer, { backgroundColor: colors.muted }]}>
            <IconSearch size={18} color={colors.mutedForeground} />
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar tarefas..."
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowColumnManager(true)}
            style={[styles.columnButton, { backgroundColor: colors.muted }]}
          >
            <IconColumns3 size={18} color={colors.foreground} />
            {visibleColumnKeys.length > 0 && (
              <Badge variant="secondary" style={styles.badge}>
                <ThemedText style={styles.badgeText}>
                  {visibleColumnKeys.length}
                </ThemedText>
              </Badge>
            )}
          </TouchableOpacity>
        </View>

        {/* Table Container with Max Height */}
        <View style={[styles.tableContainer, { maxHeight }]}>
          <TaskTable
            tasks={tasks}
            onTaskPress={handleTaskPress}
            visibleColumnKeys={visibleColumnKeys}
            isLoading={isLoading}
          />
        </View>
      </View>

      {/* Column Visibility Drawer */}
      <ColumnVisibilityDrawerV2
        columns={allColumns}
        visibleColumns={new Set(visibleColumnKeys)}
        onVisibilityChange={handleColumnsChange}
        open={showColumnManager}
        onClose={() => setShowColumnManager(false)}
        title="Colunas Visíveis"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium as any,
  },
  count: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal as any,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium as any,
  },
  content: {
    gap: spacing.md,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    paddingVertical: spacing.xs,
  },
  columnButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold as any,
  },
  tableContainer: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
  emptyState: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium as any,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  errorState: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium as any,
  },
});