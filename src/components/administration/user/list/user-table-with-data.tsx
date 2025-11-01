import { useEffect, useMemo } from "react";
import { UserTable } from "./user-table";
import type { User } from '../../../../types';
import type { UserGetManyFormData } from '../../../../schemas';
import { useUsers } from '../../../../hooks';
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";

interface UserTableWithDataProps {
  visibleColumnKeys?: string[];
  filters?: Partial<UserGetManyFormData>;
  onDataChange?: (data: { users: User[]; totalRecords: number }) => void;
}

/**
 * UserTable wrapper that handles data fetching based on filters.
 * This component fetches users from the API and passes them to the base UserTable component.
 */
export function UserTableWithData({
  visibleColumnKeys,
  filters = {},
  onDataChange,
}: UserTableWithDataProps) {
  const { colors } = useTheme();

  // Memoize query parameters to prevent infinite re-renders
  const queryParams = useMemo(() => {
    return {
      ...filters,
      page: 1, // For now, we'll just show first page
      limit: 50, // Show up to 50 users
      include: {
        position: true,
        sector: true,
        managedSector: true,
      },
    };
  }, [filters]);

  // Fetch users with the query parameters
  const { data: response, isLoading, error } = useUsers(queryParams);

  const users = response?.data || [];
  const totalRecords = response?.meta?.totalRecords || 0;

  // Notify parent component of data changes
  useEffect(() => {
    if (onDataChange && !isLoading) {
      onDataChange({ users, totalRecords });
    }
  }, [users, totalRecords, onDataChange, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando usuários...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>Erro ao carregar usuários</ThemedText>
      </View>
    );
  }

  return (
    <UserTable
      users={users}
      visibleColumnKeys={visibleColumnKeys}
      loading={false}
      refreshing={false}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorText: {
    color: "red",
  },
});
