import React from "react";
import { cssInterop } from "nativewind";
import { getTablerIcon } from '../../utils';
import { useTheme } from "@/lib/theme";
import { getIconSize, type IconSize } from "@/constants/icon-sizes";
import { getIconColor } from "@/constants/icon-colors";
import { cn } from "@/lib/utils";

// Import the specific icons we need (expanded set to cover most used icons)
import {
  // Navigation & UI
  IconDashboard,
  IconMenu2,
  IconHome,
  IconChevronRight,
  IconChevronLeft,
  IconChevronDown,
  IconChevronUp,
  IconArrowLeft,
  IconArrowRight,

  // Common actions
  IconEye,
  IconEyeOff,
  IconEdit,
  IconPlus,
  IconX,
  IconCheck,
  IconTrash,
  IconRefresh,
  IconSearch,
  IconFilter,
  IconSettings,
  IconLogout,

  // Business domain
  IconPackage,
  IconPackages,
  IconUsers,
  IconUser,
  IconBuilding,
  IconBuildingFactory2,
  IconBuildingWarehouse,
  IconBrush,
  IconTags,
  IconCalendar,
  IconClock,
  IconHistory,
  IconClipboard,
  IconTool,
  IconPalette,
  IconBriefcase,
  IconShield,

  // Status indicators
  IconCircleCheck,
  IconCircleX,
  IconAlertCircle,
  IconInfoCircle,
  IconAlertTriangle,
  IconArrowsSort,
  IconArrowUp,
  IconArrowDown,

  // Additional commonly used icons from analysis
  IconArchive,
  IconArchiveOff,
  IconToggleLeft,
  IconToggleRight,
  IconLayoutList,
  IconLayout,
  IconBrandApple,
  IconAward,
  IconFolder,
  IconId,
  IconUserCheck,
  IconQrcode,
  IconPlayerPlay,
  IconPlayerPause,
  IconChartBar,
  IconChartLine,
  IconBox,
  IconUserCircle,
  IconMail,
  IconPhone,
  IconMapPin,
  IconCurrencyDollar,
  IconPercentage,
  IconHash,
  IconFiles,
  IconFile,
  IconDownload,
  IconUpload,
  IconPrinter,
  IconCopy,
  IconDeviceFloppy,
  IconStar,
  IconHeart,
  IconBookmark,
  IconLink,
  IconExternalLink,
  IconLock,
  IconLockOpen,
  IconKey,
  IconDatabase,
  IconServer,
  IconCloud,
  IconWifi,
  IconBell,
  IconBellOff,
  IconMoon,
  IconSun,
  IconAdjustments,
  IconPuzzle,
  IconBulb,
  IconFlame,
  IconBolt,
  IconTarget,
  IconFlag,
  IconPin,
  IconGlobe,
  IconWorld,
  IconLocation,
  IconRocket,
  IconTrendingUp,
  IconTrendingDown,
  IconActivity,
  IconScissors,
  IconNote,
  IconClipboardList,
  IconTools,
  IconSend,
  IconArrowsExchange,
  IconBook,
  IconList,
  IconBellRinging,
  IconSpeakerphone,
  IconShieldCheck,
  IconTruck,
  IconRuler,
  IconCalendarPlus,
  IconFolderX,
  IconBadge,
  IconCalendarEvent,

  // Additional missing icons
  IconPlayerStop,
} from "@tabler/icons-react-native";

// Apply cssInterop to all Tabler icons to support className prop
const tablerIcons = [
  IconDashboard, IconMenu2, IconHome, IconChevronRight, IconChevronLeft, IconChevronDown, IconChevronUp,
  IconArrowLeft, IconArrowRight, IconEye, IconEyeOff, IconEdit, IconPlus, IconX, IconCheck, IconTrash,
  IconRefresh, IconSearch, IconFilter, IconSettings, IconLogout, IconPackage, IconPackages, IconUsers,
  IconUser, IconBuilding, IconBuildingFactory2, IconBuildingWarehouse, IconBrush, IconTags, IconCalendar,
  IconClock, IconHistory, IconClipboard, IconTool, IconPalette, IconBriefcase, IconShield, IconCircleCheck,
  IconCircleX, IconAlertCircle, IconInfoCircle, IconAlertTriangle, IconArrowsSort, IconArrowUp, IconArrowDown,
  IconArchive, IconArchiveOff, IconToggleLeft, IconToggleRight, IconLayoutList, IconLayout, IconBrandApple,
  IconAward, IconFolder, IconId, IconUserCheck, IconQrcode, IconPlayerPlay, IconPlayerPause, IconChartBar,
  IconChartLine, IconBox, IconUserCircle, IconMail, IconPhone, IconMapPin, IconCurrencyDollar, IconPercentage,
  IconHash, IconFiles, IconFile, IconDownload, IconUpload, IconPrinter, IconCopy, IconDeviceFloppy,
  IconStar, IconHeart, IconBookmark, IconLink, IconExternalLink, IconLock, IconLockOpen, IconKey,
  IconDatabase, IconServer, IconCloud, IconWifi, IconBell, IconBellOff, IconMoon, IconSun, IconAdjustments,
  IconPuzzle, IconBulb, IconFlame, IconBolt, IconTarget, IconFlag, IconPin, IconGlobe, IconWorld,
  IconLocation, IconRocket, IconTrendingUp, IconTrendingDown, IconActivity, IconScissors,
  IconNote, IconClipboardList, IconTools, IconSend, IconArrowsExchange, IconBook, IconList, IconBellRinging,
  IconSpeakerphone, IconShieldCheck, IconTruck, IconRuler, IconCalendarPlus, IconFolderX, IconBadge, IconCalendarEvent,
  IconPlayerStop
];

