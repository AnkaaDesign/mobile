import type { User } from '../types';
import { CONTRACT_TYPE, CONTRACT_STATUS, EMPLOYEE_TYPE, SECTOR_PRIVILEGES, VERIFICATION_TYPE } from '../constants';
import { dateUtils } from "./date";

/**
 * Map a contract type/status enum to string for API compatibility
 * This is needed because TypeScript doesn't recognize that the string values are compatible
 */
export function mapUserStatusToPrisma(status: CONTRACT_TYPE | CONTRACT_STATUS | string): string {
  return status as string;
}

/**
 * Map VERIFICATION_TYPE enum to string for API compatibility
 * This is needed because TypeScript doesn't recognize that the string values are compatible
 */
export function mapVerificationTypeToPrisma(verificationType: VERIFICATION_TYPE | string | null | undefined): string | null | undefined {
  return verificationType as string | null | undefined;
}

/**
 * Map PPE size enums to strings for API compatibility
 * Note: These functions are kept for backward compatibility with PpeSize entity
 */
export function mapShirtSizeToPrisma(size: string | null | undefined): string | null | undefined {
  return size as string | null | undefined;
}

export function mapBootSizeToPrisma(size: string | null | undefined): string | null | undefined {
  return size as string | null | undefined;
}

export function mapPantsSizeToPrisma(size: string | null | undefined): string | null | undefined {
  return size as string | null | undefined;
}

export function mapSleevesSizeToPrisma(size: string | null | undefined): string | null | undefined {
  return size as string | null | undefined;
}

export function mapMaskSizeToPrisma(size: string | null | undefined): string | null | undefined {
  return size as string | null | undefined;
}

/**
 * Whether the user's current vínculo is in the experiência (probation) status.
 * Experiência is a STATUS (orthogonal to contract MODALITY), not a contract type.
 */
export function isInExperience(user: User): boolean {
  return user.currentContractStatus === CONTRACT_STATUS.EXPERIENCE;
}

/**
 * Derive the experiência phase (1 or 2) of the current vínculo.
 * Prefers an explicit `experiencePhase` on the contract; otherwise derives from
 * the exp1/exp2 date windows. Returns null when not in experiência or undeterminable.
 */
export function getExperiencePhase(user: User): 1 | 2 | null {
  if (user.currentContractStatus !== CONTRACT_STATUS.EXPERIENCE) {
    return null;
  }

  const contract = user.currentContract;
  if (!contract) return null;

  // Explicit phase wins when present.
  if (contract.experiencePhase === 1 || contract.experiencePhase === 2) {
    return contract.experiencePhase;
  }

  // Derive from date windows: if exp2 has started (or exp1 has ended), we're in phase 2.
  const now = new Date();
  if (contract.exp2StartAt && new Date(contract.exp2StartAt) <= now) {
    return 2;
  }
  if (contract.exp1EndAt && new Date(contract.exp1EndAt) <= now && contract.exp2EndAt) {
    return 2;
  }
  if (contract.exp1StartAt) {
    return 1;
  }

  return null;
}

/**
 * Calculate days remaining in the current experiência window.
 * Phase 1 counts down to exp1EndAt; phase 2 counts down to exp2EndAt.
 * Returns null if the user is not in experiência or no end date is set.
 */
