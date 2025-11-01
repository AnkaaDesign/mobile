import { createContext, useContext, useState, ReactNode } from "react";
import { ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent,
  RefreshControl, ScrollView,
  TouchableOpacity, View } from "react-native";
import { Text } from "./text";
import type { SortConfig } from "@/lib/sort-utils";

interface TableCellProps {
  children?: ReactNode;
  className?: string;
}

export function TableCell({ children, className }: TableCellProps) {
  return (
    <View className={`flex flex-row items-center flex-1 px-2 h-10 ${className ?? ""}`}>
      <Text>{children}</Text>
    </View>
  );
}

interface TableRowProps {
  children?: ReactNode;
  className?: string;
  onPress?: () => void;
}

export function TableRow({ children, className, onPress }: TableRowProps) {
  return (
    <TouchableOpacity className={`flex-row items-center h-12 border-b border-border ${className ?? ""}`} onPress={onPress}>
      {children}
    </TouchableOpacity>
  );
}

interface TableBodyProps {
  children?: ReactNode;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  const ctx = useContext(TableContext);
  if (!ctx) {
    throw new Error("TableBody must be used within a <Table>.");
  }
  const { refreshing, handleRefresh, onEndReach, onEndReachedThreshold, loadingMore } = ctx;
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!onEndReach) return;
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = contentSize.height * (onEndReachedThreshold || 0.2);
    // Calculate position from the bottom
    const position = layoutMeasurement.height + contentOffset.y;
    // If we're close enough to the bottom, call onEndReach
    if (position >= contentSize.height - paddingToBottom) {
      onEndReach();
    }
  };
  return (
    <ScrollView
      className={`flex-1 ${className ?? ""}`}
      refreshControl={handleRefresh ? <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} /> : undefined}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <View>{children}</View>
      {loadingMore && (
        <View className="flex flex-row gap-2 items-center mx-auto h-12">
          <Text>Carregando...</Text>
          <ActivityIndicator size="small" />
        </View>
      )}
    </ScrollView>
  );
}
interface TableHeaderCellProps {
  children?: ReactNode;
  columnKey?: string;
  sortable?: boolean;
  className?: string;
}

export function TableHeaderCell({ children, className }: TableHeaderCellProps) {
  return (
    <View className={`flex-1 flex-row justify-between items-center bg-muted px-2 h-12 border-b-0 border-l-1 border-r-1 border-t-1 ${className ?? ""}`}>
      <Text className="font-semibold" numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}
interface TableHeaderProps {
  children?: ReactNode;
  className?: string;
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return <View className={`bg-muted border-b border-border ${className ?? ""}`}>{children}</View>;
}

interface TableContextValue {
  sortConfig: SortConfig | null;
  setSortConfig: (config: SortConfig | null) => void;
  handleSort: (columnKey: string) => void;
  refreshing: boolean;
  handleRefresh: () => Promise<void>;
  isLoading?: boolean;
  onEndReach?: () => void;
  onEndReachedThreshold?: number;
  loadingMore?: boolean;
}

const TableContext = createContext<TableContextValue | null>(null);

interface TableProps {
  className?: string;
  children?: ReactNode;
  onRefresh?: () => Promise<void>;
  onSort?: (sortConfig: SortConfig | null) => void;
  sortConfig?: SortConfig | null;
  refreshing?: boolean;
  isLoading?: boolean;
  onEndReach?: () => void;
  onEndReachedThreshold?: number;
  loadingMore?: boolean;
}

export function Table({
  className,
  children,
  onRefresh,
  onSort,
  sortConfig: externalSortConfig,
  refreshing: externalRefreshing,
  isLoading,
  onEndReach,
  onEndReachedThreshold = 0.2,
  loadingMore = false,
}: TableProps) {
  const [internalSortConfig, setInternalSortConfig] = useState<SortConfig | null>(null);
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const sortConfig = externalSortConfig ?? internalSortConfig;
  const refreshing = externalRefreshing ?? internalRefreshing;
  const handleRefresh = async () => {
    if (onRefresh) {
      if (!externalRefreshing) {
        setInternalRefreshing(true);
      }
      await onRefresh();
      if (!externalRefreshing) {
        setInternalRefreshing(false);
      }
    }
  };
  const handleSort = (columnKey: string) => {
    if (!onSort) return;
    const newDirection: "asc" | "desc" | null =
      sortConfig?.columnKey === columnKey ? (sortConfig.direction === "asc" ? "desc" : sortConfig.direction === "desc" ? null : "asc") : "asc";
    const newSortConfig = newDirection ? { columnKey, direction: newDirection } : null;
    if (!externalSortConfig) {
      setInternalSortConfig(newSortConfig);
    }
    onSort(newSortConfig);
  };
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <TableContext.Provider
      value={{
        sortConfig,
        setSortConfig: setInternalSortConfig,
        handleSort,
        refreshing,
        handleRefresh,
        isLoading,
        onEndReach,
        onEndReachedThreshold,
        loadingMore,
      }}
    >
      <View className={`flex-1 border border-border rounded-lg overflow-hidden ${className ?? ""}`}>{children}</View>
    </TableContext.Provider>
  );
}
