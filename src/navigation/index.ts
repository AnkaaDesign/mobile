// Standard optimization exports
export { OptimizedDrawerLayout } from './optimized-layout';
export { default as DrawerContent } from './DrawerContent';

// Privilege-based optimization exports (simplified design)
export { PrivilegeOptimizedDrawerLayout } from './privilege-optimized-layout';
export { default as PrivilegeDrawerContent } from './PrivilegeDrawerContent';

// Full design with privilege optimization (recommended)
export { PrivilegeOptimizedFullLayout } from './privilege-optimized-full';
export { default as FullMenuDrawerContent } from './FullMenuDrawerContent';
export { default as OriginalMenuDrawer } from './OriginalMenuDrawer';

// Utilities
export * from './route-mapper';
export * from './performance-monitor';
export * from './preload-config';
