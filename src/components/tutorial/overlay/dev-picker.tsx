/**
 * Dev step picker — adapted from v4. `goToStep(index)` is now a single
 * synchronous setState; jumping is bulletproof.
 */
import { memo, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronRight, IconX } from "@tabler/icons-react-native";
import { useTutorial } from "../provider";
import type { TutorialStep } from "../engine-types";

const ROW_HEIGHT = 44;

export function TutorialDevPicker() {
  const tutorial = useTutorial();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  if (!tutorial.isActive || tutorial.steps.length === 0) return null;
  const { steps, currentStepIndex } = tutorial;

  const handlePick = (index: number) => {
    tutorial.goToStep(index);
    setOpen(false);
  };
  const handleSkip = () => {
    setOpen(false);
    void tutorial.skip();
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={[styles.fab, { bottom: insets.bottom + 8 }]}
      >
        <Text style={styles.fabText}>
          Passo {currentStepIndex + 1}/{steps.length}
        </Text>
      </Pressable>
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        {open ? (
          <PickerSheet
            steps={steps}
            currentStepIndex={currentStepIndex}
            onPick={handlePick}
            onClose={() => setOpen(false)}
            onSkip={handleSkip}
          />
        ) : null}
      </Modal>
    </>
  );
}

interface SheetProps {
  steps: TutorialStep[];
  currentStepIndex: number;
  onPick: (index: number) => void;
  onClose: () => void;
  onSkip: () => void;
}

function PickerSheet({
  steps,
  currentStepIndex,
  onPick,
  onClose,
  onSkip,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLowerCase();

  const filtered = useMemo<TutorialStep[]>(() => {
    if (!trimmed) return steps;
    return steps.filter(
      (s) =>
        s.id.toLowerCase().includes(trimmed) ||
        s.title.toLowerCase().includes(trimmed) ||
        s.scene.toLowerCase().includes(trimmed),
    );
  }, [steps, trimmed]);

  const indexByStepId = useMemo(() => {
    const m = new Map<string, number>();
    steps.forEach((s, i) => m.set(s.id, i));
    return m;
  }, [steps]);

  const keyExtractor = useCallback((s: TutorialStep) => s.id, []);
  const getItemLayout = useCallback(
    (_: ArrayLike<TutorialStep> | null | undefined, i: number) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * i,
      index: i,
    }),
    [],
  );

  const renderItem = useCallback<ListRenderItem<TutorialStep>>(
    ({ item }) => {
      const index = indexByStepId.get(item.id) ?? 0;
      return (
        <PickerRow
          step={item}
          index={index}
          isCurrent={index === currentStepIndex}
          onPick={onPick}
        />
      );
    },
    [indexByStepId, currentStepIndex, onPick],
  );

  return (
    <View style={styles.modalRoot}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 },
        ]}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Pular para passo</Text>
          <View style={styles.headerActions}>
            <Pressable onPress={onSkip} hitSlop={12} style={styles.skipBtn}>
              <Text style={styles.skipBtnText}>Pular tutorial</Text>
            </Pressable>
            <Pressable onPress={onClose} hitSlop={12}>
              <IconX size={20} color="#94A3B8" />
            </Pressable>
          </View>
        </View>
        <View style={styles.searchWrap}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Filtrar por título, id ou cena"
            placeholderTextColor="#475569"
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={trimmed ? undefined : getItemLayout}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator
          initialNumToRender={16}
          maxToRenderPerBatch={16}
          windowSize={7}
          removeClippedSubviews
        />
      </View>
    </View>
  );
}

interface RowProps {
  step: TutorialStep;
  index: number;
  isCurrent: boolean;
  onPick: (index: number) => void;
}

const PickerRow = memo(function PickerRow({
  step,
  index,
  isCurrent,
  onPick,
}: RowProps) {
  const handlePress = useCallback(() => onPick(index), [index, onPick]);
  return (
    <Pressable
      onPress={handlePress}
      style={[styles.row, isCurrent && styles.rowCurrent]}
    >
      <View style={styles.rowIndex}>
        <Text style={styles.rowIndexText}>{index + 1}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {step.id} — {step.title}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {step.scene}
          {step.highlight ? ` · ${step.highlight}` : ""}
        </Text>
      </View>
      <IconChevronRight size={16} color="#64748B" />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(124, 45, 18, 0.85)",
    borderWidth: 1,
    borderColor: "#FCD34D",
    zIndex: 20000,
    elevation: 2000,
  },
  fabText: { color: "#F8FAFC", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  modalRoot: { flex: 1, backgroundColor: "#0008", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    borderTopWidth: 1,
    borderColor: "#1E293B",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  sheetTitle: { color: "#F8FAFC", fontSize: 16, fontWeight: "700" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
  },
  skipBtnText: { color: "#F8FAFC", fontSize: 12, fontWeight: "600" },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12 },
  searchInput: {
    backgroundColor: "#1E293B",
    color: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  list: { flexGrow: 0 },
  listContent: { paddingHorizontal: 12, paddingVertical: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    height: ROW_HEIGHT,
  },
  rowCurrent: { backgroundColor: "#1E293B", borderWidth: 1, borderColor: "#FCD34D" },
  rowIndex: { width: 32, alignItems: "flex-end" },
  rowIndexText: { color: "#64748B", fontSize: 12, fontWeight: "700" },
  rowBody: { flex: 1 },
  rowTitle: { color: "#F8FAFC", fontSize: 14, fontWeight: "600" },
  rowMeta: { color: "#94A3B8", fontSize: 11, marginTop: 2 },
});
