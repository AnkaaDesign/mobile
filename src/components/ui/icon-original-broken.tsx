import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getTablerIcon } from '../../utils/navigation';
import { useTheme } from "@/lib/theme";
import { getIconSize, type IconSize } from "@/constants/icon-sizes";
import { getIconColor } from "@/constants/icon-colors";

// Type-safe wrapper for icon props
interface SafeIconProps {
  size?: number;
  color?: string;
  stroke?: number;
  [key: string]: any;
}

// Import all the icons we need individually
import {
  IconDashboard,
  IconBuilding,
  IconPackage,
  IconBrush,
  IconUsers,
  IconSettings,
  IconUserCircle,
  IconChartBar,
  IconUser,
  IconMenu2,
  IconClock,
  IconClipboardList,
  IconCirclePlus,
  IconEdit,
  IconEye,
  IconPlayerPause,
  IconHistory,
  IconCircleCheck,
  IconCircleX,
  IconScissors,
  IconClipboard,
  IconBuildingWarehouse,
  IconCurrencyDollar,
  IconTool,
  IconNote,
  IconBox,
  IconSearch,
  IconTags,
  IconCalendarPlus,
  IconBolt as IconZap,
  IconTools,
  IconSend,
  IconShield,
  IconTruck,
  IconArrowsExchange,
  IconPalette,
  IconBook,
  IconCoins,
  IconCalendar,
  IconShieldCheck,
  IconSpeakerphone,
  IconBellRinging,
  IconChevronRight,
  IconBriefcase,
  IconBeach,
  IconAlertTriangle,
  IconChartPie,
  IconChartLine,
  IconChartArea,
  IconTrendingUp,
  IconCalculator,
  IconActivity,
  IconArrowsUpDown,
  IconHelmet,
  IconFlask,
  // IconFlask2 doesn't exist, using IconFlask
  IconDroplet,
  IconColorSwatch,
  IconColorPicker,
  IconUserCheck,
  IconBuildingBank,
  IconBadge,
  IconCalendarEvent,
  IconCalendarMinus,
  IconBell,
  IconUserPlus,
  IconList,
  IconListDetails,
  IconDeviceDesktop,
  IconFolders,
  IconFileText,
  IconArchive,
  IconAlertCircle,
  IconLock,
  IconChevronDown,
  IconChevronLeft,
  IconChevronUp,
  IconRuler,
  IconRuler2,
  IconArrowLeft,
  IconArrowRight,
  // IconArrowBack doesn't exist, using IconArrowLeft
  IconLogout,
  IconLogin,
  IconKey,
  IconRefresh,
  IconHome,
  IconMapPin,
  IconPhone,
  IconMail,
  IconUserCog,
  IconFileReport,
  IconPrinter,
  IconDots,
  IconMaximize,
  IconPhoto,
  IconVideo,
  IconClockHour4,
  IconShare,
  IconArrowDown,
  IconMinus,
  IconArrowUp,
  IconCheck,
  IconX,
  IconCircle,
  IconLoader,
  IconTrendingDown,
  IconInfoCircle,
  IconHelp,
  IconQuestionMark,
  IconEyeOff,
  IconFilter,
  IconArrowsSort,
  IconDownload,
  IconUpload,
  IconFileImport,
  IconFileExport,
  IconId,
  IconUserX,
  IconFolderX,
  IconPuzzle,
  IconDatabase,
  IconExternalLink,
  IconBolt,
  IconTarget,
  IconShoppingCart,
  IconPlayerPlay,
  IconPlayerStop,
  IconClockPlay,
  // IconWrench doesn't exist, using IconTool
  IconClipboardCheck,
  IconHelpCircle,
  IconArrowsLeftRight,
  IconArrowsVertical,
  IconGift,
  IconTree as IconPalmTree,
  IconTrash,
  IconPlus,
  IconFolder,
  IconAward,
  IconFile,
  IconBuildingFactory2 as IconTractor,
  IconClockPlay as IconClockPlayExtra,
  IconClipboardCheck as IconClipboardCheckExtra,
  // IconFileDocument doesn't exist, using IconFileText
  IconNotebook,
  IconBuildingFactory2,
} from "@tabler/icons-react-native";

