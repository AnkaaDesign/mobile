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
import { IconChevronRight, IconX, IconList } from "@tabler/icons-react-native";
import { useTutorial, useTutorialActions } from "./tutorial-context";
import type { TutorialStep } from "./types";

/**
 * Jump-to-step affordance. Available while a tutorial is running so users
 * (and devs) can hop to any step without walking the whole flow.
 *
 * Perf design — the previous version had three landmines:
 *   - A non-virtualized ScrollView + `.map()` over 138 step rows.
 *   - `useTutorial()` strict subscription, which re-rendered all 138 rows
 *     on every provider update (4× per step transition while the modal
 *     was open).
 *   - Inline lambdas in the row props, defeating React.memo even if it
 *     had been used.
 *
 * Fix:
 *   - FlatList with stable `keyExtractor`, `getItemLayout`, and a
 *     `React.memo`'d row component.
 *   - The picker pill at the bottom-left subscribes via `useTutorial`
 *     (it needs `currentStepIndex`), but the modal body — including the
 *     138-row list — is rendered in a separate `PickerSheet` component
 *     that subscribes only to the `actions` bag. Its props (steps array,
 *     current index, onPick) are stable across provider state churn, so
 *     the list does NOT re-render when `phase` / `rect` / `awaitingAction`
 *     flip during a step.
 *   - The list contents only mount when the modal opens (lazy render).
 */
export function TutorialDevStepPicker() {
  const tutorial = useTutorial();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  if (!tutorial.isActive || tutorial.steps.length === 0) return null;

  const { steps, currentStepIndex, goToStep, bumpMeasureTick } = tutorial;

  // Users discovered that opening the picker "unsticks" a missing spotlight
  // (a real race in measureInWindow on chrome-header targets — see the
  // extended cascade in `tutorial-context.tsx`). Even with the cascade
  // extended to 4s, pressing the pill should kick an immediate re-measure
  // so the user's instinctive workaround keeps working — and is faster
  // than the 4s ceiling on the cascade.
  const handleOpen = () => {
    setOpen(true);
    try {
      bumpMeasureTick();
    } catch {}
  };

  return (
    <>
      <Pressable
        onPress={handleOpen}
        hitSlop={8}
        style={[styles.fab, { bottom: insets.bottom + 8 }]}
      >
        <IconList size={12} color="#F8FAFC" />
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
            onPick={(index) => {
              goToStep(index);
              setOpen(false);
            }}
            onClose={() => setOpen(false)}
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
}

const ROW_HEIGHT = 44;

/**
 * Inner sheet. Subscribes only to the actions bag (stable), so updates
 * during the active step (rect re-measure, phase flips, awaitingAction
 * toggles) do NOT re-render the 138-row list. The parent re-renders the
 * pill and passes new props down — those props are stable references
 * across provider state churn because `steps` doesn't mutate during a
 * run and `currentStepIndex` only changes on next/jump.
 */
function PickerSheet({ steps, currentStepIndex, onPick, onClose }: SheetProps) {
  const insets = useSafeAreaInsets();
  // Subscribing to actions instead of state — the sheet doesn't need
  // anything else.
  useTutorialActions();
  const [query, setQuery] = useState("");

  const trimmed = query.trim().toLowerCase();
  const filtered = useMemo<TutorialStep[]>(() => {
    if (!trimmed) return steps;
    return steps.filter(
      (s) =>
        s.id.toLowerCase().includes(trimmed) ||
        s.title.toLowerCase().includes(trimmed) ||
        (s.screen ?? "").toLowerCase().includes(trimmed),
    );
  }, [steps, trimmed]);

  // Index lookup so the memoized row component receives a stable `index`
  // prop without forcing the FlatList to recompute on every render.
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
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Pular para passo</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <IconX size={20} color="#94A3B8" />
          </Pressable>
        </View>
        <View style={styles.searchWrap}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Filtrar por título, id ou rota"
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
          {step.title}
        </Text>
      </View>
      <IconChevronRight size={16} color="#64748B" />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#7C2D12",
    borderWidth: 1,
    borderColor: "#FCD34D",
    zIndex: 20000,
    elevation: 2000,
  },
  fabText: {
    color: "#F8FAFC",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: "#0008",
    justifyContent: "flex-end",
  },
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
  sheetTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchInput: {
    backgroundColor: "#1E293B",
    color: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    height: ROW_HEIGHT,
  },
  rowCurrent: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  rowIndex: {
    width: 32,
    alignItems: "flex-end",
  },
  rowIndexText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "600",
  },
});
