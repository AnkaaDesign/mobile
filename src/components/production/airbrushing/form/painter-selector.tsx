import { useMemo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, USER_STATUS } from "@/constants";
import { getUsers } from "@/api-client";
import type { User } from "@/types";

interface PainterSelectorProps {
  value?: string | null;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
  initialPainter?: User | null;
  error?: string;
  label?: string;
  required?: boolean;
}

/**
 * Selector for airbrushing painters (third-party workers).
 *
 * Painters are users whose sector has the AIRBRUSHING privilege.
 * IMPORTANT: dismissed/inactive users are intentionally NOT excluded —
 * painters are usually ex-employees (DISMISSED) kept as third-party workers.
 */
export function PainterSelector({
  value,
  onValueChange,
  disabled,
  initialPainter,
  error,
  label = "Pintor",
  required = false,
}: PainterSelectorProps) {
  const { colors } = useTheme();

  // Memoize initialOptions with stable dependency
  const initialOptions = useMemo(() => {
    if (!initialPainter) return [];

    return [
      {
        value: initialPainter.id,
        label: initialPainter.name,
        description: initialPainter.position?.name,
        metadata: {
          email: initialPainter.email,
          position: initialPainter.position,
          sector: initialPainter.sector,
          status: initialPainter.status,
        },
      },
    ];
  }, [initialPainter?.id]);

  // Async query function for Combobox with pagination.
  // Filters users to sectors with the AIRBRUSHING privilege.
  // NO status/isActive filter — dismissed third-party painters must appear.
  const queryFn = useCallback(async (searchTerm: string, page: number = 1) => {
    const pageSize = 20;
    const response = await getUsers({
      take: pageSize,
      skip: (page - 1) * pageSize,
      where: {
        sector: { is: { privileges: SECTOR_PRIVILEGES.AIRBRUSHING } },
        ...(searchTerm
          ? {
              OR: [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { email: { contains: searchTerm, mode: "insensitive" } },
                { cpf: { contains: searchTerm } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      include: {
        position: true,
        sector: true,
      },
    });

    const users = response.data || [];
    const total = response.meta?.totalRecords ?? users.length;
    const hasMore = response.meta?.hasNextPage ?? page * pageSize < total;

    return {
      data: users.map((user) => ({
        value: user.id,
        label: user.name,
        description: user.position?.name,
        metadata: {
          email: user.email,
          position: user.position,
          sector: user.sector,
          status: user.status,
        },
      })) as ComboboxOption[],
      hasMore,
      total,
    };
  }, []);

  // Custom render function for painter options
  const renderPainterOption = useCallback(
    (option: ComboboxOption) => {
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
          {metadata.status === USER_STATUS.DISMISSED && (
            <Badge variant="outline" style={styles.sectorBadge}>
              <ThemedText style={[styles.sectorBadgeText, { color: colors.destructive }]}>Desligado</ThemedText>
            </Badge>
          )}
          {metadata.sector && (
            <Badge variant="outline" style={styles.sectorBadge}>
              <ThemedText style={[styles.sectorBadgeText, { color: colors.foreground }]}>{metadata.sector.name}</ThemedText>
            </Badge>
          )}
        </View>
      );
    },
    [colors],
  );

  return (
    <View style={styles.container}>
      {label && (
        <Label>
          {label} {required && <ThemedText style={{ color: colors.destructive }}>*</ThemedText>}
        </Label>
      )}
      <Combobox
        async
        queryKey={["users", "airbrushing-painter-selector"]}
        queryFn={queryFn}
        initialOptions={initialOptions}
        minSearchLength={0}
        pageSize={20}
        debounceMs={500}
        loadOnMount={false}
        value={value || ""}
        onValueChange={(val) => {
          const single = Array.isArray(val) ? val[0] : val;
          onValueChange(single || null);
        }}
        placeholder="Selecione um pintor"
        emptyText="Nenhum pintor encontrado"
        searchPlaceholder="Buscar por nome, e-mail ou CPF..."
        disabled={disabled}
        renderOption={renderPainterOption}
        searchable
        clearable
      />
      {error && <ThemedText style={[styles.errorText, { color: colors.destructive }]}>{error}</ThemedText>}
    </View>
  );
}

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
});
