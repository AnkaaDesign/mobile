import React from "react";
import { cssInterop } from "nativewind";
import { getTablerIcon } from "@/utils";
import { useTheme } from "@/lib/theme";
import { getIconSize, IconSize } from "@/constants/icon-sizes";
import { getIconColor } from "@/constants/icon-colors";

// Import the specific icons we need (expanded set to cover most used icons)
import {
  IconDashboard,
  IconMenu2,
  IconHome,
  IconChevronRight,
  IconChevronLeft,
  IconChevronDown,
  IconChevronUp,
  IconArrowLeft,
  IconArrowRight,
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
  IconClipboardCheck,
  IconTool,
  IconPalette,
  IconBriefcase,
  IconShield,
  IconCircleCheck,
  IconCircleX,
  IconAlertCircle,
  IconInfoCircle,
  IconAlertTriangle,
  IconArrowsSort,
  IconArrowUp,
  IconArrowDown,
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
  IconPlayerStop,
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
  IconArrowsUpDown,
  IconApi,
  IconFlask,
  IconCalculator,
  IconReceipt,
  IconFileText,
  IconUserCog,
  IconFolderShare,
  IconDatabaseImport,
  IconColorSwatch,
  IconListDetails,
  IconBeach,
  IconCalendarMinus,
  IconCalendarTime,
  IconHelmet,
  IconBuildingBank,
  IconFileReport,
  IconListSearch,
  IconDroplet,
  IconQuestionMark,
  IconCircle,
  IconPhotoPlus,
  IconFlipHorizontal,
  IconCalendarStats,
  IconCalendarWeek,
  IconCalendarDollar,
  IconDeviceIpadDollar,
  IconFingerprint,
  IconColorPicker,
  IconPaint,
  IconCoins,
  IconRepeat,
  IconHourglass,
  IconFileInvoice,
  IconBuildingSkyscraper,
  IconTag,
  IconShoppingCart,
  IconServer2,
  IconCpu,
  IconBellRinging2,
  IconDeviceMobile,
  IconBrandWhatsapp,
  IconRotateClockwise,
  IconCamera,
  IconMessageCircle,
  IconCertificate,
  IconBarcode,
  IconCategory,
  IconCake,
  IconBuildingCommunity,
  IconMailbox,
  IconShieldOff,
  IconArrowBarToUp,
  IconHanger,
  IconShirt,
  IconShoe,
  IconUmbrella,
  IconMask,
  IconHandGrab,
  IconCreditCard,
  IconScale,
} from "@tabler/icons-react-native";

// Apply cssInterop to all Tabler icons to support className prop
const tablerIcons = [
  IconDashboard, IconMenu2, IconHome, IconChevronRight, IconChevronLeft, IconChevronDown, IconChevronUp,
  IconArrowLeft, IconArrowRight, IconEye, IconEyeOff, IconEdit, IconPlus, IconX, IconCheck, IconTrash,
  IconRefresh, IconSearch, IconFilter, IconSettings, IconLogout, IconPackage, IconPackages, IconUsers,
  IconUser, IconBuilding, IconBuildingFactory2, IconBuildingWarehouse, IconBrush, IconTags, IconCalendar,
  IconClock, IconHistory, IconClipboard, IconClipboardCheck, IconTool, IconPalette, IconBriefcase, IconShield, IconCircleCheck,
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
  IconPlayerStop, IconArrowsUpDown, IconApi, IconFlask, IconCalculator, IconReceipt, IconFileText, IconUserCog,
  IconFolderShare, IconDatabaseImport, IconColorSwatch, IconListDetails, IconBeach, IconCalendarMinus,
  IconCalendarTime, IconHelmet, IconBuildingBank, IconFileReport, IconListSearch, IconDroplet, IconQuestionMark,
  IconCircle, IconPhotoPlus, IconFlipHorizontal, IconCalendarStats, IconCalendarWeek, IconCalendarDollar,
  IconDeviceIpadDollar, IconFingerprint, IconColorPicker, IconPaint, IconCoins, IconRepeat, IconHourglass,
  IconFileInvoice, IconBuildingSkyscraper, IconTag, IconShoppingCart, IconServer2, IconCpu,
  IconBellRinging2, IconDeviceMobile, IconBrandWhatsapp, IconRotateClockwise, IconCamera,
  IconMessageCircle, IconCertificate, IconBarcode, IconCategory, IconCake, IconBuildingCommunity,
  IconMailbox, IconShieldOff, IconArrowBarToUp, IconHanger, IconShirt, IconShoe, IconUmbrella,
  IconMask, IconHandGrab, IconCreditCard, IconScale
];

// Log any undefined icons for debugging
if (__DEV__) {
  const undefinedIcons = tablerIcons.filter((icon, index) => icon === undefined);
  if (undefinedIcons.length > 0) {
    console.warn(`[Icon] Found ${undefinedIcons.length} undefined icon(s) in tablerIcons array`);
  }
}

