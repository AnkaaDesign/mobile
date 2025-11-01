
import { FlatList, Pressable } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { useTheme } from "@/lib/theme";

interface AirbrushingTableProps {
  airbrushings: any[];
  isLoading: boolean;
  error: Error | null;
  onAirbrushingPress: (airbrushingId: string) => void;
  onDelete?: (airbrushingId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  onEndReach: () => void;
  canLoadMore: boolean;
  loadingMore: boolean;
}

export function AirbrushingTable({
  airbrushings,
  isLoading,
  error,
  onAirbrushingPress,
  // onDelete removed
  onRefresh,
  refreshing,
  onEndReach,
  // canLoadMore removed
  // loadingMore removed
}: AirbrushingTableProps) {
  const { spacing} = useTheme();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen title="Erro ao carregar" onRetry={onRefresh} />;
  }

  if (airbrushings.length === 0) {
    return <EmptyState title="Nenhum item encontrado" />;
  }

  return (
    <FlatList
      data={airbrushings}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable onPress={() => onAirbrushingPress(item.id)}>
          <Card style={{ marginBottom: spacing.sm, padding: spacing.md }}>
            <ThemedText>{item.name || item.id}</ThemedText>
          </Card>
        </Pressable>
      )}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReach}
      onEndReachedThreshold={0.1}
    />
  );
}