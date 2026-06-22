import React from "react";
import { Modal, View, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import type { WarehouseLocation } from "@/types";
import { WarehouseLocationFrontView } from "./warehouse-location-front-view";

interface Props {
  visible: boolean;
  onClose: () => void;
  location: WarehouseLocation | null;
  highlightItemIds?: Set<string>;
}

/**
 * Structure detail shown as a native page-sheet (same primitive as the "Meu Bônus" rules
 * modal): OS-driven slide/backdrop/swipe-to-dismiss, no reanimated/gesture overhead, and no
 * ScrollView-inside-pan-gesture race. The vertical ScrollView lives here; the front-view body
 * only lays out its shelves (and scrolls horizontally for kanban).
 */
export function WarehouseFrontViewModal({ visible, onClose, location, highlightItemIds }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ alignItems: "center", paddingTop: 8 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: `${colors.mutedForeground}40` }} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 12, paddingTop: 6 }}>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={{ height: 32, width: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: `${colors.mutedForeground}18` }}
          >
            <IconX size={18} color={colors.foreground} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          {location && <WarehouseLocationFrontView location={location} highlightItemIds={highlightItemIds} />}
        </ScrollView>
      </View>
    </Modal>
  );
}