// Filter out undefined icons and apply cssInterop
tablerIcons.filter(icon => icon !== undefined).forEach(icon => {
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
  "trash-2": IconTrash,
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
  "clipboard-check": IconClipboardCheck,
  clipboardCheck: IconClipboardCheck, // camelCase version
  task: IconClipboardCheck, // Alias for task
  tool: IconTool,
  palette: IconPalette,
  briefcase: IconBriefcase,
  shield: IconShield,
  admin: IconShield, // Admin maps to shield
  hr: IconUsers, // HR maps to users

  // Status indicators
  "circle-check": IconCircleCheck,
  "check-circle": IconCircleCheck, // Alias (lucide-style)
  "circle-x": IconCircleX,
  "x-circle": IconCircleX, // Alias (lucide-style)
  "alert-circle": IconAlertCircle,
  "info-circle": IconInfoCircle,
  "alert-triangle": IconAlertTriangle,
  alertTriangle: IconAlertTriangle, // camelCase version
  "help-circle": IconAlertCircle, // Alias for help/unknown status

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
  folders: IconFolder, // Alias (singular fallback)
  id: IconId,
  "user-check": IconUserCheck,
  qrcode: IconQrcode,
  "player-play": IconPlayerPlay,
  play: IconPlayerPlay, // Alias
  "play-circle": IconPlayerPlay, // Alias (lucide-style)
  "player-pause": IconPlayerPause,
  pause: IconPlayerPause, // Alias
  "pause-circle": IconPlayerPause, // Alias (lucide-style)
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
  message: IconMessageCircle,
  "message-circle": IconMessageCircle,

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
  "hard-drive": IconServer2,
  "device-hard-drive": IconServer2,
  hardDrive: IconServer2, // camelCase version
  cpu: IconCpu,
  processor: IconCpu, // Alias

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
  square: IconPlayerStop, // Alias (lucide-style stop)

  // New icon mappings for missing icons
  "arrows-up-down": IconArrowsUpDown,
  movement: IconArrowsUpDown, // Alias for movement
  api: IconApi,
  flask: IconFlask,
  beaker: IconFlask, // Alias
  calculator: IconCalculator,
  formula: IconCalculator, // Alias
  receipt: IconReceipt,
  payroll: IconReceipt, // Alias
  "file-text": IconFileText,
  "system-logs": IconFileText, // Alias
  "user-cog": IconUserCog,
  "system-users": IconUserCog, // Alias
  "folder-share": IconFolderShare,
  "shared-folders": IconFolderShare, // Alias
  "database-import": IconDatabaseImport,
  "color-swatch": IconColorSwatch,
  color: IconColorSwatch, // Alias
  "list-details": IconListDetails,
  log: IconListDetails, // Alias
  beach: IconBeach,
  vacation: IconBeach, // Alias
  "calendar-minus": IconCalendarMinus,
  "time-off": IconCalendarMinus, // Alias
  "calendar-time": IconCalendarTime,
  helmet: IconHelmet,
  "hard-hat": IconHelmet, // Alias
  "building-bank": IconBuildingBank,
  sector: IconBuildingBank, // Alias
  "file-report": IconFileReport,
  report: IconFileReport, // Alias
  "list-search": IconListSearch,
  inspection: IconListSearch, // Alias
  droplet: IconDroplet,
  "question-mark": IconQuestionMark,
  question: IconQuestionMark, // Alias
  help: IconQuestionMark, // Alias
  circle: IconCircle,
  radio: IconCircle, // Alias
  "photo-plus": IconPhotoPlus,
  image: IconPhotoPlus, // Alias
  camera: IconCamera,
  "camera-plus": IconCamera, // Alias
  "flip-horizontal": IconFlipHorizontal,
  mirror: IconFlipHorizontal, // Alias

  // Common aliases used in navigation
  cog: IconSettings, // Alias for settings
  auditLog: IconList, // Alias
  "audit-log": IconList, // kebab-case version
  entity: IconDatabase, // Alias
  catalog: IconBook, // Alias
  borrowing: IconArrowsExchange, // Alias
  schedule: IconCalendarPlus, // Alias
  maintenance: IconTools, // Alias
  automation: IconBolt, // Alias
  brand: IconBadge, // Alias
  external: IconSend, // Alias
  team: IconUsers, // Alias
  warning: IconAlertTriangle, // Alias
  safety: IconShieldCheck, // Alias
  cutting: IconScissors, // Alias
  userCircle: IconUserCircle, // camelCase version
  announcement: IconSpeakerphone, // Alias
  notification: IconBellRinging, // Alias
  paintBrush: IconBrush, // camelCase version
  dollarSign: IconCurrencyDollar, // camelCase version
  trendingUp: IconTrendingUp, // camelCase version
  trendingDown: IconTrendingDown, // camelCase version
  systemMetrics: IconChartLine, // Alias
  "system-metrics": IconChartLine, // kebab-case version
  systemLogs: IconFileText, // camelCase version
  services: IconSettings, // Alias
  systemUsers: IconUserCog, // camelCase version
  sharedFolders: IconFolderShare, // camelCase version
  databaseImport: IconDatabaseImport, // camelCase version
  clipboardList: IconClipboardList, // camelCase version

  // Calendar variants
  "calendar-stats": IconCalendarStats,
  calendarStats: IconCalendarStats, // camelCase version
  "calendar-week": IconCalendarWeek,
  calendarWeek: IconCalendarWeek, // camelCase version
  "calendar-dollar": IconCalendarDollar,
  calendarDollar: IconCalendarDollar, // camelCase version

  // Device and biometric icons
  "device-ipad-dollar": IconDeviceIpadDollar,
  deviceIpadDollar: IconDeviceIpadDollar, // camelCase version
  fingerprint: IconFingerprint,

  // Paint icons
  "color-picker": IconColorPicker,
  colorPicker: IconColorPicker, // camelCase version
  paint: IconPaint,

  // Financial icons
  coins: IconCoins,
  "file-invoice": IconFileInvoice,
  fileInvoice: IconFileInvoice, // camelCase version

  // Other icons
  repeat: IconRepeat,
  loan: IconArrowsExchange, // loan maps to arrows exchange
  hourglass: IconHourglass,
  "building-skyscraper": IconBuildingSkyscraper,
  buildingSkyscraper: IconBuildingSkyscraper, // camelCase version
  tag: IconTag,
  "shopping-cart": IconShoppingCart,
  shoppingCart: IconShoppingCart, // camelCase version

  // Additional icons for notifications and devices
  "bell-dot": IconBellRinging2, // bell-dot maps to bell-ringing-2
  bellDot: IconBellRinging2, // camelCase version
  "bell-ringing-2": IconBellRinging2,
  "device-mobile": IconDeviceMobile,
  deviceMobile: IconDeviceMobile, // camelCase version
  mobile: IconDeviceMobile, // Alias
  "brand-whatsapp": IconBrandWhatsapp,
  brandWhatsapp: IconBrandWhatsapp, // camelCase version
  whatsapp: IconBrandWhatsapp, // Alias
  certificate: IconCertificate,
  barcode: IconBarcode,
  category: IconCategory,
  cake: IconCake,
  birthday: IconCake, // Alias
  "building-community": IconBuildingCommunity,
  buildingCommunity: IconBuildingCommunity, // camelCase version
  neighborhood: IconBuildingCommunity, // Alias
  mailbox: IconMailbox,
  "shield-off": IconShieldOff,
  shieldOff: IconShieldOff, // camelCase version
  "arrow-bar-to-up": IconArrowBarToUp,
  arrowBarToUp: IconArrowBarToUp, // camelCase version
  hanger: IconHanger,
  shirt: IconShirt,
  shoe: IconShoe,
  umbrella: IconUmbrella,
  mask: IconMask,
  "hand-grab": IconHandGrab,
  handGrab: IconHandGrab, // camelCase version
  "credit-card": IconCreditCard,
  creditCard: IconCreditCard, // camelCase version
  scale: IconScale,
  weight: IconScale, // Alias
  "rotate-clockwise": IconRotateClockwise,
  rotateClockwise: IconRotateClockwise, // camelCase version
  "rotate-cw": IconRotateClockwise, // Alias (lucide-style)
  sync: IconRotateClockwise, // Alias
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

export function Icon({ name, size = "md", color, variant = "default", className, testID, accessibilityLabel, accessible = true }: IconProps) {
  const { colors } = useTheme();

  // Ensure name is a valid string
  if (!name || typeof name !== 'string') {
    console.warn('Icon component received invalid name:', name);
    return null;
  }

  // Get size
  const iconSize = typeof size === "number" ? size : getIconSize(size);

  // Get color (fixed parameter order!)
  const iconColor = color || getIconColor(colors, variant);

  // Helper function to convert "IconHome" to "home"
  const convertIconNameToKebab = (iconName: string | undefined | null): string => {
    // Early return if iconName is not valid
    if (!iconName || typeof iconName !== 'string') {
      return '';
    }

    if (iconName.startsWith("Icon")) {
      // Convert "IconHome" to "home", "IconChevronRight" to "chevron-right"
      return iconName
        .replace(/^Icon/, "") // Remove "Icon" prefix
        .replace(/([A-Z])/g, (_match, p1, offset) => (offset > 0 ? `-${p1.toLowerCase()}` : p1.toLowerCase())); // Convert CamelCase to kebab-case
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