tablerIcons.forEach(icon => {
  cssInterop(icon, {
    className: {
      target: "style",
      nativeStyleToProp: {
        color: true,
        opacity: true,
      },
    },
  });
});

// Comprehensive mapping from icon names to components
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  // Core navigation
  dashboard: IconDashboard,
  menu: IconMenu2,
  home: IconHome,
  "chevron-right": IconChevronRight,
  "chevron-left": IconChevronLeft,
  "chevron-down": IconChevronDown,
  "chevron-up": IconChevronUp,
  "arrow-left": IconArrowLeft,
  "arrow-right": IconArrowRight,

  // Actions
  eye: IconEye,
  "eye-off": IconEyeOff,
  edit: IconEdit,
  plus: IconPlus,
  x: IconX,
  check: IconCheck,
  trash: IconTrash,
  refresh: IconRefresh,
  search: IconSearch,
  filter: IconFilter,
  settings: IconSettings,
  logout: IconLogout,

  // Business domain
  package: IconPackage,
  packages: IconPackages,
  inventory: IconPackages, // Maps to packages for inventory
  users: IconUsers,
  user: IconUser,
  building: IconBuilding,
  "building-factory-2": IconBuildingFactory2,
  "building-warehouse": IconBuildingWarehouse,
  factory: IconBuildingFactory2, // Factory maps to building-factory-2
  production: IconBuildingFactory2, // Production maps to factory
  warehouse: IconBuildingWarehouse,
  brush: IconBrush,
  "paint-brush": IconBrush, // paintBrush maps to brush
  painting: IconBrush, // Painting maps to brush
  tags: IconTags,
  calendar: IconCalendar,
  clock: IconClock,
  history: IconHistory,
  clipboard: IconClipboard,
  tool: IconTool,
  palette: IconPalette,
  briefcase: IconBriefcase,
  shield: IconShield,
  admin: IconShield, // Admin maps to shield
  hr: IconUsers, // HR maps to users

  // Status indicators
  "circle-check": IconCircleCheck,
  "circle-x": IconCircleX,
  "alert-circle": IconAlertCircle,
  "info-circle": IconInfoCircle,
  "alert-triangle": IconAlertTriangle,
  alertTriangle: IconAlertTriangle, // camelCase version

  // Sorting and arrows
  "arrows-sort": IconArrowsSort,
  "sort-ascending": IconArrowUp,
  "sort-descending": IconArrowDown,
  "arrow-up": IconArrowUp,
  "arrow-down": IconArrowDown,

  // Recently added missing icons (from fallback analysis)
  archive: IconArchive,
  "archive-off": IconArchiveOff,
  "toggle-left": IconToggleLeft,
  "toggle-right": IconToggleRight,
  "layout-list": IconLayoutList,
  layout: IconLayout,
  "brand-apple": IconBrandApple,
  award: IconAward,
  folder: IconFolder,
  id: IconId,
  "user-check": IconUserCheck,
  qrcode: IconQrcode,
  "player-play": IconPlayerPlay,
  play: IconPlayerPlay, // Alias
  "player-pause": IconPlayerPause,
  pause: IconPlayerPause, // Alias
  "chart-bar": IconChartBar,
  "bar-chart": IconChartBar, // Alias
  "chart-line": IconChartLine,
  analytics: IconChartLine, // Alias
  box: IconBox,
  "user-circle": IconUserCircle,

  // Communication
  mail: IconMail,
  phone: IconPhone,
  "map-pin": IconMapPin,

  // Financial
  "currency-dollar": IconCurrencyDollar,
  percentage: IconPercentage,
  hash: IconHash,

  // Files
  files: IconFiles,
  file: IconFile,
  download: IconDownload,
  upload: IconUpload,
  printer: IconPrinter,
  copy: IconCopy,
  "device-floppy": IconDeviceFloppy,
  save: IconDeviceFloppy, // Alias

  // Favorites and bookmarks
  star: IconStar,
  heart: IconHeart,
  bookmark: IconBookmark,

  // Links
  link: IconLink,
  "external-link": IconExternalLink,

  // Security
  lock: IconLock,
  "lock-open": IconLockOpen,
  key: IconKey,

  // Technology
  database: IconDatabase,
  server: IconServer,
  cloud: IconCloud,
  wifi: IconWifi,

  // Notifications
  bell: IconBell,
  "bell-off": IconBellOff,

  // Theme
  moon: IconMoon,
  sun: IconSun,

  // Controls
  adjustments: IconAdjustments,
  sliders: IconAdjustments,

  // Miscellaneous
  puzzle: IconPuzzle,
  bulb: IconBulb,
  flame: IconFlame,
  zap: IconBolt,
  bolt: IconBolt,
  target: IconTarget,
  flag: IconFlag,
  pin: IconPin,
  globe: IconGlobe,
  world: IconWorld,
  location: IconLocation,
  rocket: IconRocket,
  "trending-up": IconTrendingUp,
  "trending-down": IconTrendingDown,
  activity: IconActivity,
  pulse: IconActivity,

  // Recently reported missing icons
  scissors: IconScissors,
  note: IconNote,
  "clipboard-list": IconClipboardList,
  tools: IconTools,
  send: IconSend,
  "arrows-exchange": IconArrowsExchange,
  book: IconBook,
  list: IconList,
  "bell-ringing": IconBellRinging,
  speakerphone: IconSpeakerphone,
  "shield-check": IconShieldCheck,
  truck: IconTruck,
  ruler: IconRuler,
  "calendar-plus": IconCalendarPlus,
  "folder-x": IconFolderX,
  badge: IconBadge,
  "calendar-event": IconCalendarEvent,

  // Additional missing icons
  "player-stop": IconPlayerStop,
  stop: IconPlayerStop, // Alias
};