interface IconProps {
  name: string;
  size?: IconSize;
  color?: string;
  variant?: "default" | "primary" | "secondary" | "muted" | "success" | "warning" | "error" | "info";
  opacity?: number;
  testID?: string;
  accessibilityLabel?: string;
  accessible?: boolean;
}

// Create a mapping of icon names to actual imported components
const TABLER_ICON_COMPONENTS: Record<string, React.ComponentType<any>> = {
  IconDashboard,
  IconBuilding,
  IconPackage,
  IconBrush,
  IconUsers,
  IconSettings,
  IconUserCircle,
  IconChartBar,
  IconUser,
  IconMenu2,
  IconClock,
  IconClipboardList,
  IconCirclePlus,
  IconEdit,
  IconEye,
  IconPlayerPause,
  IconHistory,
  IconCircleCheck,
  IconCircleX,
  IconScissors,
  IconClipboard,
  IconBuildingWarehouse,
  IconCurrencyDollar,
  IconTool,
  IconNote,
  IconBox,
  IconSearch,
  IconTags,
  IconBadge,
  IconCalendarPlus,
  IconZap,
  IconTools,
  IconSend,
  IconShield,
  IconTruck,
  IconArrowsExchange,
  IconPalette,
  IconBook,
  IconCoins,
  IconCalendar,
  IconShieldCheck,
  IconSpeakerphone,
  IconBellRinging,
  IconChevronRight,
  IconBriefcase,
  IconBeach,
  IconAlertTriangle,
  IconChartPie,
  IconChartLine,
  IconChartArea,
  IconTrendingUp,
  IconCalculator,
  IconActivity,
  IconArrowsUpDown,
  IconHelmet,
  IconFlask,
  // IconFlask2 doesn't exist, using IconFlask
  IconDroplet,
  IconColorSwatch,
  IconColorPicker,
  IconUserCheck,
  IconBuildingBank,
  IconCalendarEvent,
  IconCalendarMinus,
  IconBell,
  IconUserPlus,
  IconList,
  IconListDetails,
  IconDeviceDesktop,
  IconFolders,
  IconFileText,
  IconArchive,
  IconAlertCircle,
  IconLock,
  IconChevronDown,
  IconChevronLeft,
  IconChevronUp,
  IconRuler,
  IconRuler2,
  IconArrowLeft,
  IconArrowRight,
  // IconArrowBack doesn't exist, using IconArrowLeft
  IconLogout,
  IconLogin,
  IconKey,
  IconRefresh,
  IconHome,
  IconMapPin,
  IconPhone,
  IconMail,
  IconUserCog,
  IconFileReport,
  IconPrinter,
  IconDots,
  IconMaximize,
  IconPhoto,
  IconVideo,
  IconClockHour4,
  IconShare,
  IconArrowDown,
  IconMinus,
  IconArrowUp,
  IconCheck,
  IconX,
  IconCircle,
  IconLoader,
  IconTrendingDown,
  IconInfoCircle,
  IconHelp,
  IconQuestionMark,
  IconEyeOff,
  IconFilter,
  IconArrowsSort,
  IconDownload,
  IconUpload,
  IconFileImport,
  IconFileExport,
  IconId,
  IconUserX,
  IconFolderX,
  IconPuzzle,
  IconDatabase,
  IconExternalLink,
  IconBolt,
  IconTarget,
  IconShoppingCart,
  IconPlayerPlay,
  IconPlayerStop,
  IconClockPlay,
  // IconWrench doesn't exist, using IconTool
  IconClipboardCheck,
  IconHelpCircle,
  IconArrowsLeftRight,
  IconArrowsVertical,
  IconGift,
  IconPalmTree,
  IconTrash,
  IconPlus,
  IconFolder,
  IconAward,
  IconFile,
  IconBuildingFactory2,
  IconTractor,
  // IconFileDocument doesn't exist, using IconFileText
  IconNotebook,
};

