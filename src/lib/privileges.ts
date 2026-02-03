/**
 * Privilege checking utilities
 */
import type { User } from '@/types';

/**
 * Checks if a user has a specific privilege based on their sector
 * @param user - The authenticated user object
 * @param requiredPrivilege - The required privilege to check
 * @returns true if user has the required privilege
 */
export function checkUserHasPrivilege(user: User | null, requiredPrivilege: string): boolean {
  if (!user?.sector?.privileges) {
    return false;
  }

  // Check if user's sector privilege matches the required privilege
  return user.sector.privileges === requiredPrivilege;
}

/**
 * Checks if a user has any of the specified privileges
 * @param user - The authenticated user object
 * @param requiredPrivileges - Array of required privileges (user needs at least one)
 * @returns true if user has at least one of the required privileges
 */
export function checkUserHasAnyPrivilege(user: User | null, requiredPrivileges: string[]): boolean {
  if (!user?.sector?.privileges || requiredPrivileges.length === 0) {
    return false;
  }

  return requiredPrivileges.includes(user.sector.privileges);
}

/**
 * Checks if user is an admin
 * @param user - The authenticated user object
 * @returns true if user has ADMIN privilege
 */
export function isAdmin(user: User | null): boolean {
  return user?.sector?.privileges === 'ADMIN';
}