export function getDaysRemainingInExperiencePeriod(user: User): number | null {
  if (user.currentContractStatus !== CONTRACT_STATUS.EXPERIENCE) {
    return null;
  }

  const now = new Date();
  const contract = user.currentContract;
  if (!contract) return null;

  const phase = getExperiencePhase(user);
  const endAt = phase === 2 ? contract.exp2EndAt : contract.exp1EndAt;

  if (!endAt) return null;

  const endDate = new Date(endAt);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Calculate time since contracted or dismissed
 * Returns an object with years, months, and days
 */
export function getTimeSinceStatusChange(user: User): { years: number; months: number; days: number } | null {
  const now = new Date();
  let startDate: Date | null = null;
  const contract = user.currentContract;

  if (user.currentContractStatus === CONTRACT_STATUS.TERMINATED && contract?.terminationDate) {
    // Desligado: time since termination.
    startDate = new Date(contract.terminationDate);
  } else if (user.currentContractStatus === CONTRACT_STATUS.ACTIVE && contract?.effectedAt) {
    // Efetivado / ativo: time since efetivação.
    startDate = new Date(contract.effectedAt);
  } else if (user.currentContractStatus === CONTRACT_STATUS.ACTIVE && contract?.admissionDate) {
    // ACTIVE without effectedAt (e.g. genuine FIXED_TERM/INTERMITTENT): time since admission.
    startDate = new Date(contract.admissionDate);
  }

  if (!startDate) {
    return null;
  }

  let years = now.getFullYear() - startDate.getFullYear();
  let months = now.getMonth() - startDate.getMonth();
  let days = now.getDate() - startDate.getDate();

  // Adjust for negative days
  if (days < 0) {
    months--;
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += lastMonth.getDate();
  }

  // Adjust for negative months
  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
}

/**
 * Format time since status change in compact YY:MM:DD format
 */
export function formatTimeSinceStatusChangeCompact(user: User): string | null {
  const time = getTimeSinceStatusChange(user);

  if (!time) {
    return null;
  }

  // Format as YY:MM:DD with zero-padding
  const years = String(time.years).padStart(2, '0');
  const months = String(time.months).padStart(2, '0');
  const days = String(time.days).padStart(2, '0');

  return `${years}:${months}:${days}`;
}

/**
 * Calculate days since experience period started
 * For exp1: days since exp1StartAt
 * For exp2: (exp1 duration) + (days into exp2)
 *   - exp1 duration is calculated from exp1StartAt to exp1EndAt (or exp2StartAt if exp1EndAt not available)
 *   - if neither is available, assumes standard 30 days for exp1
 *   - days into exp2 is calculated from exp2StartAt (or exp1EndAt) to now
 */
export function getDaysSinceExperienceStart(user: User): number | null {
  const now = new Date();
  const contract = user.currentContract;

  if (user.currentContractStatus !== CONTRACT_STATUS.EXPERIENCE || !contract) {
    return null;
  }

  const phase = getExperiencePhase(user);

  if (phase === 1 && contract.exp1StartAt) {
    const startDate = new Date(contract.exp1StartAt);
    const diffTime = now.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  }

  if (phase === 2) {
    let exp1Duration = 30; // Default to 30 days if we can't calculate
    let exp2Start: Date | null = null;

    // Calculate exp1 duration if we have the dates
    if (contract?.exp1StartAt && contract?.exp1EndAt) {
      const exp1StartDate = new Date(contract.exp1StartAt);
      const exp1EndDate = new Date(contract.exp1EndAt);
      exp1Duration = Math.floor((exp1EndDate.getTime() - exp1StartDate.getTime()) / (1000 * 60 * 60 * 24));
      exp2Start = exp1EndDate;
    } else if (contract?.exp1StartAt && contract?.exp2StartAt) {
      // If exp1EndAt not available, use exp2StartAt
      const exp1StartDate = new Date(contract.exp1StartAt);
      const exp2StartDate = new Date(contract.exp2StartAt);
      exp1Duration = Math.floor((exp2StartDate.getTime() - exp1StartDate.getTime()) / (1000 * 60 * 60 * 24));
      exp2Start = exp2StartDate;
    } else if (contract?.exp2StartAt) {
      // Only exp2StartAt available, use it with default exp1 duration
      exp2Start = new Date(contract.exp2StartAt);
    } else if (contract?.exp1EndAt) {
      // Only exp1EndAt available, use it with default exp1 duration
      exp2Start = new Date(contract.exp1EndAt);
    }

    // Calculate days into exp2
    let daysIntoExp2 = 0;
    if (exp2Start) {
      const diffTime = now.getTime() - exp2Start.getTime();
      daysIntoExp2 = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      daysIntoExp2 = daysIntoExp2 >= 0 ? daysIntoExp2 : 0;
    }

    return exp1Duration + daysIntoExp2;
  }

  return null;
}

/**
 * Get user status badge text with time information
 */
export function getUserStatusBadgeText(user: User): string {
  // Lifecycle STATUS short labels (situação), the primary driver of the badge.
  const statusLabels: Record<CONTRACT_STATUS, string> = {
    [CONTRACT_STATUS.EXPERIENCE]: "Experiência",
    [CONTRACT_STATUS.ACTIVE]: "Efetivado",
    [CONTRACT_STATUS.NOTICE_PERIOD]: "Aviso prévio",
    [CONTRACT_STATUS.ON_LEAVE]: "Afastado",
    [CONTRACT_STATUS.TERMINATED]: "Demitido",
  };

  // Contract MODALITY short labels (used as fallback when status is unknown).
  const typeLabels: Record<CONTRACT_TYPE, string> = {
    [CONTRACT_TYPE.INDETERMINATE]: "Prazo indeterminado",
    [CONTRACT_TYPE.FIXED_TERM]: "Prazo determinado",
    [CONTRACT_TYPE.INTERMITTENT]: "Intermitente",
    [CONTRACT_TYPE.APPRENTICE]: "Aprendiz",
    [CONTRACT_TYPE.TEMPORARY]: "Temporário",
  };

  let baseLabel =
    (user.currentContractStatus ? statusLabels[user.currentContractStatus] : undefined) ||
    (user.currentContractType ? typeLabels[user.currentContractType] : undefined) ||
    user.currentContractType ||
    "";

  // For experiência, show the phase alongside the countdown.
  if (user.currentContractStatus === CONTRACT_STATUS.EXPERIENCE) {
    const phase = getExperiencePhase(user);
    if (phase) {
      baseLabel = `Exp${phase}`;
    }
    const daysRemaining = getDaysRemainingInExperiencePeriod(user);
    if (daysRemaining !== null) {
      return `${baseLabel} - ${daysRemaining}d`;
    }
    return baseLabel;
  }

  // For active/terminated, show time since the status change in compact format.
  const timeSince = formatTimeSinceStatusChangeCompact(user);
  if (timeSince) {
    return `${baseLabel} - ${timeSince}`;
  }

  return baseLabel;
}

/**
 * Check if experience period is about to expire (within 7 days)
 */
export function isExperiencePeriodExpiringSoon(user: User, daysThreshold: number = 7): boolean {
  const daysRemaining = getDaysRemainingInExperiencePeriod(user);
  return daysRemaining !== null && daysRemaining <= daysThreshold && daysRemaining > 0;
}

/**
 * Check if experience period has expired
 */
export function isExperiencePeriodExpired(user: User): boolean {
  const daysRemaining = getDaysRemainingInExperiencePeriod(user);
  return daysRemaining !== null && daysRemaining === 0;
}

/**
 * Get user status color
 */
export function getUserStatusColor(status: CONTRACT_TYPE | CONTRACT_STATUS | string): string {
  const colors: Record<string, string> = {
    // Lifecycle STATUS colors (situação).
    [CONTRACT_STATUS.EXPERIENCE]: "orange",
    [CONTRACT_STATUS.ACTIVE]: "green",
    [CONTRACT_STATUS.NOTICE_PERIOD]: "orange",
    [CONTRACT_STATUS.ON_LEAVE]: "purple",
    [CONTRACT_STATUS.TERMINATED]: "gray",
    // Contract MODALITY colors (fallback).
    [CONTRACT_TYPE.INDETERMINATE]: "green",
    [CONTRACT_TYPE.FIXED_TERM]: "blue",
    [CONTRACT_TYPE.INTERMITTENT]: "blue",
    [CONTRACT_TYPE.APPRENTICE]: "purple",
    [CONTRACT_TYPE.TEMPORARY]: "blue",
  };
  return colors[status] || "default";
}

/**
 * Check if user is active (not terminated).
 */
export function isUserActive(user: User): boolean {
  return user.currentContractStatus !== CONTRACT_STATUS.TERMINATED && user.verified === true && user.password !== null;
}

/**
 * Check if user is inactive (terminated / desligado).
 */
export function isUserInactive(user: User): boolean {
  return user.currentContractStatus === CONTRACT_STATUS.TERMINATED;
}

/**
 * Check if user is blocked (terminated / desligado).
 */
export function isUserBlocked(user: User): boolean {
  return user.currentContractStatus === CONTRACT_STATUS.TERMINATED;
}

/**
 * Check if user has specific privilege
 * Uses EXACT privilege matching (not hierarchical) - ADMIN is special case with access to everything
 * FINANCIAL can edit tasks but not inventory, WAREHOUSE can edit inventory but not tasks
 */
export function hasPrivilege(user: User | null, requiredPrivilege: SECTOR_PRIVILEGES | string): boolean {
  if (!user?.sector?.privileges) return false;

  const userPrivilege = user.sector.privileges;

  // ADMIN has access to everything (special case)
  if (userPrivilege === SECTOR_PRIVILEGES.ADMIN) return true;

  // For all other privileges, require EXACT match (no hierarchy)
  return userPrivilege === requiredPrivilege;
}

/**
 * Check if user has ANY of the specified privileges (OR logic)
 * Matches backend @Roles decorator behavior - checks if user's privilege is IN the array
 * ADMIN can access everything, others need exact match
 */
export function hasAnyPrivilege(user: User | null, requiredPrivileges: (SECTOR_PRIVILEGES | string)[]): boolean {
  if (!user?.sector?.privileges || !requiredPrivileges.length) return false;

  const userPrivilege = user.sector.privileges;

  // ADMIN has access to everything (special case)
  if (userPrivilege === SECTOR_PRIVILEGES.ADMIN) return true;

  // Check if user's privilege is in the allowed array (exact match)
  return requiredPrivileges.includes(userPrivilege);
}

/**
 * Check if user has ALL of the specified privileges (AND logic)
 * User must have privilege level equal to or higher than ALL specified privileges
 */
export function hasAllPrivileges(user: User | null, requiredPrivileges: (SECTOR_PRIVILEGES | string)[]): boolean {
  if (!user?.sector?.privileges || !requiredPrivileges.length) return false;

  return requiredPrivileges.every((privilege) => hasPrivilege(user, privilege));
}

/**
 * Check if user can access based on privilege array (same as hasAnyPrivilege)
 * Alias function that matches backend controller terminology
 */
export function canAccessWithPrivileges(user: User | null, allowedPrivileges: SECTOR_PRIVILEGES[]): boolean {
  return hasAnyPrivilege(user, allowedPrivileges);
}

/**
 * Check if user is administrator
 */
export function isUserAdmin(user: User): boolean {
  return hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
}

/**
 * Check if user is leader (manages a sector)
 * DEPRECATED: Use isTeamLeader instead
 */
export function isUserLeader(user: User): boolean {
  return isTeamLeader(user);
}

/**
 * Get user display name
 */
export function getUserDisplayName(user: User): string {
  return user.name || user.email || "Usuário desconhecido";
}

/**
 * Get user initials
 */
export function getUserInitials(user: User): string {
  const name = user.name || user.email || "";
  const parts = name.split(" ");

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

/**
 * Format user info
 */
export function formatUserInfo(user: User): string {
  const name = user.name || "Sem nome";
  const email = user.email;
  const position = user.position?.name || "Sem cargo";

  return `${name} (${email}) - ${position}`;
}

/**
 * Get user age in days
 */
export function getUserAge(user: User): number {
  return dateUtils.getDaysAgo(user.createdAt);
}

/**
 * Check if user is new (created within last 30 days)
 */
export function isNewUser(user: User, daysThreshold: number = 30): boolean {
  return getUserAge(user) <= daysThreshold;
}

/**
 * Group users by status
 */
export function groupUsersByStatus(users: User[]): Record<CONTRACT_TYPE, User[]> {
  const groups = {
    [CONTRACT_TYPE.INDETERMINATE]: [],
    [CONTRACT_TYPE.FIXED_TERM]: [],
    [CONTRACT_TYPE.INTERMITTENT]: [],
    [CONTRACT_TYPE.APPRENTICE]: [],
    [CONTRACT_TYPE.TEMPORARY]: [],
  } as Record<CONTRACT_TYPE, User[]>;

  users.forEach((user) => {
    if (user.currentContractType && groups[user.currentContractType]) {
      groups[user.currentContractType].push(user);
    }
  });

  return groups;
}

/**
 * Group users by lifecycle STATUS (situação).
 */
export function groupUsersByContractStatus(users: User[]): Record<CONTRACT_STATUS, User[]> {
  const groups = {
    [CONTRACT_STATUS.EXPERIENCE]: [],
    [CONTRACT_STATUS.ACTIVE]: [],
    [CONTRACT_STATUS.NOTICE_PERIOD]: [],
    [CONTRACT_STATUS.ON_LEAVE]: [],
    [CONTRACT_STATUS.TERMINATED]: [],
  } as Record<CONTRACT_STATUS, User[]>;

  users.forEach((user) => {
    if (user.currentContractStatus && groups[user.currentContractStatus]) {
      groups[user.currentContractStatus].push(user);
    }
  });

  return groups;
}

/**
 * Group users by sector
 */
export function groupUsersBySector(users: User[]): Record<string, User[]> {
  return users.reduce(
    (groups, user) => {
      const sectorName = user.sector?.name || "Sem setor";
      if (!groups[sectorName]) {
        groups[sectorName] = [];
      }
      groups[sectorName].push(user);
      return groups;
    },
    {} as Record<string, User[]>,
  );
}

/**
 * Filter active users
 */
export function filterActiveUsers(users: User[]): User[] {
  return users.filter(isUserActive);
}

/**
 * Sort users by name
 */
export function sortUsersByName(users: User[], order: "asc" | "desc" = "asc"): User[] {
  return [...users].sort((a, b) => {
    const nameA = a.name || a.email || "";
    const nameB = b.name || b.email || "";
    return order === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });
}

/**
 * Calculate user statistics
 */
export function calculateUserStats(users: User[]) {
  const total = users.length;
  const active = users.filter(isUserActive).length;
  const inactive = users.filter(isUserInactive).length;
  const verified = users.filter((user) => user.verified).length;
  const newUsers = users.filter((user) => isNewUser(user)).length;

  const bySector = groupUsersBySector(users);
  const sectorCounts = Object.entries(bySector).reduce(
    (acc, [sector, userList]) => {
      acc[sector] = userList.length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    total,
    active,
    inactive,
    verified,
    newUsers,
    sectorCounts,
  };
}

// =====================
// Team Leadership Utilities
// =====================

/**
 * Check if user is a team leader (manages a sector)
 */
export function isTeamLeader(user: User | null | undefined): boolean {
  if (!user) return false;
  return Boolean(user.ledSector?.id);
}

/**
 * Check if user can manage another user (is their team leader)
 */
export function canManageUser(manager: User, targetUser: User): boolean {
  const ledSectorId = manager.ledSector?.id;
  if (!isTeamLeader(manager) || !ledSectorId) {
    return false;
  }

  // Leader can manage users in the sector they lead
  return targetUser.sectorId === ledSectorId;
}

/**
 * Get users that a leader manages (team members)
 */
export function getTeamMembers(leader: User, allUsers: User[]): User[] {
  const ledSectorId = leader.ledSector?.id;
  if (!isTeamLeader(leader) || !ledSectorId) {
    return [];
  }

  return allUsers.filter((user) => user.sectorId === ledSectorId);
}

/**
 * Get users from the same sector as the given user
 */
export function getUsersInSameSector(user: User, allUsers: User[]): User[] {
  if (!user.sectorId) {
    return [];
  }

  return allUsers.filter((u) => u.sectorId === user.sectorId && u.id !== user.id);
}

/**
 * Check if user has both sector membership and leadership privileges
 * DEPRECATED: Leadership is now determined by ledSector relationship
 */
export function isUserLeaderWithPrivileges(user: User): boolean {
  return isTeamLeader(user);
}

/**
 * Get sector that user leads (if any)
 */
export function getLedSector(user: User): string | null {
  return user.ledSector?.id || null;
}

/**
 * Check if user can access team management features
 */
export function canAccessTeamManagement(user: User): boolean {
  // User must be a team leader (manages a sector)
  return isTeamLeader(user);
}

// =====================
// Bonus Eligibility Utilities
// =====================

/**
 * Whether a user's current vínculo makes them bonus-eligible by the canonical
 * predicate (Part A): a confirmed CLT bond — employeeType === CLT && status === ACTIVE.
 * Mirrors the API `isBonifiable(contract)` helper.
 */
export function isBonifiable(user: User): boolean {
  return user.currentEmployeeType === EMPLOYEE_TYPE.CLT && user.currentContractStatus === CONTRACT_STATUS.ACTIVE;
}

/**
 * Check if user is eligible for bonus calculation. This is the SINGLE
 * canonical definition (must match the API live calc) — all four predicates:
 * 1. confirmed CLT bond: employeeType === CLT && status === ACTIVE (isBonifiable)
 * 2. position.bonifiable === true
 * 3. user.performanceLevel > 0
 * 4. user.secullumEmployeeId != null (registered in the time-clock system)
 */
export function isUserEligibleForBonus(user: User): boolean {
  // Check the confirmed-CLT-bond predicate (replaces the old EFFECTED check).
  if (!isBonifiable(user)) {
    return false;
  }

  // Check if user has performance level > 0
  if (!user.performanceLevel || user.performanceLevel <= 0) {
    return false;
  }

  // Check if user's position is bonifiable
  if (!user.position?.bonifiable) {
    return false;
  }

  // Check if user is registered in Secullum (required for attendance + bonus).
  // Mirrors the live-calc query `secullumEmployeeId: { not: null }`.
  if ((user as { secullumEmployeeId?: number | null }).secullumEmployeeId == null) {
    return false;
  }

  return true;
}

/**
 * Get bonus eligibility reason for a user
 * Returns null if user is eligible, or a reason string if not eligible
 */
export function getBonusIneligibilityReason(user: User): string | null {
  if (user.currentContractStatus === CONTRACT_STATUS.TERMINATED) {
    return "Usuário está desligado";
  }

  if (user.currentEmployeeType !== EMPLOYEE_TYPE.CLT) {
    return "Apenas funcionários CLT são elegíveis para bonificação";
  }

  if (user.currentContractStatus !== CONTRACT_STATUS.ACTIVE) {
    return "Vínculo deve estar ativo (efetivado)";
  }

  if (!user.performanceLevel || user.performanceLevel <= 0) {
    return "Nível de performance deve ser maior que 0";
  }

  if (!user.position) {
    return "Usuário não possui cargo definido";
  }

  if (!user.position.bonifiable) {
    return "Cargo não é elegível para bonificação";
  }

  return null;
}

/**
 * Filter users eligible for bonus calculation
 */
export function filterBonusEligibleUsers(users: User[]): User[] {
  return users.filter(isUserEligibleForBonus);
}

/**
 * Group users by bonus eligibility
 */
export function groupUsersByBonusEligibility(users: User[]): { eligible: User[]; ineligible: User[] } {
  const eligible: User[] = [];
  const ineligible: User[] = [];

  users.forEach((user) => {
    if (isUserEligibleForBonus(user)) {
      eligible.push(user);
    } else {
      ineligible.push(user);
    }
  });

  return { eligible, ineligible };
}

/**
 * Calculate bonus eligibility statistics for a list of users
 */
export function calculateBonusEligibilityStats(users: User[]) {
  const total = users.length;
  const eligible = users.filter(isUserEligibleForBonus).length;
  const ineligible = total - eligible;

  // Count reasons for ineligibility
  const ineligibilityReasons: Record<string, number> = {};
  users.forEach((user) => {
    const reason = getBonusIneligibilityReason(user);
    if (reason) {
      ineligibilityReasons[reason] = (ineligibilityReasons[reason] || 0) + 1;
    }
  });

  return {
    total,
    eligible,
    ineligible,
    eligibilityRate: total > 0 ? (eligible / total) * 100 : 0,
    ineligibilityReasons,
  };
}
