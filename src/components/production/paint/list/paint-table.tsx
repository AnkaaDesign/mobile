
import { FlatList, Pressable } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { useTheme } from "@/lib/theme";

interface PaintTableProps {
  data?: any[];
  isLoading?: boolean;
  error?: any;
  onRefresh?: () => void;
  onItemPress?: (item: any) => void;
}

export function PaintTable({
  data = [],
  isLoading,
  error,
  onRefresh,
  onItemPress,
}: PaintTableProps) {
  const { spacing} = useTheme();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen title="Erro ao carregar" onRetry={onRefresh} />;
  }

  if (data.length === 0) {
    return <EmptyState title="Nenhum item encontrado" />;
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({  item  }) => (
        <Pressable onPress={() => onItemPress?.(item)}>
          <Card style={{ marginBottom: spacing.sm, padding: spacing.md }}>
            <ThemedText>{item.name || item.id}</ThemedText>
          </Card>
        </Pressable>
      )}
    />
  );
}