// Updated icon mappings that match actual @tabler/icons-react-native icon names
const TABLER_ICON_MAPPINGS = {
  // Main navigation icons - verified tabler names
  dashboard: "IconDashboard",
  factory: "IconBuilding",
  package: "IconPackage",
  paintBrush: "IconBrush",
  users: "IconUsers",
  cog: "IconSettings",
  userCircle: "IconUserCircle",
  barChart: "IconChartBar",
  settings: "IconSettings",
  profile: "IconUser",
  menu: "IconMenu2",
  timeTracking: "IconClock",

  // Additional icon mapping for navigation
  IconBuilding: "IconBuilding",
  IconDashboard: "IconDashboard",
  IconClipboardList: "IconClipboardList",
  IconCirclePlus: "IconCirclePlus",
  IconEdit: "IconEdit",
  IconEye: "IconEye",
  IconClock: "IconClock",
  IconPlayerPause: "IconPlayerPause",
  IconHistory: "IconHistory",
  IconCircleCheck: "IconCircleCheck",
  IconCircleX: "IconCircleX",
  IconScissors: "IconScissors",
  IconClipboard: "IconClipboard",
  IconBuildingWarehouse: "IconBuildingWarehouse",
  IconCurrencyDollar: "IconCurrencyDollar",
  IconTool: "IconTool",
  IconNote: "IconNote",
  IconBox: "IconBox",
  IconSearch: "IconSearch",
  IconPackage: "IconPackage",
  IconTags: "IconTags",
  IconBadgeCheck: "IconBadgeCheck",
  IconUsers: "IconUsers",
  IconCalendarPlus: "IconCalendarPlus",
  IconZap: "IconBolt",
  IconTools: "IconTools",
  IconSend: "IconSend",
  IconShield: "IconShield",
  IconTruck: "IconTruck",
  IconArrowsExchange: "IconArrowsExchange",
  IconPalette: "IconPalette",
  IconBook: "IconBook",
  IconSettings: "IconSettings",
  IconUserCircle: "IconUserCircle",
  IconChartBar: "IconChartBar",
  IconCoins: "IconCoins",
  IconCalendar: "IconCalendar",
  IconShieldCheck: "IconShieldCheck",
  IconSpeakerphone: "IconSpeakerphone",
  IconBellRinging: "IconBellRinging",
  IconChevronRight: "IconChevronRight",
  IconBriefcase: "IconBriefcase",
  IconBeach: "IconBeach",
  IconAlertTriangle: "IconAlertTriangle",
  IconChartPie: "IconChartPie",
  IconChartLine: "IconChartLine",
  IconChartArea: "IconChartArea",
  IconTrendingUp: "IconTrendingUp",
  IconCalculator: "IconCalculator",
  IconActivity: "IconActivity",
  IconArrowsUpDown: "IconArrowsUpDown",
  IconHelmet: "IconHelmet",
  IconFlask: "IconFlask",
  IconFlask2: "IconFlask",
  IconDroplet: "IconDroplet",
  IconColorSwatch: "IconColorSwatch",
  IconColorPicker: "IconColorPicker",
  IconUser: "IconUser",
  IconUserCheck: "IconUserCheck",
  IconBuildingBank: "IconBuildingBank",
  IconBadge: "IconBadge",
  IconCalendarEvent: "IconCalendarEvent",
  IconCalendarMinus: "IconCalendarMinus",
  IconBell: "IconBell",
  IconUserPlus: "IconUserPlus",
  IconList: "IconList",
  IconListDetails: "IconListDetails",
  IconDeviceDesktop: "IconDeviceDesktop",
  IconFolders: "IconFolders",
  IconFileText: "IconFileText",
  IconArchive: "IconArchive",
  IconAlertCircle: "IconAlertCircle",
  IconLock: "IconLock",
  IconChevronDown: "IconChevronDown",
  IconChevronLeft: "IconChevronLeft",
  IconChevronUp: "IconChevronUp",
  IconRuler: "IconRuler",
  IconRuler2: "IconRuler2",
  IconArrowLeft: "IconArrowLeft",
  IconArrowRight: "IconArrowRight",
  IconArrowBack: "IconArrowLeft",
  IconLogout: "IconLogout",
  IconLogin: "IconLogin",
  IconKey: "IconKey",
  IconRefresh: "IconRefresh",
  IconHome: "IconHome",
  IconMapPin: "IconMapPin",
  IconPhone: "IconPhone",
  IconMail: "IconMail",
  IconUserCog: "IconUserCog",
  IconFileReport: "IconFileReport",
  IconPrinter: "IconPrinter",
  IconDots: "IconDots",
  IconMaximize: "IconMaximize",
  IconPhoto: "IconPhoto",
  IconVideo: "IconVideo",
  IconClockHour4: "IconClockHour4",
  IconShare: "IconShare",
  IconArrowDown: "IconArrowDown",
  IconMinus: "IconMinus",
  IconArrowUp: "IconArrowUp",
  IconCheck: "IconCheck",
  IconX: "IconX",
  IconCircle: "IconCircle",
  IconLoader: "IconLoader",
  IconTrendingDown: "IconTrendingDown",
  IconInfoCircle: "IconInfoCircle",
  IconHelp: "IconHelp",
  IconQuestionMark: "IconQuestionMark",
  IconEyeOff: "IconEyeOff",
  IconFilter: "IconFilter",
  IconArrowsSort: "IconArrowsSort",
  IconDownload: "IconDownload",
  IconUpload: "IconUpload",
  IconFileImport: "IconFileImport",
  IconFileExport: "IconFileExport",
  IconId: "IconId",
  IconUserOff: "IconUserX",
  IconFolderOff: "IconFolderX",
  IconPuzzle: "IconPuzzle",
  IconDatabase: "IconDatabase",
  IconExternalLink: "IconExternalLink",
  IconBolt: "IconBolt",
  IconTractor: "IconBuildingFactory2",
  IconTarget: "IconTarget",
  IconShoppingCart: "IconShoppingCart",
  IconPlayerPlay: "IconPlayerPlay",
  IconPlayerStop: "IconPlayerStop",
  IconClockPlay: "IconClock",
  IconWrench: "IconTool",
  IconClipboardCheck: "IconClipboardCheck",
  IconBrush: "IconBrush",
  IconHelpCircle: "IconHelp",
  IconArrowsLeftRight: "IconArrowsExchange",
  IconArrowsVertical: "IconArrowsUpDown",
  IconGift: "IconGift",
  IconPalmTree: "IconTree",
  IconTrash: "IconTrash",
  IconPlus: "IconPlus",

  // Status and action icons
  play: "IconPlayerPlay",
  pause: "IconPlayerPause",
  check: "IconCheck",
  x: "IconX",
  plus: "IconPlus",
  edit: "IconEdit",
  trash: "IconTrash",
  search: "IconSearch",
  filter: "IconFilter",
  download: "IconDownload",
  upload: "IconUpload",

  // Production icons
  scissors: "IconScissors",
  clipboard: "IconClipboard",
  clipboardList: "IconClipboardList",
  note: "IconNote",
  history: "IconHistory",
  garage: "IconBuildingWarehouse",
  truck: "IconTruck",
  serviceWrench: "IconTool",
  maintenance: "IconTools",

  // Inventory icons
  box: "IconBox",
  suppliers: "IconUsers",
  orders: "IconClipboardCheck",
  calendar: "IconCalendar",
  automation: "IconBolt",
  external: "IconExternalLink",
  shield: "IconShieldCheck",
  borrowing: "IconArrowsLeftRight",

  // Paint icons
  palette: "IconPalette",
  droplet: "IconDroplet",
  beaker: "IconFlask",
  formula: "IconCalculator",

  // HR icons
  user: "IconUser",
  building: "IconBuilding",
  briefcase: "IconBriefcase",
  vacation: "IconCalendar",
  holiday: "IconCalendar",
  warning: "IconAlertTriangle",
  dollarSign: "IconCurrencyDollar",

  // Personal icons
  myTasks: "IconList",
  myCommissions: "IconCoins",
  myVacations: "IconCalendar",
  myBorrows: "IconPackage",
  myPpes: "IconShieldCheck",
  myNotifications: "IconBell",

  // Admin icons
  customers: "IconUsers",
  files: "IconFolder",
  auditLog: "IconList",
  bell: "IconBell",

  // Common actions
  chevronRight: "IconChevronRight",
  chevronLeft: "IconChevronLeft",
  chevronDown: "IconChevronDown",
  chevronUp: "IconChevronUp",

  // Brand and category icons
  tags: "IconTags",
  brand: "IconAward",
  category: "IconFolder",

  // Additional mappings for commonly failing icons
  production: "IconBuildingFactory2",
  inventory: "IconDatabase",
  admin: "IconSettings",
  personal: "IconUserCircle",
  analytics: "IconChartBar",
  packageSearch: "IconSearch",
  activity: "IconActivity",
  movement: "IconArrowsVertical",
  announcement: "IconSpeakerphone",
  briefcaseUser: "IconBriefcase",
  client: "IconUser",
  document: "IconFile",
  archive: "IconArchive",
  log: "IconList",
  system: "IconDeviceDesktop",
  notification: "IconBell",
  alert: "IconAlertCircle",
  account: "IconUserCircle",
  preferences: "IconSettings",
  theme: "IconPalette",
  privacy: "IconLock",
  configuration: "IconSettings",

  // Status specific icons
  pending: "IconClock",
  inProgress: "IconClockPlay",
  onHold: "IconPlayerPause",
  completed: "IconCircleCheck",
  cancelled: "IconX",

  // Time related
  clock: "IconClock",
  time: "IconClock",
  timer: "IconClockPlay",

  // Additional common icons
  home: "IconHome",
  back: "IconArrowLeft",
  forward: "IconArrowRight",
  refresh: "IconRefresh",
  sync: "IconRefresh",
  loader: "IconLoader",
  loading: "IconLoader",
  info: "IconInfoCircle",
  information: "IconInfoCircle",
  help: "IconHelpCircle",
  "help-circle": "IconHelpCircle",
  question: "IconQuestionMark",
  eye: "IconEye",
  eyeOff: "IconEyeOff",
  login: "IconLogin",
  logOut: "IconLogout",
  logout: "IconLogout",
  register: "IconUserPlus",
  location: "IconMapPin",
  address: "IconHome",
  phone: "IconPhone",
  email: "IconMail",
  update: "IconRefresh",

  // Additional mappings for common cases that might fail
  warehouse: "IconBuilding",
  hr: "IconUsers",
  myEmployees: "IconUsers",
  userCheck: "IconUserCheck",

  // Fix some potentially problematic mappings
  priorityLow: "IconArrowDown",
  priorityMedium: "IconMinus",
  priorityHigh: "IconArrowUp",
  priorityCritical: "IconAlertTriangle",

  // Additional factory mapping

  // Chart types
  pieChart: "IconChartPie",
  lineChart: "IconChartLine",
  areaChart: "IconChartArea",

  // Trends
  trendingUp: "IconTrendingUp",
  trendingDown: "IconTrendingDown",
  performance: "IconBolt",
  efficiency: "IconTarget",
  revenue: "IconCurrencyDollar",
  profit: "IconChartBar",
  cost: "IconCalculator",
} as const;

