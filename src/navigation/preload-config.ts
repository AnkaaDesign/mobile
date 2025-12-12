// Preload configuration for optimizing navigation performance
// Configure which modules to preload based on user roles and usage patterns

import { SECTOR_PRIVILEGES } from '@/constants/enums';

interface PreloadConfig {
  role: string | string[];
  modules: string[];
  priority: 'high' | 'medium' | 'low';
  delay?: number; // Delay in ms before preloading
}

// Configuration for automatic module preloading
export const PRELOAD_CONFIGS: PreloadConfig[] = [
  // High priority - Load immediately for all users
  {
    role: '*', // All users
    modules: ['personal'], // Personal module used by everyone
    priority: 'high',
    delay: 0,
  },

  // Admin users - Load admin and stats modules
  {
    role: SECTOR_PRIVILEGES.ADMIN,
    modules: ['admin', 'statistics'],
    priority: 'high',
    delay: 500,
  },

  // HR users - Load HR module
  {
    role: SECTOR_PRIVILEGES.HUMAN_RESOURCES,
    modules: ['hr'],
    priority: 'high',
    delay: 500,
  },

  // Production workers - Load production module
  // Note: Team leadership is now determined by managedSector relationship, not privilege
  {
    role: SECTOR_PRIVILEGES.PRODUCTION,
    modules: ['production'],
    priority: 'high',
    delay: 500,
  },

  // Inventory/Stock workers
  {
    role: SECTOR_PRIVILEGES.STOCK,
    modules: ['inventory'],
    priority: 'high',
    delay: 500,
  },

  // Common modules - Lower priority
  {
    role: '*',
    modules: ['inventory', 'production'], // Commonly accessed
    priority: 'medium',
    delay: 2000, // Load after 2 seconds
  },
];

// Get modules to preload for a user based on their roles
export function getModulesToPreload(userRoles: string[]): Array<{module: string, delay: number}> {
  const modulesToLoad = new Map<string, number>();

  PRELOAD_CONFIGS.forEach(config => {
    const roles = Array.isArray(config.role) ? config.role : [config.role];
    const shouldLoad = roles.includes('*') || roles.some(role => userRoles.includes(role));

    if (shouldLoad) {
      config.modules.forEach(module => {
        // Use the shortest delay if module appears in multiple configs
        const existingDelay = modulesToLoad.get(module);
        const newDelay = config.delay || 0;

        if (existingDelay === undefined || newDelay < existingDelay) {
          modulesToLoad.set(module, newDelay);
        }
      });
    }
  });

  return Array.from(modulesToLoad.entries()).map(([module, delay]) => ({
    module,
    delay,
  }));
}

// Hook to automatically preload modules based on user role
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export function useAutoPreload(loadModule: (module: any) => Promise<void>) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const userRoles = user.sectors?.map(s => s.privilege) || [];
    const modulesToLoad = getModulesToPreload(userRoles);

    // Schedule module loading with delays
    const timeouts: NodeJS.Timeout[] = [];

    modulesToLoad.forEach(({ module, delay }) => {
      const timeout = setTimeout(() => {
        console.log(`[PRELOAD] Loading module: ${module} (delay: ${delay}ms)`);
        loadModule(module).catch(error => {
          console.error(`[PRELOAD] Failed to load module ${module}:`, error);
        });
      }, delay);

      timeouts.push(timeout);
    });

    // Cleanup timeouts on unmount
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [user, loadModule]);
}

// Analytics to track which modules are most used
interface ModuleUsageStats {
  module: string;
  accessCount: number;
  lastAccessed: number;
  averageLoadTime: number;
}

class ModuleUsageTracker {
  private stats = new Map<string, ModuleUsageStats>();

  trackAccess(module: string, loadTime: number) {
    const existing = this.stats.get(module);

    if (existing) {
      const newAverage = (existing.averageLoadTime * existing.accessCount + loadTime) / (existing.accessCount + 1);

      this.stats.set(module, {
        module,
        accessCount: existing.accessCount + 1,
        lastAccessed: Date.now(),
        averageLoadTime: newAverage,
      });
    } else {
      this.stats.set(module, {
        module,
        accessCount: 1,
        lastAccessed: Date.now(),
        averageLoadTime: loadTime,
      });
    }

    // Log frequently accessed modules
    const stats = this.stats.get(module)!;
    if (stats.accessCount % 10 === 0) {
      console.log(`[USAGE] Module ${module} accessed ${stats.accessCount} times, avg load: ${stats.averageLoadTime.toFixed(2)}ms`);
    }
  }

  getMostUsedModules(limit = 5): ModuleUsageStats[] {
    return Array.from(this.stats.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  getRecommendedPreloads(): string[] {
    // Get modules accessed more than 3 times with good performance
    return Array.from(this.stats.values())
      .filter(stat => stat.accessCount >= 3 && stat.averageLoadTime < 500)
      .sort((a, b) => b.accessCount - a.accessCount)
      .map(stat => stat.module);
  }
}

export const moduleUsageTracker = new ModuleUsageTracker();