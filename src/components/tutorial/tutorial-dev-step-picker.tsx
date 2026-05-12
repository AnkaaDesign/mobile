import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronRight, IconX, IconList } from "@tabler/icons-react-native";
import { useTutorial } from "./tutorial-context";

/**
 * Floating affordance that lists every step in the active tutorial and
 * jumps to the picked one. Available to all users (including production
 * sector) while a tutorial is running, so they can re-visit a specific
 * page or skip forward without walking through every prior step.
 *
 * The pill sits at the bottom-left so it doesn't collide with the
 * notification bell or drawer-menu buttons in the header chrome.
 */
export function TutorialDevStepPicker() {
  const tutorial = useTutorial();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  if (!tutorial.isActive || tutorial.steps.length === 0) return null;

  const { steps, currentStepIndex, goToStep } = tutorial;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={[
          styles.fab,
          { bottom: insets.bottom + 8 },
        ]}
      >
        <IconList size={12} color="#F8FAFC" />
        <Text style={styles.fabText}>Passo {currentStepIndex + 1}/{steps.length}</Text>
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
          />
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
              <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                <IconX size={20} color="#94A3B8" />
              </Pressable>
            </View>
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator
            >
              {steps.map((step, index) => {
                const isCurrent = index === currentStepIndex;
                return (
                  <Pressable
                    key={step.id}
                    onPress={() => {
                      goToStep(index);
                      setOpen(false);
                    }}
                    style={[styles.row, isCurrent && styles.rowCurrent]}
                  >
                    <View style={styles.rowIndex}>
                      <Text style={styles.rowIndexText}>{index + 1}</Text>
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {step.title}
                      </Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {step.id}
                        {step.screen ? ` · ${step.screen}` : ""}
                      </Text>
                    </View>
                    <IconChevronRight size={16} color="#64748B" />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

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
  rowMeta: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
  },
});
