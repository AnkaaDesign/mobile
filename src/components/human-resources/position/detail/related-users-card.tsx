import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { IconUsers, IconChevronRight, IconSearch } from "@tabler/icons-react-native";
import type { Position, User } from '../../../../types';
import type { UserGetManyFormData } from '../../../../schemas';
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { UserTable } from "@/components/administration/user/list/user-table";
import { UserColumnVisibilityDrawer } from "@/components/administration/user/list/user-column-visibility-drawer";
import { Input } from "@/components/ui/input";
import { useColumnVisibility } from "@/hooks/use-column-visibility";

interface RelatedUsersCardProps {
  position: Position;
}

export function RelatedUsersCard({ position }: RelatedUsersCardProps) {
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState("");
  const [tableData, setTableData] = useState<{ users: User[]; totalRecords: number }>({
    users: [],
    totalRecords: 0
  });

  // Visible columns state with localStorage persistence
  const { visibleColumns, setVisibleColumns } = useColumnVisibility(
    "position-detail-users-visible-columns",
    new Set(["payrollNumber", "name", "email", "phone", "sector.name", "status"])
  );

  // Stable callback for table data updates
  const handleTableDataChange = useCallback((data: { users: User[]; totalRecords: number }) => {
    setTableData(data);
  }, []);

  // Filter to only show users from this position with search
  const filters: Partial<UserGetManyFormData> = useMemo(() => {
    return {
      where: {
        positionId: position.id,
      },
      searchingFor: searchText.trim() || undefined,
    };
  }, [position.id, searchText]);

  const handleViewAll = () => {
    router.push(routeToMobilePath(`${routes.administration.collaborators.root}?positions=${position.id}`) as any);
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconUsers size={20} color={colors.primary} />
        <ThemedText style={[styles.title, { color: colors.foreground }]}>
          Funcionários com este Cargo
        </ThemedText>
      </View>

      <View style={styles.content}>
        {/* Search and controls */}
        <View style={styles.controls}>
          <View style={[styles.searchContainer, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <IconSearch size={18} color={colors.mutedForeground} />
            <Input
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar por nome, email, CPF, PIS..."
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          <View style={styles.actionButtons}>
            <UserColumnVisibilityDrawer
              visibleColumns={visibleColumns}
              onVisibilityChange={setVisibleColumns}
            />

            <TouchableOpacity
              onPress={handleViewAll}
              style={[styles.viewAllButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.viewAllText, { color: colors.foreground }]}>
                Ver todos
              </ThemedText>
              <IconChevronRight size={16} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* User table */}
        <View style={styles.tableContainer}>
          <UserTable
            visibleColumns={visibleColumns}
            filters={filters}
            onDataChange={handleTableDataChange}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  controls: {
    gap: spacing.sm,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    padding: 0,
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  tableContainer: {
    minHeight: 400,
    maxHeight: 600,
  },
});
