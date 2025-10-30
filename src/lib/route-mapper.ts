// Clean route utilities for Portuguese folder structure
// No translations, no legacy code - direct Portuguese paths only

import { routes } from '../constants';

/**
 * Convert a path to the mobile format with /(tabs) prefix
 * @param route - Portuguese route path
 * @returns Mobile formatted path
 */
export function routeToMobilePath(route: string): string {
  // Handle home route special case
  if (route === '/' || route === routes.home) {
    return '/(tabs)/inicio';
  }

  // Remove leading slash if present
  const cleanPath = route.startsWith('/') ? route.slice(1) : route;

  // Add (tabs) prefix for tab routes
  return `/(tabs)/${cleanPath}`;
}

/**
 * Get screen title from navigation menu structure
 * @param path - The route path in Portuguese
 * @returns Portuguese title from menu structure or null
 */
export function getTitleFromMenuItems(path: string): string | null {
  // Import MENU_ITEMS dynamically to avoid circular dependencies
  const { MENU_ITEMS } = require('../constants/navigation');

  // Normalize path - remove leading slash, trailing slashes, and (tabs) prefix
  const normalizedPath = path
    .replace(/^\/\(tabs\)\//, '')
    .replace(/^\/+|\/+$/g, '');

  // Recursive function to search through menu items
  function searchMenuItems(items: any[], pathToMatch: string): string | null {
    for (const item of items) {
      // Normalize menu item path
      const itemPath = item.path?.replace(/^\/+|\/+$/g, '') || '';

      // Check for exact match
      if (itemPath === pathToMatch) {
        return item.title;
      }

      // Check for dynamic route match (replace :id with actual ID pattern)
      if (item.isDynamic && itemPath.includes(':id')) {
        // Replace :id with UUID pattern
        const pattern = itemPath.replace(':id', '[a-f0-9-]{36}');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(pathToMatch)) {
          return item.title;
        }
      }

      // Search in children
      if (item.children && item.children.length > 0) {
        const foundInChildren = searchMenuItems(item.children, pathToMatch);
        if (foundInChildren) {
          return foundInChildren;
        }
      }
    }

    return null;
  }

  // Search with the normalized path
  return searchMenuItems(MENU_ITEMS, normalizedPath);
}

/**
 * Generate a readable title from a path segment
 * @param pathSegment - Path segment in Portuguese
 * @returns Formatted title
 */
export function generateTitle(pathSegment: string): string {
  // Map common Portuguese action names
  const actionTitles: Record<string, string> = {
    'cadastrar': 'Cadastrar',
    'detalhes': 'Detalhes',
    'editar': 'Editar',
    'listar': 'Listar',
    'configurar': 'Configurar',
    'enviar': 'Enviar',
  };

  // Check if it's a known action
  if (actionTitles[pathSegment]) {
    return actionTitles[pathSegment];
  }

  // Convert kebab-case to title case
  return pathSegment
    .split('-')
    .map(word => {
      // Handle common Portuguese prepositions
      if (['de', 'da', 'do', 'em', 'e'].includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Extract the last segment from a path
 * @param path - Full path
 * @returns Last path segment
 */
export function getLastPathSegment(path: string): string {
  const segments = path.split('/').filter(Boolean);
  return segments[segments.length - 1] || '';
}

/**
 * Check if a path is a dynamic route (contains :id or UUID)
 * @param path - Path to check
 * @returns True if dynamic route
 */
export function isDynamicRoute(path: string): boolean {
  return path.includes(':id') || /[a-f0-9-]{36}/.test(path);
}

/**
 * Normalize a path for comparison
 * @param path - Path to normalize
 * @returns Normalized path
 */
export function normalizePath(path: string): string {
  return path
    .replace(/^\/\(tabs\)\//, '') // Remove (tabs) prefix
    .replace(/^\/+|\/+$/g, '')    // Remove leading/trailing slashes
    .replace(/\/+/g, '/');         // Replace multiple slashes with single
}