// Fallback MaterialCommunityIcons mapping for when iconoir doesn't have the icon
const FALLBACK_ICON_MAP: Record<string, string> = {
  // Main navigation fallbacks
  dashboard: "view-dashboard",
  factory: "factory",
  package: "package-variant",
  paintBrush: "brush",
  users: "account-group",
  cog: "cog",
  userCircle: "account-circle",
  barChart: "chart-bar",
  settings: "cog",
  profile: "account",
  menu: "menu",
  timeTracking: "clock-outline",

  // Status and actions
  clipboardList: "format-list-bulleted",
  plus: "plus",
  pause: "pause",
  play: "play",
  check: "check",
  x: "close",
  history: "history",
  scissors: "content-cut",
  clipboard: "clipboard-outline",
  garage: "garage",
  truck: "truck",
  serviceWrench: "wrench",
  note: "note-text",

  // Inventory
  box: "package-variant",
  suppliers: "truck-delivery",
  orders: "shopping",
  calendar: "calendar",
  maintenance: "tools",
  borrowing: "swap-horizontal",

  // Paint
  palette: "palette",
  droplet: "water",
  beaker: "flask",

  // HR
  user: "account",
  building: "office-building",
  briefcase: "briefcase",
  vacation: "palm-tree",
  holiday: "gift",
  warning: "alert-triangle",

  // Status
  pending: "clock-outline",
  inProgress: "progress-clock",
  onHold: "pause-circle",
  completed: "check-circle",
  cancelled: "cancel",

  // Common
  edit: "pencil",
  trash: "delete",
  search: "magnify",
  filter: "filter",
  download: "download",
  upload: "upload",

  // Personal
  myTasks: "format-list-bulleted",
  myCommissions: "currency-usd",
  myVacations: "calendar",
  myBorrows: "package-variant",
  myPpes: "shield-check",
  myNotifications: "bell",

  // Additional common fallbacks
  home: "home",
  refresh: "refresh",
  email: "email",
  phone: "phone",
  location: "map-marker",

  // Fix for invalid icons from navigation
  userCheck: "account-check",
  info: "information",
  chevronDown: "chevron-down",
  dollarSign: "currency-usd",
  packageSearch: "package-variant-closed",
  external: "open-in-new",
  production: "factory",
  tags: "tag-multiple",
  formula: "flask",
  customers: "account-group",
  auditLog: "file-document",
  files: "file-multiple",
  briefcaseUser: "briefcase-account",
  announcement: "bullhorn",

  // Additional icons from settings screen
  information: "information",
  "help-circle": "help-circle",
  update: "update",
  logout: "logout",

  // Navigation icons that might be passed directly
  IconBuilding: "office-building",
  IconDashboard: "view-dashboard",
  IconBox: "package-variant",
  IconPalette: "palette",
  IconUsers: "account-group",
  IconSettings: "cog",
  IconUserCircle: "account-circle",
  IconChartBar: "chart-bar",
  IconClock: "clock-outline",
  IconClipboardList: "format-list-bulleted",
  IconCirclePlus: "plus-circle",
  IconEdit: "pencil",
  IconEye: "eye",
  IconPlayerPause: "pause",
  IconHistory: "history",
  IconCircleCheck: "check-circle",
  IconCircleX: "close-circle",
  IconScissors: "content-cut",
  IconClipboard: "clipboard-outline",
  IconBuildingWarehouse: "warehouse",
  IconCurrencyDollar: "currency-usd",
  IconTool: "tools",
  IconNote: "note-text",
  IconSearch: "magnify",
  IconPackage: "package-variant",
  IconTags: "tag-multiple",
  IconBadge: "badge-account",
  IconCalendarPlus: "calendar-plus",
  IconBolt: "lightning-bolt",
  IconTools: "tools",
  IconSend: "send",
  IconShield: "shield",
  IconTruck: "truck",
  IconArrowsExchange: "swap-horizontal",
  IconBook: "book",
  IconCoins: "currency-usd",
  IconCalendar: "calendar",
  IconShieldCheck: "shield-check",
  IconSpeakerphone: "bullhorn",
  IconBellRinging: "bell-ring",
  IconChevronRight: "chevron-right",
  IconBriefcase: "briefcase",
  IconBeach: "beach",
  IconAlertTriangle: "alert",
  IconChartPie: "chart-pie",
  IconChartLine: "chart-line",
  IconChartArea: "chart-areaspline",
  IconTrendingUp: "trending-up",
  IconCalculator: "calculator",
  IconActivity: "chart-line-variant",
  IconArrowsUpDown: "arrow-up-down",
  IconHelmet: "hard-hat",
  IconFlask: "flask",
  IconDroplet: "water",
  IconColorSwatch: "palette-swatch",
  IconColorPicker: "eyedropper",
  IconUser: "account",
  IconUserCheck: "account-check",
  IconBuildingBank: "bank",
  IconCalendarEvent: "calendar-star",
  IconCalendarMinus: "calendar-minus",
  IconBell: "bell",
  IconUserPlus: "account-plus",
  IconList: "format-list-bulleted",
  IconListDetails: "format-list-text",
  IconDeviceDesktop: "desktop-mac",
  IconFolders: "folder-multiple",
  IconFileText: "file-document",
  IconArchive: "archive",
  IconAlertCircle: "alert-circle",
  IconLock: "lock",
  IconChevronDown: "chevron-down",
  IconChevronLeft: "chevron-left",
  IconChevronUp: "chevron-up",
  IconRuler: "ruler",
  IconRuler2: "ruler-square",
  IconArrowLeft: "arrow-left",
  IconArrowRight: "arrow-right",
  IconLogout: "logout",
  IconLogin: "login",
  IconKey: "key",
  IconRefresh: "refresh",
  IconHome: "home",
  IconMapPin: "map-marker",
  IconPhone: "phone",
  IconMail: "email",
  IconUserCog: "account-cog",
  IconFileReport: "file-chart",
  IconPrinter: "printer",
  IconDots: "dots-horizontal",
  IconMaximize: "fullscreen",
  IconPhoto: "image",
  IconVideo: "video",
  IconClockHour4: "clock-time-four",
  IconShare: "share",
  IconArrowDown: "arrow-down",
  IconMinus: "minus",
  IconArrowUp: "arrow-up",
  IconCheck: "check",
  IconX: "close",
  IconCircle: "circle",
  IconLoader: "loading",
  IconTrendingDown: "trending-down",
  IconInfoCircle: "information-circle",
  IconHelp: "help",
  IconQuestionMark: "help-circle",
  IconEyeOff: "eye-off",
  IconFilter: "filter",
  IconArrowsSort: "sort",
  IconDownload: "download",
  IconUpload: "upload",
  IconFileImport: "file-import",
  IconFileExport: "file-export",
  IconId: "card-account-details",
  IconUserX: "account-off",
  IconFolderX: "folder-off",
  IconPuzzle: "puzzle",
  IconDatabase: "database",
  IconExternalLink: "open-in-new",
  IconTarget: "target",
  IconShoppingCart: "cart",
  IconPlayerPlay: "play",
  IconPlayerStop: "stop",
  IconClockPlay: "clock-play",
  IconClipboardCheck: "clipboard-check",
  IconHelpCircle: "help-circle",
  IconArrowsLeftRight: "arrow-left-right",
  IconArrowsVertical: "arrow-up-down",
  IconGift: "gift",
  IconTree: "tree",
  IconTrash: "delete",
  IconPlus: "plus",
  IconFolder: "folder",
  IconAward: "trophy",
  IconFile: "file",
  IconBuildingFactory2: "factory",
  IconNotebook: "notebook",
  IconMenu2: "menu",
};

