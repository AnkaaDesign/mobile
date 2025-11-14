import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, TextInput as RNTextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronDown, IconChevronRight, IconX, IconFilter } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Drawer } from "@/components/ui/drawer";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { CustomerLogoDisplay } from "@/components/ui/customer-logo-display";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSectors, useCustomers, useUsers } from "@/hooks";
import {_LABELS } from "@/constants";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

interface TaskFilterDrawerV3Props {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  currentFilters: any;
}

interface FilterSection {
  id: string;
  title: string;
  defaultOpen?: boolean;
}

const filterSections: FilterSection[] = [
  { id: "status", title: "Status", defaultOpen: true },
  { id: "entities", title: "Entidades", defaultOpen: true },
  { id: "dates", title: "Datas", defaultOpen: false },
  { id: "characteristics", title: "Características", defaultOpen: false },
  { id: "values", title: "Valores", defaultOpen: false },
];

export function TaskFilterDrawerV3({
  visible,
  onClose,
  onApply,
  currentFilters,
}: TaskFilterDrawerV3Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Load entity data
  const { data: sectorsData } = useSectors({ orderBy: { name: "asc" } });
  const { data: customersData } = useCustomers({ orderBy: { fantasyName: "asc" }, include: { logo: true } });
  const { data: usersData } = useUsers({ orderBy: { name: "asc" } });

  const sectors = sectorsData?.data || [];
  const customers = customersData?.data || [];
  const users = usersData?.data || [];

  // Local state for form
  const [localFilters, setLocalFilters] = useState<any>(currentFilters);
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(filterSections.filter((s) => s.defaultOpen).map((s) => s.id))
  );
  const [entityTab, setEntityTab] = useState<"sectors" | "customers" | "assignees">("sectors");

  // Price range state
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");

  // Sync local state with props
  useEffect(() => {
    setLocalFilters(currentFilters);
    setPriceMin(currentFilters.priceRange?.from?.toString() || "");
    setPriceMax(currentFilters.priceRange?.to?.toString() || "");
  }, [currentFilters, visible]);

  // Toggle section
  const toggleSection = (sectionId: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(sectionId)) {
      newOpenSections.delete(sectionId);
    } else {
      newOpenSections.add(sectionId);
    }
    setOpenSections(newOpenSections);
  };

  // Handle status toggle
  const handleStatusChange = useCallback((value: string | string[] | null | undefined) => {
    const statuses = Array.isArray(value) ? value : [];
    setLocalFilters((prev) => ({
      ...prev,
      status: statuses.length > 0 ? statuses : undefined,
    }));
  }, []);

  // Handle sector toggle
  const handleSectorChange = useCallback((value: string | string[] | null | undefined) => {
    const sectorIds = Array.isArray(value) ? value : [];
    setLocalFilters((prev) => ({
      ...prev,
      sectorIds: sectorIds.length > 0 ? sectorIds : undefined,
    }));
  }, []);

  // Handle customer toggle
  const handleCustomerChange = useCallback((value: string | string[] | null | undefined) => {
    const customerIds = Array.isArray(value) ? value : [];
    setLocalFilters((prev) => ({
      ...prev,
      customerIds: customerIds.length > 0 ? customerIds : undefined,
    }));
  }, []);

  // Handle assignee toggle
  const handleAssigneeChange = useCallback((value: string | string[] | null | undefined) => {
    const assigneeIds = Array.isArray(value) ? value : [];
    setLocalFilters((prev) => ({
      ...prev,
      assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
    }));
  }, []);

  // Handle boolean filter change
  const handleBooleanChange = useCallback((key: string, value: string | null) => {
    setLocalFilters((prev: any) => ({
      ...prev,
      [key]: value === "yes" ? true : value === "no" ? false : undefined,
    }));
  }, []);

  // Handle situation change (mutually exclusive filters)
  const handleSituationChange = useCallback((value: string | null) => {
    setLocalFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters.isActive;
      delete newFilters.isCompleted;
      delete newFilters.isOverdue;

      switch (value) {
        case "active":
          newFilters.isActive = true;
          break;
        case "inactive":
          newFilters.isActive = false;
          break;
        case "completed":
          newFilters.isCompleted = true;
          break;
        case "overdue":
          newFilters.isOverdue = true;
          break;
      }

      return newFilters;
    });
  }, []);

  // Handle date range changes
  const handleDateRangeChange = useCallback((
    rangeKey: "entryDateRange" | "termRange" | "startedDateRange" | "finishedDateRange" | "createdAtRange" | "updatedAtRange",
    field: "from" | "to",
    date: Date | null
  ) => {
    setLocalFilters((prev) => {
      const currentRange = prev[rangeKey] || {};
      const otherField = field === "from" ? "to" : "from";

      // If clearing and no other value, remove the range entirely
      if (!date && !currentRange[otherField]) {
        const { [rangeKey]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [rangeKey]: {
          ...(currentRange[otherField] && { [otherField]: currentRange[otherField] }),
          ...(date && { [field]: date }),
        },
      };
    });
  }, []);

  // Handle price range change
  const handlePriceRangeChange = () => {
    const min = priceMin ? parseFloat(priceMin) : undefined;
    const max = priceMax ? parseFloat(priceMax) : undefined;

    if (min !== undefined || max !== undefined) {
      setLocalFilters((prev) => ({
        ...prev,
        priceRange: { from: min, to: max },
      }));
    } else {
      const { priceRange, ...rest } = localFilters;
      setLocalFilters(rest);
    }
  };

  // Apply filters
  const handleApply = () => {
    handlePriceRangeChange();
    onApply(localFilters);
    onClose();
  };

  // Reset filters
  const handleReset = () => {
    setLocalFilters({});
    setPriceMin("");
    setPriceMax("");
  };

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (localFilters.status?.length) count += localFilters.status.length;
    if (localFilters.sectorIds?.length) count += localFilters.sectorIds.length;
    if (localFilters.customerIds?.length) count += localFilters.customerIds.length;
    if (localFilters.assigneeIds?.length) count += localFilters.assigneeIds.length;
    if (localFilters.priceRange) count++;

    // Count boolean filters
    const booleanKeys = [
      "isOverdue",
      "isActive",
      "isCompleted",
      "hasSector",
      "hasCustomer",
      "hasTruck",
      "hasObservation",
      "hasArtworks",
      "hasPaints",
      "hasCommissions",
      "hasServices",
      "hasAirbrushing",
      "hasBudget",
      "hasNfe",
      "hasReceipt",
      "hasAssignee",
    ] as const;

    booleanKeys.forEach((key) => {
      if (localFilters[key] !== undefined) count++;
    });

    // Count date ranges
    const dateKeys = [
      "entryDateRange",
      "termRange",
      "startedDateRange",
      "finishedDateRange",
      "createdAtRange",
      "updatedAtRange",
    ] as const;

    dateKeys.forEach((key) => {
      if (localFilters[key]) count++;
    });

    return count;
  };

  const activeFilterCount = countActiveFilters();

  // Prepare options
  const statusOptions = useMemo(
    () =>
      Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    []
  );

  const sectorOptions = useMemo(
    () =>
      sectors.map((sector) => ({
        value: sector.id,
        label: sector.name,
      })),
    [sectors]
  );

  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.id,
        label: customer.fantasyName,
      })),
    [customers]
  );

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: user.name,
      })),
    [users]
  );

  // Get situation value
  const situationValue = useMemo(() => {
    if (localFilters.isActive === true) return "active";
    if (localFilters.isActive === false) return "inactive";
    if (localFilters.isCompleted === true) return "completed";
    if (localFilters.isOverdue === true) return "overdue";
    return "all";
  }, [localFilters]);

  // Boolean filter config
  const booleanFilters = [
    { key: "hasSector", label: "Tem setor" },
    { key: "hasCustomer", label: "Tem cliente" },
    { key: "hasTruck", label: "Tem caminhão" },
    { key: "hasObservation", label: "Tem observação" },
    { key: "hasArtworks", label: "Tem artes" },
    { key: "hasPaints", label: "Tem tintas" },
    { key: "hasCommissions", label: "Tem comissões" },
    { key: "hasServices", label: "Tem serviços" },
    { key: "hasAirbrushing", label: "Tem aerografia" },
    { key: "hasBudget", label: "Tem orçamento" },
    { key: "hasNfe", label: "Tem NFe" },
    { key: "hasReceipt", label: "Tem recibo" },
    { key: "hasAssignee", label: "Tem responsável" },
  ] as const;

  return (
    <Drawer
      open={visible}
      onOpenChange={onClose}
      side="right"
      width="90%"
      closeOnBackdropPress={true}
      closeOnSwipe={false}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              paddingTop: insets.top + 8,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <IconFilter size={24} color={colors.foreground} />
            <ThemedText style={styles.title}>Filtros de Tarefas</ThemedText>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" size="sm">
                {activeFilterCount}
              </Badge>
            )}
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconX size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 80 },
          ]}
          showsVerticalScrollIndicator={true}
        >
          {/* Status Section */}
          <View>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("status")}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.sectionTitle}>Status</ThemedText>
              <View style={styles.sectionHeaderRight}>
                {(localFilters.status?.length || 0) > 0 && (
                  <Badge variant="secondary" size="sm">
                    {localFilters.status?.length || 0}
                  </Badge>
                )}
                {openSections.has("status") ? (
                  <IconChevronDown size={20} color={colors.foreground} />
                ) : (
                  <IconChevronRight size={20} color={colors.foreground} />
                )}
              </View>
            </TouchableOpacity>
            {openSections.has("status") && (
              <View style={styles.sectionContent}>
                <Label style={styles.label}>Status da Tarefa</Label>
                <Combobox
                  value={localFilters.status || []}
                  onValueChange={handleStatusChange}
                  options={statusOptions}
                  placeholder="Selecionar status..."
                  multiple
                  searchable
                />
              </View>
            )}
          </View>

          <Separator style={styles.separator} />

          {/* Entities Section */}
          <View>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("entities")}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.sectionTitle}>Entidades</ThemedText>
              <View style={styles.sectionHeaderRight}>
                {(localFilters.sectorIds?.length || 0) +
                  (localFilters.customerIds?.length || 0) +
                  (localFilters.assigneeIds?.length || 0) >
                  0 && (
                  <Badge variant="secondary" size="sm">
                    {(localFilters.sectorIds?.length || 0) +
                      (localFilters.customerIds?.length || 0) +
                      (localFilters.assigneeIds?.length || 0)}
                  </Badge>
                )}
                {openSections.has("entities") ? (
                  <IconChevronDown size={20} color={colors.foreground} />
                ) : (
                  <IconChevronRight size={20} color={colors.foreground} />
                )}
              </View>
            </TouchableOpacity>
            {openSections.has("entities") && (
              <View style={styles.sectionContent}>
                <Tabs
                  value={entityTab}
                  onValueChange={(value) => setEntityTab(value as any)}
                >
                  <TabsList style={{ backgroundColor: colors.muted }}>
                    <TabsTrigger value="sectors">
                      <View style={styles.tabTriggerContent}>
                        <ThemedText style={styles.tabTriggerText}>Setores</ThemedText>
                        {localFilters.sectorIds?.length ? (
                          <Badge variant="secondary" size="sm" style={styles.tabBadge}>
                            {localFilters.sectorIds.length}
                          </Badge>
                        ) : null}
                      </View>
                    </TabsTrigger>
                    <TabsTrigger value="customers">
                      <View style={styles.tabTriggerContent}>
                        <ThemedText style={styles.tabTriggerText}>Clientes</ThemedText>
                        {localFilters.customerIds?.length ? (
                          <Badge variant="secondary" size="sm" style={styles.tabBadge}>
                            {localFilters.customerIds.length}
                          </Badge>
                        ) : null}
                      </View>
                    </TabsTrigger>
                    <TabsTrigger value="assignees">
                      <View style={styles.tabTriggerContent}>
                        <ThemedText style={styles.tabTriggerText}>Responsáveis</ThemedText>
                        {localFilters.assigneeIds?.length ? (
                          <Badge variant="secondary" size="sm" style={styles.tabBadge}>
                            {localFilters.assigneeIds.length}
                          </Badge>
                        ) : null}
                      </View>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="sectors">
                    <View style={styles.field}>
                      <Label style={styles.label}>Setores</Label>
                      <Combobox
                        value={localFilters.sectorIds || []}
                        onValueChange={handleSectorChange}
                        options={sectorOptions}
                        placeholder="Selecionar setores..."
                        multiple
                        searchable
                      />
                    </View>
                  </TabsContent>

                  <TabsContent value="customers">
                    <View style={styles.field}>
                      <Label style={styles.label}>Clientes</Label>
                      <Combobox
                        value={localFilters.customerIds || []}
                        onValueChange={handleCustomerChange}
                        options={customerOptions}
                        placeholder="Selecionar clientes..."
                        multiple
                        searchable
                      />
                    </View>
                  </TabsContent>

                  <TabsContent value="assignees">
                    <View style={styles.field}>
                      <Label style={styles.label}>Responsáveis</Label>
                      <Combobox
                        value={localFilters.assigneeIds || []}
                        onValueChange={handleAssigneeChange}
                        options={userOptions}
                        placeholder="Selecionar responsáveis..."
                        multiple
                        searchable
                      />
                    </View>
                  </TabsContent>
                </Tabs>
              </View>
            )}
          </View>

          <Separator style={styles.separator} />

          {/* Dates Section */}
          <View>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("dates")}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.sectionTitle}>Datas</ThemedText>
              <View style={styles.sectionHeaderRight}>
                {openSections.has("dates") ? (
                  <IconChevronDown size={20} color={colors.foreground} />
                ) : (
                  <IconChevronRight size={20} color={colors.foreground} />
                )}
              </View>
            </TouchableOpacity>
            {openSections.has("dates") && (
              <View style={styles.sectionContent}>
                {/* Entry Date */}
                <View style={styles.dateRangeGroup}>
                  <ThemedText style={styles.dateRangeTitle}>Data de Entrada</ThemedText>
                  <View style={styles.dateRangeRow}>
                    <View style={styles.dateRangeField}>
                      <Label style={styles.dateLabel}>De</Label>
                      <DatePicker
                        value={localFilters.entryDateRange?.from as Date | undefined}
                        onChange={(date) =>
                          handleDateRangeChange("entryDateRange", "from", date)
                        }
                        placeholder="Data inicial"
                      />
                    </View>
                    <View style={styles.dateRangeField}>
                      <Label style={styles.dateLabel}>Até</Label>
                      <DatePicker
                        value={localFilters.entryDateRange?.to as Date | undefined}
                        onChange={(date) =>
                          handleDateRangeChange("entryDateRange", "to", date)
                        }
                        placeholder="Data final"
                      />
                    </View>
                  </View>
                </View>

                {/* Term (Deadline) */}
                <View style={styles.dateRangeGroup}>
                  <ThemedText style={styles.dateRangeTitle}>Prazo</ThemedText>
                  <View style={styles.dateRangeRow}>
                    <View style={styles.dateRangeField}>
                      <Label style={styles.dateLabel}>De</Label>
                      <DatePicker
                        value={localFilters.termRange?.from as Date | undefined}
                        onChange={(date) => handleDateRangeChange("termRange", "from", date)}
                        placeholder="Data inicial"
                      />
                    </View>
                    <View style={styles.dateRangeField}>
                      <Label style={styles.dateLabel}>Até</Label>
                      <DatePicker
                        value={localFilters.termRange?.to as Date | undefined}
                        onChange={(date) => handleDateRangeChange("termRange", "to", date)}
                        placeholder="Data final"
                      />
                    </View>
                  </View>
                </View>

                {/* Started Date */}
                <View style={styles.dateRangeGroup}>
                  <ThemedText style={styles.dateRangeTitle}>Data de Início</ThemedText>
                  <View style={styles.dateRangeRow}>
                    <View style={styles.dateRangeField}>
                      <Label style={styles.dateLabel}>De</Label>
                      <DatePicker
                        value={localFilters.startedDateRange?.from as Date | undefined}
                        onChange={(date) =>
                          handleDateRangeChange("startedDateRange", "from", date)
                        }
                        placeholder="Data inicial"
                      />
                    </View>
                    <View style={styles.dateRangeField}>
                      <Label style={styles.dateLabel}>Até</Label>
                      <DatePicker
                        value={localFilters.startedDateRange?.to as Date | undefined}
                        onChange={(date) =>
                          handleDateRangeChange("startedDateRange", "to", date)
                        }
                        placeholder="Data final"
                      />
                    </View>
                  </View>
                </View>

                {/* Finished Date */}
                <View style={styles.dateRangeGroup}>
                  <ThemedText style={styles.dateRangeTitle}>Data de Conclusão</ThemedText>
                  <View style={styles.dateRangeRow}>
                    <View style={styles.dateRangeField}>
                      <Label style={styles.dateLabel}>De</Label>
                      <DatePicker
                        value={localFilters.finishedDateRange?.from as Date | undefined}
                        onChange={(date) =>
                          handleDateRangeChange("finishedDateRange", "from", date)
                        }
                        placeholder="Data inicial"
                      />
                    </View>
                    <View style={styles.dateRangeField}>
                      <Label style={styles.dateLabel}>Até</Label>
                      <DatePicker
                        value={localFilters.finishedDateRange?.to as Date | undefined}
                        onChange={(date) =>
                          handleDateRangeChange("finishedDateRange", "to", date)
                        }
                        placeholder="Data final"
                      />
                    </View>
                  </View>
                </View>

                {/* Created Date */}
                <View style={styles.dateRangeGroup}>
                  <ThemedText style={styles.dateRangeTitle}>Data de Criação</ThemedText>
                  <View style={styles.dateRangeRow}>
                    <View style={styles.dateRangeField}>
                      <Label style={styles.dateLabel}>De</Label>
                      <DatePicker
                        value={localFilters.createdAtRange?.from as Date | undefined}
                        onChange={(date) =>
                          handleDateRangeChange("createdAtRange", "from", date)
                        }
                        placeholder="Data inicial"
                      />
                    </View>
                    <View style={styles.dateRangeField}>
                      <Label style={styles.dateLabel}>Até</Label>
                      <DatePicker
                        value={localFilters.createdAtRange?.to as Date | undefined}
                        onChange={(date) => handleDateRangeChange("createdAtRange", "to", date)}
                        placeholder="Data final"
                      />
                    </View>
                  </View>
                </View>

                {/* Updated Date */}
                <View style={styles.dateRangeGroup}>
                  <ThemedText style={styles.dateRangeTitle}>Data de Atualização</ThemedText>
                  <View style={styles.dateRangeRow}>
                    <View style={styles.dateRangeField}>
                      <Label style={styles.dateLabel}>De</Label>
                      <DatePicker
                        value={localFilters.updatedAtRange?.from as Date | undefined}
                        onChange={(date) =>
                          handleDateRangeChange("updatedAtRange", "from", date)
                        }
                        placeholder="Data inicial"
                      />
                    </View>
                    <View style={styles.dateRangeField}>
                      <Label style={styles.dateLabel}>Até</Label>
                      <DatePicker
                        value={localFilters.updatedAtRange?.to as Date | undefined}
                        onChange={(date) =>
                          handleDateRangeChange("updatedAtRange", "to", date)
                        }
                        placeholder="Data final"
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>

          <Separator style={styles.separator} />

          {/* Characteristics Section */}
          <View>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("characteristics")}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.sectionTitle}>Características</ThemedText>
              <View style={styles.sectionHeaderRight}>
                {openSections.has("characteristics") ? (
                  <IconChevronDown size={20} color={colors.foreground} />
                ) : (
                  <IconChevronRight size={20} color={colors.foreground} />
                )}
              </View>
            </TouchableOpacity>
            {openSections.has("characteristics") && (
              <View style={styles.sectionContent}>
                {/* Situation (mutually exclusive) */}
                <View style={styles.field}>
                  <Label style={styles.label}>Situação</Label>
                  <Combobox
                    value={situationValue}
                    onValueChange={handleSituationChange}
                    options={[
                      { label: "Todas", value: "all" },
                      { label: "Ativas", value: "active" },
                      { label: "Inativas", value: "inactive" },
                      { label: "Finalizadas", value: "completed" },
                      { label: "Atrasadas", value: "overdue" },
                    ]}
                    placeholder="Todas"
                    searchable={false}
                  />
                </View>

                {/* Boolean filters */}
                <View style={styles.booleanGrid}>
                  {booleanFilters.map(({ key, label }) => {
                    const filterValue = (localFilters as any)[key];
                    return (
                      <View key={key} style={styles.field}>
                        <Label style={styles.label}>{label}</Label>
                        <Combobox
                          value={
                            filterValue === true ? "yes" : filterValue === false ? "no" : "all"
                          }
                          onValueChange={(value) =>
                            handleBooleanChange(key, value)
                          }
                          options={[
                            { label: "Todos", value: "all" },
                            { label: "Sim", value: "yes" },
                            { label: "Não", value: "no" },
                          ]}
                          placeholder="Todos"
                          searchable={false}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          <Separator style={styles.separator} />

          {/* Values Section */}
          <View>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("values")}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.sectionTitle}>Valores</ThemedText>
              <View style={styles.sectionHeaderRight}>
                {localFilters.priceRange && (
                  <Badge variant="secondary" size="sm">
                    1
                  </Badge>
                )}
                {openSections.has("values") ? (
                  <IconChevronDown size={20} color={colors.foreground} />
                ) : (
                  <IconChevronRight size={20} color={colors.foreground} />
                )}
              </View>
            </TouchableOpacity>
            {openSections.has("values") && (
              <View style={styles.sectionContent}>
                <View style={styles.field}>
                  <Label style={styles.label}>Faixa de Valor</Label>
                  <View style={styles.priceRangeRow}>
                    <View style={styles.priceField}>
                      <Label style={styles.dateLabel}>Mínimo</Label>
                      <RNTextInput
                        style={[
                          styles.priceInput,
                          {
                            color: colors.foreground,
                            backgroundColor: colors.input,
                            borderColor: colors.border,
                          },
                        ]}
                        value={priceMin}
                        onChangeText={setPriceMin}
                        placeholder="0,00"
                        placeholderTextColor={colors.mutedForeground}
                        keyboardType="decimal-pad"
                        onBlur={handlePriceRangeChange}
                      />
                    </View>
                    <View style={styles.priceField}>
                      <Label style={styles.dateLabel}>Máximo</Label>
                      <RNTextInput
                        style={[
                          styles.priceInput,
                          {
                            color: colors.foreground,
                            backgroundColor: colors.input,
                            borderColor: colors.border,
                          },
                        ]}
                        value={priceMax}
                        onChangeText={setPriceMax}
                        placeholder="0,00"
                        placeholderTextColor={colors.mutedForeground}
                        keyboardType="decimal-pad"
                        onBlur={handlePriceRangeChange}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <Button
            variant="outline"
            size="default"
            onPress={handleReset}
            style={styles.btn}
          >
            <IconX size={16} color={colors.foreground} />
            <ThemedText>Limpar filtros</ThemedText>
          </Button>
          <Button variant="default" size="default" onPress={handleApply} style={styles.btn}>
            <ThemedText>Aplicar filtros</ThemedText>
          </Button>
        </View>
      </View>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  sectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  sectionContent: {
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  separator: {
    marginVertical: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  field: {
    gap: spacing.xs,
  },
  tabTriggerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tabTriggerText: {
    fontSize: fontSize.sm,
  },
  tabBadge: {
    marginLeft: spacing.xxs,
  },
  dateRangeGroup: {
    gap: spacing.sm,
  },
  dateRangeTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  dateRangeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateRangeField: {
    flex: 1,
    gap: spacing.xs,
  },
  dateLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
  },
  booleanGrid: {
    gap: spacing.md,
  },
  priceRangeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  priceField: {
    flex: 1,
    gap: spacing.xs,
  },
  priceInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.md,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  btn: {
    flex: 1,
  },
});
