import { useMemo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { getUsers } from "@/api-client";
import type { User } from "@/types";

interface UserSelectorProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  disabled?: boolean;
  initialUser?: User;
  error?: string;
  label?: string;
  required?: boolean;
}

export function BorrowUserSelector({
  value,
  onValueChange,
  disabled,
  initialUser,
  error,
  label = "Usuário",
  required = true,
}: UserSelectorProps) {
  const { colors } = useTheme();

  // Memoize initialOptions with stable dependency
  const initialOptions = useMemo(() => {
    if (!initialUser) return [];

    return [{
      value: initialUser.id,
      label: initialUser.name,
      description: initialUser.position?.name,
      metadata: {
        email: initialUser.email,
        position: initialUser.position,
        sector: initialUser.position?.sector,
        status: initialUser.status,
      },
    }];
  }, [initialUser?.id]);

  // Async query function for Combobox with pagination
  const queryFn = useCallback(async (searchTerm: string, page: number = 1) => {
    const pageSize = 50;
    const response = await getUsers({
      take: pageSize,
      skip: (page - 1) * pageSize,
      where: {
        isActive: true,
        ...(searchTerm ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } },
            { cpf: { contains: searchTerm } },
          ],
        } : {}),
      },
      orderBy: { name: "asc" },
      include: {
        position: {
          include: {
            sector: true,
          },
        },
      },
    });

    const users = response.data || [];
    const total = users.length;
    const hasMore = (page * pageSize) < total;

    return {
      data: users.map((user) => ({
        value: user.id,
        label: user.name,
        description: user.position?.name,
        metadata: {
          email: user.email,
          position: user.position,
          sector: user.position?.sector,
          status: user.status,
        },
      })) as ComboboxOption[],
      hasMore,
      total,
    };
  }, []);

  // Custom render function for user options
  const renderUserOption = useCallback((option: ComboboxOption) => {
    const metadata = option.metadata;
    if (!metadata) {
      return (
        <View style={styles.optionContainer}>
          <ThemedText style={styles.optionLabel}>{option.label}</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.optionContainer}>
        <View style={styles.optionContent}>
          <ThemedText style={styles.optionLabel} numberOfLines={1}>
            {option.label}
          </ThemedText>
          {metadata.position && (
            <ThemedText style={[styles.optionDescription, { color: colors.mutedForeground }]} numberOfLines={1}>
              {metadata.position.name}
            </ThemedText>
          )}
        </View>
        {metadata.sector && (
          <Badge
            variant="outline"
            style={styles.sectorBadge}
          >
            <ThemedText style={[styles.sectorBadgeText, { color: colors.foreground }]}>
              {metadata.sector.name}
            </ThemedText>
          </Badge>
        )}
      </View>
    );
  }, [colors]);

  return (
    <View style={styles.container}>
      {label && (
        <Label>
          {label} {required && <ThemedText style={{ color: colors.destructive }}>*</ThemedText>}
        </Label>
      )}
      <Combobox
        async
        queryKey={["users", "borrow-selector"]}
        queryFn={queryFn}
        initialOptions={initialOptions}
        minSearchLength={0}
        pageSize={50}
        debounceMs={300}
        value={value || ""}
        onValueChange={(val) => onValueChange(Array.isArray(val) ? val[0] : val)}
        placeholder="Selecione um usuário"
        emptyText="Nenhum usuário encontrado"
        searchPlaceholder="Buscar por nome, e-mail ou CPF..."
        disabled={disabled}
        renderOption={renderUserOption}
        searchable
      />
      {error && (
        <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
          {error}
        </ThemedText>
      )}
      <ThemedText style={[styles.helpText, { color: colors.mutedForeground }]}>
        Selecione o colaborador que receberá o item emprestado
      </ThemedText>
    </View>
  );
}

// Export as UserSelector for compatibility
export { BorrowUserSelector as UserSelector };

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  optionContent: {
    flex: 1,
    gap: spacing.xs,
  },
  optionLabel: {
    fontSize: fontSize.base,
    fontWeight: "500",
  },
  optionDescription: {
    fontSize: fontSize.xs,
  },
  sectorBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sectorBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  helpText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