// Type-safe icon component renderer
const renderTablerIcon = (IconComponent: any, props: SafeIconProps): React.ReactElement | null => {
  try {
    if (IconComponent && typeof IconComponent === "function") {
      return React.createElement(IconComponent, {
        size: props.size || 24,
        color: props.color,
        stroke: props.stroke || 2,
        testID: props.testID,
        accessibilityLabel: props.accessibilityLabel,
        accessible: props.accessible,
        ...props,
      });
    }
  } catch (error) {
    // Silently continue to fallback
    console.warn("Failed to render Tabler icon:", error);
  }
  return null;
};

/**
 * Centralized Icon component with standardized sizing, theming, and accessibility
 * Uses @tabler/icons-react-native first, then falls back to MaterialCommunityIcons
 */
export function Icon({ name, size = "md", color, variant = "default", opacity = 1, testID, accessibilityLabel, accessible = true }: IconProps) {
  const { colors } = useTheme();

  // Calculate standardized size
  const iconSize = getIconSize(size);

  // Calculate theme-aware color
  const iconColor = color || getIconColor(colors, variant);

  // Generate testID if not provided
  const finalTestID = testID || `icon-${name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;

  // Generate accessibility label if not provided
  const finalAccessibilityLabel = accessibilityLabel || `${name} icon`;
  // First, try to get the correct tabler icon name
  let tablerName: string | undefined = TABLER_ICON_MAPPINGS[name as keyof typeof TABLER_ICON_MAPPINGS];

  // If not found in mappings, try to get from utils or use the name directly
  if (!tablerName) {
    // Check if name already starts with 'Icon' (direct Tabler icon name)
    if (name.startsWith("Icon")) {
      tablerName = name;
    } else {
      // Try utils mapping
      const utilsName = getTablerIcon(name);
      tablerName = utilsName || name;
    }
  }

  // Try tabler first with type-safe renderer
  const IconComponent = TABLER_ICON_COMPONENTS[tablerName as keyof typeof TABLER_ICON_COMPONENTS];
  const tablerIcon = renderTablerIcon(IconComponent, {
    size: iconSize,
    color: iconColor,
    testID: finalTestID,
    accessibilityLabel: finalAccessibilityLabel,
    accessible,
    opacity,
  });

  if (tablerIcon) {
    return tablerIcon;
  }

  // Fallback to MaterialCommunityIcons
  const fallbackIconName = FALLBACK_ICON_MAP[name as keyof typeof FALLBACK_ICON_MAP];

  // Only use MaterialCommunityIcons if we have a mapped icon name
  if (fallbackIconName) {
    try {
      return (
        <MaterialCommunityIcons
          name={fallbackIconName as any}
          size={iconSize}
          color={iconColor}
          style={{ opacity }}
          testID={finalTestID}
          accessible={accessible}
          accessibilityLabel={finalAccessibilityLabel}
          accessibilityRole="image"
        />
      );
    } catch (error) {
      // Silently continue to final fallback
      console.warn("Failed to render MaterialCommunityIcons icon:", error);
    }
  }

  // Final fallback to tabler Menu icon
  return (
    renderTablerIcon(IconMenu2, {
      size: iconSize,
      color: iconColor,
      testID: finalTestID,
      accessibilityLabel: finalAccessibilityLabel,
      accessible,
      opacity,
    }) || (
      <MaterialCommunityIcons
        name="menu"
        size={iconSize}
        color={iconColor}
        style={{ opacity }}
        testID={finalTestID}
        accessible={accessible}
        accessibilityLabel={finalAccessibilityLabel}
        accessibilityRole="image"
      />
    )
  );
}

// Export convenience function for getting icon component
export const getIconComponent = (iconKey: string, size: IconSize = "md", variant: IconProps["variant"] = "default") => {
  return <Icon name={iconKey} size={size} variant={variant} />;
};

// Export common icon presets
export const createIconPreset = (defaultProps: Partial<IconProps>) => {
  return (props: Partial<IconProps> & { name: string }) => <Icon {...defaultProps} {...props} />;
};

// Common icon presets
export const SmallIcon = createIconPreset({ size: "sm" });
export const LargeIcon = createIconPreset({ size: "lg" });
export const PrimaryIcon = createIconPreset({ variant: "primary" });
export const MutedIcon = createIconPreset({ variant: "muted" });
export const SuccessIcon = createIconPreset({ variant: "success" });
export const WarningIcon = createIconPreset({ variant: "warning" });
export const ErrorIcon = createIconPreset({ variant: "error" });

export default Icon;
