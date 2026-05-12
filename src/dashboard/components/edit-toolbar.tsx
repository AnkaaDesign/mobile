// Mobile dashboard edit toolbar — uses the app's canonical Button component
// so the chrome matches every other action surface in the app (proper fills,
// shadows, press animations).
//
// CRITICAL LAYOUT NOTE: on a 360px phone viewport (iPhone SE / standard
// Android), three full-size action buttons overflow the 328px content area.
// We keep them within budget by:
//   1. Using size="sm" on every action (33px height, 12px padding).
//   2. Compact "Adicionar" label (no "widget" suffix) + right-aligned icon.
//   3. The spacer pushes Descartar+Salvar to the right so Adicionar can
//      occupy the left edge — keeps the row balanced when only Adicionar
//      is visible in narrower future variants.
//   4. The tutorial anchor wrappers use collapsable={false} so RN's view
//      flattening doesn't merge them into the Button's native shadow node
//      (caused the wrong-position spotlight bug — see tutorial v3 rewrite).

import { StyleSheet, View } from "react-native";
import {
  IconArrowBackUp,
  IconDeviceFloppy,
  IconPencil,
  IconPlus,
} from "@tabler/icons-react-native";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { lightImpactHaptic } from "@/utils/haptics";
import type { LegacyRef } from "react";
import type { LayoutChangeEvent, View as RNView } from "react-native";

interface TutorialTarget {
  ref?: LegacyRef<RNView>;
  onLayout?: (e: LayoutChangeEvent) => void;
  onPress?: () => void;
}

export interface EditToolbarProps {
  isEditing: boolean;
  isDirty: boolean;
  isSaving: boolean;
  onEnterEdit: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onAddWidget: () => void;
  editButtonTarget?: TutorialTarget;
  addWidgetTarget?: TutorialTarget;
  cancelEditTarget?: TutorialTarget;
  saveEditTarget?: TutorialTarget;
  editToolbarTarget?: TutorialTarget;
}

export function EditToolbar({
  isEditing,
  isDirty,
  isSaving,
  onEnterEdit,
  onSave,
  onDiscard,
  onAddWidget,
  editButtonTarget,
  addWidgetTarget,
  cancelEditTarget,
  saveEditTarget,
  editToolbarTarget,
}: EditToolbarProps) {
  const { colors, isDark } = useTheme();

  // The Button's `outline` variant uses transparent bg, which disappears
  // on the page background. Override with a visible raised surface:
  // `colors.card` (#fafafa) in light over the gray (#e8e8e8) page bg, and
  // `colors.secondary` (#333) in dark over the near-black (#1c1c1c) bg.
  const outlineBg = isDark ? colors.secondary : colors.card;

  if (!isEditing) {
    return (
      <View
        ref={editButtonTarget?.ref}
        onLayout={editButtonTarget?.onLayout}
        collapsable={false}
      >
        <Button
          variant="outline"
          size="sm"
          icon={<IconPencil size={13} color={colors.foreground} />}
          iconPosition="left"
          onPress={() => {
            editButtonTarget?.onPress?.();
            void lightImpactHaptic();
            onEnterEdit();
          }}
          accessibilityLabel="Editar painel"
          style={{
            backgroundColor: outlineBg,
            borderColor: colors.border,
            height: 30,
            paddingHorizontal: 10,
          }}
        >
          Editar
        </Button>
      </View>
    );
  }

  const saveDisabled = !isDirty || isSaving;
  const discardDisabled = isSaving;

  return (
    <View
      ref={editToolbarTarget?.ref}
      onLayout={editToolbarTarget?.onLayout}
      collapsable={false}
      style={styles.editRow}
    >
      <View
        ref={addWidgetTarget?.ref}
        onLayout={addWidgetTarget?.onLayout}
        collapsable={false}
      >
        <Button
          variant="outline"
          size="sm"
          icon={<IconPlus size={14} color={colors.foreground} />}
          iconPosition="right"
          onPress={() => {
            addWidgetTarget?.onPress?.();
            void lightImpactHaptic();
            onAddWidget();
          }}
          accessibilityLabel="Adicionar widget"
          style={{
            backgroundColor: outlineBg,
            borderColor: colors.border,
          }}
        >
          Adicionar
        </Button>
      </View>

      <View style={styles.spacer} />

      <View
        ref={cancelEditTarget?.ref}
        onLayout={cancelEditTarget?.onLayout}
        collapsable={false}
      >
        <Button
          variant="destructive"
          size="sm"
          icon={
            <IconArrowBackUp
              size={14}
              color={colors.destructiveForeground ?? "#fff"}
            />
          }
          iconPosition="left"
          disabled={discardDisabled}
          onPress={() => {
            cancelEditTarget?.onPress?.();
            void lightImpactHaptic();
            onDiscard();
          }}
          accessibilityLabel="Descartar alterações"
        >
          Descartar
        </Button>
      </View>

      <View
        ref={saveEditTarget?.ref}
        onLayout={saveEditTarget?.onLayout}
        collapsable={false}
      >
        <Button
          variant="default"
          size="sm"
          loading={isSaving}
          icon={
            !isSaving ? (
              <IconDeviceFloppy size={14} color={colors.primaryForeground} />
            ) : undefined
          }
          iconPosition="left"
          disabled={saveDisabled}
          onPress={() => {
            saveEditTarget?.onPress?.();
            void lightImpactHaptic();
            onSave();
          }}
          accessibilityLabel="Salvar painel"
        >
          {isSaving ? "Salvando" : "Salvar"}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    // The parent screen uses `gap: 16` between stacked children which is
    // right for the greeting → grid spacing, but feels excessive for this
    // inline toolbar row sitting directly under the greeting card.
    marginTop: -8,
  },
  spacer: {
    flex: 1,
  },
});
