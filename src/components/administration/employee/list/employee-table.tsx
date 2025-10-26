import React, { useState, useCallback, useMemo, useRef } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconSelector } from "@tabler/icons-react-native";
import type { User } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { EmployeeTableRowSwipe } from "./employee-table-row-swipe";
import { formatCPF, formatBrazilianPhone, formatDate, formatDateTime } from '../../../../utils';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";
import { USER_STATUS_LABELS } from '../../../../constants';
import { USER_STATUS } from '../../../../constants';
import { getUserStatusBadgeText } from '../../../../utils/user';
import type { SortConfig } from "@/lib/sort-utils";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (employee: User) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}


interface EmployeeTableProps {
  employees: User[];
  onEmployeePress?: (employeeId: string) => void;
  onEmployeeEdit?: (employeeId: string) => void;
  onEmployeeDelete?: (employeeId: string) => void;
  onEmployeeView?: (employeeId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedEmployees?: Set<string>;
  onSelectionChange?: (selectedEmployees: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Status badge color helper
const getStatusBadgeColors = (status: USER_STATUS) => {
  switch (status) {
    case USER_STATUS.CONTRACTED:
      return { background: badgeColors.success.background, text: badgeColors.success.text }; // green-700
    case USER_STATUS.EXPERIENCE_PERIOD_1:
      return { background: badgeColors.pending.background, text: badgeColors.pending.text }; // amber-600
    case USER_STATUS.EXPERIENCE_PERIOD_2:
      return { background: badgeColors.warning.background, text: badgeColors.warning.text }; // orange-600
    case USER_STATUS.DISMISSED:
      return { background: badgeColors.error.background, text: badgeColors.error.text }; // red-700 NOT gray
    default:
      return { background: badgeColors.info.background, text: badgeColors.info.text };
  }
};

// Define all available columns with their renderers
export const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "avatar",
    header: "",
    align: "center",
    sortable: false,
    width: 0,
    accessor: (employee: User) => (
      <View style={styles.avatarContainer}>
        <Avatar size="sm">
          <ThemedText style={{ fontSize: 12, fontWeight: '600' }}>
            {employee.name.charAt(0).toUpperCase()}
          </ThemedText>
        </Avatar>
      </View>
    ),
  },
  {
    key: "payrollNumber",
    header: "Nº Folha",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {employee.payrollNumber || "-"}
      </ThemedText>
    ),
  },
  {
    key: "name",
    header: "Nome",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.nameText])} numberOfLines={1} ellipsizeMode="tail">
        {employee.name}
      </ThemedText>
    ),
  },
  {
    key: "email",
    header: "Email",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {employee.email}
      </ThemedText>
    ),
  },
  {
    key: "phone",
    header: "Telefone",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {employee.phone ? formatBrazilianPhone(employee.phone) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "cpf",
    header: "CPF",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.monoText])} numberOfLines={1}>
        {employee.cpf ? formatCPF(employee.cpf) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "pis",
    header: "PIS",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.monoText])} numberOfLines={1}>
        {employee.pis || "-"}
      </ThemedText>
    ),
  },
  {
    key: "position.hierarchy",
    header: "Cargo",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <View style={styles.badgeContainer}>
        {employee.position ? (
          <Badge variant="secondary" size="sm" style={StyleSheet.flatten([styles.positionBadge, { backgroundColor: badgeColors.info.background }])}>
            <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: badgeColors.info.text }])}>{employee.position.name}</ThemedText>
          </Badge>
        ) : (
          <ThemedText style={styles.cellText}>-</ThemedText>
        )}
      </View>
    ),
  },
  {
    key: "sector.name",
    header: "Setor",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {employee.sector?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "tasksCount",
    header: "Tarefas",
    align: "center",
    sortable: false,
    width: 0,
    accessor: (employee: User) => (
      <View style={styles.centerAlign}>
        <Badge variant="secondary" size="sm" style={{ backgroundColor: badgeColors.info.background, borderWidth: 0 }}>
          <ThemedText style={{ color: badgeColors.info.text, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
            {employee._count?.createdTasks || 0}
          </ThemedText>
        </Badge>
      </View>
    ),
  },
  {
    key: "vacationsCount",
    header: "Férias",
    align: "center",
    sortable: false,
    width: 0,
    accessor: (employee: User) => (
      <View style={styles.centerAlign}>
        <Badge variant="secondary" size="sm" style={{ backgroundColor: badgeColors.success.background, borderWidth: 0 }}>
          <ThemedText style={{ color: badgeColors.success.text, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
            {employee._count?.vacations || 0}
          </ThemedText>
        </Badge>
      </View>
    ),
  },
  {
    key: "contractedAt",
    header: "Data de Contratação",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {employee.contractedAt ? formatDate(new Date(employee.contractedAt)) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "birth",
    header: "Data de Nascimento",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {employee.birth ? formatDate(new Date(employee.birth)) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "dismissedAt",
    header: "Data de Demissão",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {employee.dismissedAt ? formatDate(new Date(employee.dismissedAt)) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "status",
    header: "Status",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => {
      const statusColors = getStatusBadgeColors(employee.status);
      return (
        <Badge variant="secondary" size="sm" style={{ backgroundColor: statusColors.background, borderWidth: 0 }}>
          <ThemedText style={{ color: statusColors.text, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
            {getUserStatusBadgeText(employee)}
          </ThemedText>
        </Badge>
      );
    },
  },
  {
    key: "performanceLevel",
    header: "Nível de Performance",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <View style={styles.centerAlign}>
        <Badge variant="secondary" size="sm" style={{ backgroundColor: badgeColors.warning.background, borderWidth: 0 }}>
          <ThemedText style={{ color: badgeColors.warning.text, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
            {employee.performanceLevel || 0}
          </ThemedText>
        </Badge>
      </View>
    ),
  },
  {
    key: "verified",
    header: "Verificado",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <View style={styles.centerAlign}>
        {employee.verified ? (
          <Badge variant="secondary" size="sm" style={{ backgroundColor: badgeColors.success.background, borderWidth: 0 }}>
            <ThemedText style={{ color: badgeColors.success.text, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>Sim</ThemedText>
          </Badge>
        ) : (
          <Badge variant="secondary" size="sm" style={{ backgroundColor: badgeColors.muted.background, borderWidth: 0 }}>
            <ThemedText style={{ color: badgeColors.muted.text, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>Não</ThemedText>
          </Badge>
        )}
      </View>
    ),
  },
  {
    key: "lastLoginAt",
    header: "Último Login",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {employee.lastLoginAt ? formatDateTime(new Date(employee.lastLoginAt)) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "managedSector.name",
    header: "Setor Gerenciado",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {employee.managedSector?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "city",
    header: "Cidade",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {employee.city || "-"}
      </ThemedText>
    ),
  },
  {
    key: "state",
    header: "Estado",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {employee.state || "-"}
      </ThemedText>
    ),
  },
  {
    key: "zipCode",
    header: "CEP",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {employee.zipCode || "-"}
      </ThemedText>
    ),
  },
  {
    key: "address",
    header: "Endereço",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">
        {employee.address
          ? `${employee.address}${employee.addressNumber ? `, ${employee.addressNumber}` : ""}${employee.addressComplement ? ` - ${employee.addressComplement}` : ""}`
          : "-"}
      </ThemedText>
    ),
  },
  {
    key: "neighborhood",
    header: "Bairro",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {employee.neighborhood || "-"}
      </ThemedText>
    ),
  },
  {
    key: "requirePasswordChange",
    header: "Requer Alteração de Senha",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <View style={styles.centerAlign}>
        {employee.requirePasswordChange ? (
          <Badge variant="secondary" size="sm" style={{ backgroundColor: badgeColors.error.background, borderWidth: 0 }}>
            <ThemedText style={{ color: badgeColors.error.text, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>Sim</ThemedText>
          </Badge>
        ) : (
          <Badge variant="secondary" size="sm" style={{ backgroundColor: badgeColors.muted.background, borderWidth: 0 }}>
            <ThemedText style={{ color: badgeColors.muted.text, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>Não</ThemedText>
          </Badge>
        )}
      </View>
    ),
  },
  {
    key: "createdAt",
    header: "Data de Criação",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {employee.createdAt ? formatDateTime(new Date(employee.createdAt)) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "updatedAt",
    header: "Última Atualização",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (employee: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {employee.updatedAt ? formatDateTime(new Date(employee.updatedAt)) : "-"}
      </ThemedText>
    ),
  },
];

// Alias for backward compatibility with list page import
export const createEmployeeColumnDefinitions = createColumnDefinitions;

// Function to get default visible columns for employees
export function getDefaultVisibleColumns(): Set<string> {
  return new Set([
    "name",
    "sector.name",
    "status"
  ]);
}

export const EmployeeTable = React.memo<EmployeeTableProps>(
  ({
    employees,
    onEmployeePress,
    onEmployeeEdit,
    onEmployeeDelete,
    onEmployeeView,
    onRefresh,
    onEndReached,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedEmployees = new Set(),
    onSelectionChange,
    sortConfigs = [],
    onSort,
    visibleColumnKeys = ["name", "sector.name", "status"],
    enableSwipeActions = true,
  }) => {
    const { colors, isDark } = useTheme();
    const { activeRowId, closeActiveRow } = useSwipeRow();
    const [headerHeight, setHeaderHeight] = useState(50);
    const flatListRef = useRef<FlatList>(null);

    // Get all column definitions
    const allColumns = useMemo(() => createColumnDefinitions(), []);

    // Build visible columns with dynamic widths
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        avatar: 0.6,
        payrollNumber: 1.0,
        name: 2.0,
        email: 1.8,
        phone: 1.3,
        cpf: 1.3,
        pis: 1.3,
        "position.hierarchy": 1.5,
        "sector.name": 1.7,
        tasksCount: 1.0,
        vacationsCount: 1.0,
        admissional: 1.4,
        birth: 1.4,
        dismissedAt: 1.4,
        status: 1.5,
        performanceLevel: 1.5,
        verified: 1.1,
        lastLoginAt: 1.6,
        "managedSector.name": 1.5,
        city: 1.3,
        state: 1.0,
        zipCode: 1.1,
        address: 2.0,
        neighborhood: 1.3,
        requirePasswordChange: 2.0,
        createdAt: 1.6,
        updatedAt: 1.6,
      };

      // Convert to Set for efficient lookup
      const visibleColumnsSet = new Set(visibleColumnKeys);

      // Filter to visible columns
      const visible = allColumns.filter((col) => visibleColumnsSet.has(col.key));

      // Calculate total ratio
      const totalRatio = visible.reduce((sum, col) => sum + (columnWidthRatios[col.key] || 1.0), 0);

      // Calculate actual widths
      return visible.map((col) => {
        const ratio = columnWidthRatios[col.key] || 1.0;
        const width = Math.floor((availableWidth * ratio) / totalRatio);
        return { ...col, width };
      });
    }, [allColumns, visibleColumnKeys]);

    // Handle taps outside of active row to close swipe actions
    const handleContainerPress = useCallback(() => {
      if (activeRowId) {
        closeActiveRow();
      }
    }, [activeRowId, closeActiveRow]);

    // Handle scroll events to close active row
    const handleScroll = useCallback(() => {
      if (activeRowId) {
        closeActiveRow();
      }
    }, [activeRowId, closeActiveRow]);

    // Calculate total table width
    const tableWidth = useMemo(() => {
      let width = displayColumns.reduce((sum, col) => sum + col.width, 0);
      if (showSelection) width += 50; // Add checkbox column width
      return width;
    }, [displayColumns, showSelection]);

    // Selection handlers
    const handleSelectAll = useCallback(() => {
      if (!onSelectionChange) return;

      const allSelected = employees.every((employee) => selectedEmployees.has(employee.id));
      if (allSelected) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(employees.map((employee) => employee.id)));
      }
    }, [employees, selectedEmployees, onSelectionChange]);

    const handleSelectEmployee = useCallback(
      (employeeId: string) => {
        if (!onSelectionChange) return;

        const newSelection = new Set(selectedEmployees);
        if (newSelection.has(employeeId)) {
          newSelection.delete(employeeId);
        } else {
          newSelection.add(employeeId);
        }
        onSelectionChange(newSelection);
      },
      [selectedEmployees, onSelectionChange],
    );

    // Sort handler - non-cumulative (only one sort at a time)
    const handleSort = useCallback(
      (columnKey: string) => {
        if (!onSort) return;

        const existingConfig = sortConfigs?.find((config) => config.columnKey === columnKey);

        if (existingConfig) {
          // Column already sorted, toggle direction or remove
          if (existingConfig.direction === "asc") {
            // Toggle to descending
            onSort([{ columnKey, direction: "desc" as const }]);
          } else {
            // Remove sort (back to no sort)
            onSort([]);
          }
        } else {
          // Set new sort (replacing any existing sort)
          onSort([{ columnKey, direction: "asc" as const }]);
        }
      },
      [sortConfigs, onSort],
    );

    // Column renderer using accessor
    const renderColumnValue = useCallback((employee: User, column: TableColumn) => {
      return column.accessor(employee);
    }, []);

    // Header component
    const renderHeader = useCallback(
      () => (
        <View style={styles.headerWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={tableWidth > availableWidth}
            style={StyleSheet.flatten([
              styles.headerContainer,
              {
                backgroundColor: isDark ? extendedColors.neutral[800] : extendedColors.neutral[100],
                borderBottomColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
              },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
          >
            <View style={StyleSheet.flatten([styles.headerRow, { width: tableWidth }])}>
              {showSelection && (
                <View style={StyleSheet.flatten([styles.headerCell, styles.checkboxCell])}>
                  <Checkbox checked={employees.length > 0 && employees.every((employee) => selectedEmployees.has(employee.id))} onCheckedChange={handleSelectAll} disabled={employees.length === 0} />
                </View>
              )}
              {displayColumns.map((column) => {
                const sortConfig = sortConfigs?.find((config) => config.columnKey === column.key);

                return (
                  <TouchableOpacity
                    key={column.key}
                    style={StyleSheet.flatten([styles.headerCell, { width: column.width }])}
                    onPress={() => column.sortable && handleSort(column.key)}
                    disabled={!column.sortable}
                    activeOpacity={column.sortable ? 0.7 : 1}
                  >
                    <View style={styles.headerCellContent}>
                      <View style={styles.headerTextContainer}>
                        <ThemedText
                          style={StyleSheet.flatten([styles.headerText, { color: isDark ? extendedColors.neutral[200] : "#000000" }])}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {column.header}
                        </ThemedText>
                      </View>
                      {column.sortable && (
                        <View style={styles.sortIconWrapper}>
                          {sortConfig ? (
                            <View style={styles.sortIconContainer}>
                              {sortConfig.direction === "asc" ? (
                                <Icon name="chevron-up" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                              ) : (
                                <Icon name="chevron-down" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                              )}
                            </View>
                          ) : (
                            <IconSelector size={16} color={isDark ? extendedColors.neutral[400] : extendedColors.neutral[600]} />
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ),
      [colors, isDark, tableWidth, displayColumns, showSelection, selectedEmployees, employees.length, sortConfigs, handleSelectAll, handleSort],
    );

    // Row component
    const renderRow = useCallback(
      ({ item: employee, index }: { item: User; index: number }) => {
        const isSelected = selectedEmployees.has(employee.id);
        const isEven = index % 2 === 0;

        if (enableSwipeActions && (onEmployeeEdit || onEmployeeDelete || onEmployeeView)) {
          return (
            <EmployeeTableRowSwipe key={employee.id} employeeId={employee.id} employeeName={employee.name} onEdit={onEmployeeEdit} onDelete={onEmployeeDelete} onView={onEmployeeView} disabled={showSelection}>
              {(isActive) => (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={tableWidth > availableWidth}
                  style={StyleSheet.flatten([
                    styles.row,
                    {
                      backgroundColor: isEven ? colors.background : isDark ? extendedColors.neutral[900] : extendedColors.neutral[50],
                      borderBottomColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
                    },
                    isSelected && { backgroundColor: colors.primary + "20" },
                  ])}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  <Pressable
                    style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
                    onPress={() => onEmployeePress?.(employee.id)}
                    onLongPress={() => showSelection && handleSelectEmployee(employee.id)}
                    android_ripple={{ color: colors.primary + "20" }}
                  >
                    {showSelection && (
                      <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                        <Checkbox checked={isSelected} onCheckedChange={() => handleSelectEmployee(employee.id)} />
                      </View>
                    )}
                    {displayColumns.map((column) => (
                      <View key={column.key} style={StyleSheet.flatten([styles.cell, { width: column.width }, column.align === "center" && styles.centerAlign, column.align === "right" && styles.rightAlign])}>
                        {renderColumnValue(employee, column)}
                      </View>
                    ))}
                  </Pressable>
                </ScrollView>
              )}
            </EmployeeTableRowSwipe>
          );
        }

        // Non-swipeable version
        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={tableWidth > availableWidth}
            style={StyleSheet.flatten([
              styles.row,
              {
                backgroundColor: isEven ? colors.background : isDark ? extendedColors.neutral[900] : extendedColors.neutral[50],
                borderBottomColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
              },
              isSelected && { backgroundColor: colors.primary + "20" },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <Pressable
              style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
              onPress={() => onEmployeePress?.(employee.id)}
              onLongPress={() => showSelection && handleSelectEmployee(employee.id)}
              android_ripple={{ color: colors.primary + "20" }}
            >
              {showSelection && (
                <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                  <Checkbox checked={isSelected} onCheckedChange={() => handleSelectEmployee(employee.id)} />
                </View>
              )}
              {displayColumns.map((column) => (
                <View key={column.key} style={StyleSheet.flatten([styles.cell, { width: column.width }, column.align === "center" && styles.centerAlign, column.align === "right" && styles.rightAlign])}>
                  {renderColumnValue(employee, column)}
                </View>
              ))}
            </Pressable>
          </ScrollView>
        );
      },
      [colors, tableWidth, displayColumns, showSelection, selectedEmployees, onEmployeePress, handleSelectEmployee, renderColumnValue, enableSwipeActions, onEmployeeEdit, onEmployeeDelete, onEmployeeView, activeRowId, closeActiveRow, isDark],
    );

    // Loading footer component
    const renderFooter = useCallback(() => {
      if (!loadingMore) return null;

      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando mais...</ThemedText>
        </View>
      );
    }, [loadingMore, colors.primary]);

    // Empty state component
    const renderEmpty = useCallback(
      () => (
        <View style={styles.emptyContainer}>
          <Icon name="users-group" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhum colaborador encontrado</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou adicionar novos colaboradores</ThemedText>
        </View>
      ),
      [colors.mutedForeground],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando colaboradores...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            ref={flatListRef}
            data={employees}
            renderItem={renderRow}
            keyExtractor={(employee) => employee.id}
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.2}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={15}
            updateCellsBatchingPeriod={50}
            getItemLayout={(data, index) => ({
              length: 50,
              offset: 50 * index,
              index,
            })}
            style={styles.flatList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </Pressable>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 16,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerWrapper: {
    flexDirection: "column",
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
  },
  headerCell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    minHeight: 40,
    justifyContent: "center",
  },
  headerText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    lineHeight: 12,
    color: "#000000",
  },
  headerCellContent: {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 4,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0, // Allow text to shrink below content size
  },
  sortIconWrapper: {
    flexShrink: 0, // Prevent icon from shrinking
    justifyContent: "center",
    alignItems: "center",
    width: 16,
  },
  sortIndicator: {
    marginLeft: 4,
  },
  sortIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortOrder: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    marginLeft: 2,
  },
  checkboxCell: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  flatList: {
    flex: 1,
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 36,
  },
  cell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
    justifyContent: "center",
    minHeight: 36,
  },
  centerAlign: {
    alignItems: "center",
  },
  rightAlign: {
    alignItems: "flex-end",
  },
  cellText: {
    fontSize: fontSize.xs,
  },
  monoText: {
    fontFamily: "monospace",
    fontSize: fontSize.xs,
  },
  nameText: {
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs,
  },
  avatarContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  badgeContainer: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  badgeContainerFull: {
    justifyContent: "center",
    alignItems: "stretch",
    width: "100%",
  },
  centerAlignFull: {
    alignItems: "center",
    width: "100%",
  },
  positionBadge: {
    borderWidth: 0,
  },
  sectorBadge: {
    borderWidth: 1,
  },
  sectorBadgeFull: {
    borderWidth: 1,
    width: "100%",
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    flexShrink: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});

EmployeeTable.displayName = "EmployeeTable";
