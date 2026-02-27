import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius } from '@/constants/design-system';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { ThemedText } from '@/components/ui/themed-text';
import {
  IconCheck, IconX, IconUser, IconUsers, IconStar, IconHeart,
  IconHome, IconSettings, IconSearch, IconBell, IconMail, IconPhone,
  IconCamera, IconPhoto, IconFile, IconFolder, IconCalendar, IconClock,
  IconMap, IconFlag, IconBookmark, IconTag, IconLock, IconKey,
  IconEye, IconEdit, IconTrash, IconDownload, IconUpload, IconShare,
  IconLink, IconGlobe, IconWifi, IconBluetooth, IconBattery, IconVolume,
  IconSun, IconMoon, IconCloud, IconDroplet, IconFlame, IconSnowflake,
  IconWind, IconUmbrella, IconThermometer, IconCompass, IconAnchor,
  IconRocket, IconPlane, IconCar, IconBike, IconWalk, IconRun,
  IconTruck, IconShip, IconTrain, IconBus,
  IconShoppingCart, IconCreditCard, IconCash, IconReceipt,
  IconChartBar, IconTrendingUp, IconActivity,
  IconCode, IconTerminal, IconDatabase, IconServer,
  IconBrush, IconPalette, IconPencil, IconEraser,
  IconMusic, IconVideo, IconMicrophone, IconHeadphones,
  IconPizza, IconCoffee, IconGlass, IconMeat,
  IconMoodSmile, IconMoodSad, IconMoodHappy,
  IconAlertCircle, IconInfoCircle, IconCircleCheck, IconCircleX,
  IconArrowUp, IconArrowDown, IconArrowLeft, IconArrowRight,
  IconChevronUp, IconChevronDown, IconChevronLeft, IconChevronRight,
  IconPlus, IconMinus, IconDots, IconDotsVertical,
  IconMessage, IconSend, IconInbox,
  IconAward, IconTrophy, IconMedal, IconCrown,
  IconShield, IconSword, IconTarget,
  IconDeviceDesktop, IconDeviceMobile, IconDeviceTablet, IconPrinter,
  IconBuildingStore, IconBuilding, IconSchool, IconHospital,
  IconTree, IconLeaf, IconSeedling,
  IconDog, IconCat, IconFish,
} from '@tabler/icons-react-native';

// Map of available icons
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  IconCheck, IconX, IconUser, IconUsers, IconStar, IconHeart,
  IconHome, IconSettings, IconSearch, IconBell, IconMail, IconPhone,
  IconCamera, IconPhoto, IconFile, IconFolder, IconCalendar, IconClock,
  IconMap, IconFlag, IconBookmark, IconTag, IconLock, IconKey,
  IconEye, IconEdit, IconTrash, IconDownload, IconUpload, IconShare,
  IconLink, IconGlobe, IconWifi, IconBluetooth, IconBattery, IconVolume,
  IconSun, IconMoon, IconCloud, IconDroplet, IconFlame, IconSnowflake,
  IconWind, IconUmbrella, IconThermometer, IconCompass, IconAnchor,
  IconRocket, IconPlane, IconCar, IconBike, IconWalk, IconRun,
  IconTruck, IconShip, IconTrain, IconBus,
  IconShoppingCart, IconCreditCard, IconCash, IconReceipt,
  IconChartBar, IconTrendingUp, IconActivity,
  IconCode, IconTerminal, IconDatabase, IconServer,
  IconBrush, IconPalette, IconPencil, IconEraser,
  IconMusic, IconVideo, IconMicrophone, IconHeadphones,
  IconPizza, IconCoffee, IconGlass, IconMeat,
  IconMoodSmile, IconMoodSad, IconMoodHappy,
  IconAlertCircle, IconInfoCircle, IconCircleCheck, IconCircleX,
  IconArrowUp, IconArrowDown, IconArrowLeft, IconArrowRight,
  IconChevronUp, IconChevronDown, IconChevronLeft, IconChevronRight,
  IconPlus, IconMinus, IconDots, IconDotsVertical,
  IconMessage, IconSend, IconInbox,
  IconAward, IconTrophy, IconMedal, IconCrown,
  IconShield, IconSword, IconTarget,
  IconDeviceDesktop, IconDeviceMobile, IconDeviceTablet, IconPrinter,
  IconBuildingStore, IconBuilding, IconSchool, IconHospital,
  IconTree, IconLeaf, IconSeedling,
  IconDog, IconCat, IconFish,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export function getIconComponent(name: string): React.ComponentType<{ size?: number; color?: string }> | null {
  return ICON_MAP[name] || null;
}

interface IconPickerSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  selectedIcon?: string;
}

export function IconPickerSheet({ open, onClose, onSelect, selectedIcon }: IconPickerSheetProps) {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return AVAILABLE_ICONS;
    const term = search.toLowerCase();
    return AVAILABLE_ICONS.filter((name) =>
      name.toLowerCase().includes(term)
    );
  }, [search]);

  const handleSelect = (iconName: string) => {
    onSelect(iconName);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose} snapPoints={[85]}>
      <SheetContent>
        <SheetHeader>
          <ThemedText style={[styles.title, { color: colors.foreground }]}>Selecionar Ícone</ThemedText>
        </SheetHeader>

        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar ícone..."
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
          />
        </View>

        <FlatList
          data={filteredIcons}
          numColumns={6}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => {
            const IconComp = ICON_MAP[item];
            const isSelected = item === selectedIcon;
            return (
              <TouchableOpacity
                style={[
                  styles.iconCell,
                  isSelected && { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 1 },
                ]}
                onPress={() => handleSelect(item)}
              >
                <IconComp size={22} color={isSelected ? colors.primary : colors.foreground} />
                <ThemedText
                  style={[styles.iconLabel, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {item.replace('Icon', '')}
                </ThemedText>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={{ color: colors.mutedForeground }}>Nenhum ícone encontrado</ThemedText>
            </View>
          }
        />
      </SheetContent>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  grid: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
  },
  iconCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: borderRadius.md,
    padding: 4,
    maxWidth: '16.66%',
  },
  iconLabel: {
    fontSize: 8,
    marginTop: 2,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
});