interface IconProps {
  name: string;
  size?: IconSize | number;
  color?: string;
  variant?: "default" | "primary" | "secondary" | "muted" | "success" | "warning" | "error" | "info" | "navigation" | "navigationActive" | "onPrimary";
  opacity?: number;
  className?: string;
  testID?: string;
  accessibilityLabel?: string;
  accessible?: boolean;
}

export function Icon({ name, size = "md", color, variant = "default", opacity, className, testID, accessibilityLabel, accessible = true }: IconProps) {
  const { colors } = useTheme();

  // Get size
  const iconSize = typeof size === "number" ? size : getIconSize(size);

  // Get color (fixed parameter order!)
  const iconColor = color || getIconColor(colors, variant);

  // Helper function to convert "IconHome" to "home"
  const convertIconNameToKebab = (iconName: string): string => {
    if (iconName.startsWith("Icon")) {
      // Convert "IconHome" to "home", "IconChevronRight" to "chevron-right"
      return iconName
        .replace(/^Icon/, "") // Remove "Icon" prefix
        .replace(/([A-Z])/g, (match, p1, offset) => (offset > 0 ? `-${p1.toLowerCase()}` : p1.toLowerCase())); // Convert CamelCase to kebab-case
    }
    return iconName;
  };

  // Try direct mapping first
  let IconComponent = ICON_MAP[name as keyof typeof ICON_MAP];

  // If not found, try converting from Icon-style name to kebab-case
  if (!IconComponent) {
    const kebabName = convertIconNameToKebab(name);
    IconComponent = ICON_MAP[kebabName as keyof typeof ICON_MAP];
  }

  // If not found, try the utils mapping
  if (!IconComponent) {
    const mappedName = getTablerIcon(name);
    const kebabMappedName = convertIconNameToKebab(mappedName);
    IconComponent = ICON_MAP[kebabMappedName as keyof typeof ICON_MAP];
  }

  // If still not found, try some common transformations
  if (!IconComponent) {
    // Try converting kebab-case to camelCase
    const camelName = name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    IconComponent = ICON_MAP[camelName as keyof typeof ICON_MAP];
  }

  // Render the icon if found
  if (IconComponent) {
    return (
      <IconComponent
        size={iconSize}
        color={iconColor}
        className={className}
        testID={testID}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel || `${name} icon`}
        accessibilityRole="image"
      />
    );
  }

  // Fallback to menu icon if nothing found
  console.warn(`Icon "${name}" not found, falling back to menu`);
  return (
    <IconMenu2
      size={iconSize}
      color={iconColor}
      className={className}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || `${name} icon (fallback)`}
      accessibilityRole="image"
    />
  );
}

export default Icon;
