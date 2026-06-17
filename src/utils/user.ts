import type { User } from '../types';
import { CONTRACT_TYPE, CONTRACT_STATUS, EMPLOYEE_TYPE, SECTOR_PRIVILEGES, TEAM_LEADER, VERIFICATION_TYPE, CONTRACT_STATUS_LABELS } from '../constants';
import type { BadgeVariant } from '../constants';
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
 * Whether the user's current vínculo is in the experiência (probation) period.
 * Experiência is now a contract MODALITY (EXPERIENCE_PERIOD_1 / EXPERIENCE_PERIOD_2)
 * combined with an ACTIVE status, NOT a lifecycle status.
 */
export function isInExperience(user: User): boolean {
  return (
    user.currentContractType === CONTRACT_TYPE.EXPERIENCE_PERIOD_1 ||
    user.currentContractType === CONTRACT_TYPE.EXPERIENCE_PERIOD_2
  );
}

/**
 * Derive the experiência phase (1 or 2) of the current vínculo, directly from the
 * contract MODALITY (EXPERIENCE_PERIOD_1 → 1, EXPERIENCE_PERIOD_2 → 2).
 * Returns null when not in experiência.
 */
export function getExperiencePhase(user: User): 1 | 2 | null {
  if (user.currentContractType === CONTRACT_TYPE.EXPERIENCE_PERIOD_1) return 1;
  if (user.currentContractType === CONTRACT_TYPE.EXPERIENCE_PERIOD_2) return 2;
  return null;
}

/**
 * Calculate days remaining in the current experiência window.
 * Phase 1 counts down to exp1EndAt; phase 2 counts down to exp2EndAt.
 * Returns null if the user is not in experiência or no end date is set.
 */
export function getDaysRemainingInExperiencePeriod(user: User): number | null {
  if (!isInExperience(user)) {
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

  if (!isInExperience(user) || !contract) {
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
 * Result of the single collaborator-status derivation.
 * `variant` is a valid mobile Badge / getBadgeVariant token.
 */
export interface CollaboratorStatus {
  key: string;
  label: string;
  variant: BadgeVariant;
}

/**
 * SINGLE canonical derivation of a collaborator's display status (label +
 * badge variant). This must match the web implementation exactly.
 *
 * Canonical semantics:
 * - "Efetivado" = currentContractType === INDETERMINATE && currentContractStatus === ACTIVE (GREEN).
 *   It is NEVER a contract type by itself.
 * - "Demitido" / dismissed = isActive === false (RED). `isActive` is THE employed signal.
 *
 * afastado / aviso prévio are NO LONGER contract statuses. They are OPTIONAL
 * overlays sourced from the Leave feature / an in-progress Termination, passed in
 * via `opts`.
 *
 * Precedence (first match wins):
 * 1. isActive === false && status === TERMINATED        → TERMINATED, "Demitido", red
 * 2. isActive === false (no/empty contract)             → NO_CONTRACT, "Sem vínculo", gray
 * 3. opts.activeLeave (overlay)                          → ON_LEAVE, "Afastado", purple
 * 4. opts.inNoticePeriod (overlay)                       → NOTICE_PERIOD, "Aviso prévio", orange
 * 5. off-CLT currentEmployeeType                         → labelled by category, teal/blue
 * 6. type === EXPERIENCE_PERIOD_1/2                      → "Em experiência 1/2" (+days), amber
 * 7. status === ACTIVE && type === INDETERMINATE         → EFFECTED, "Efetivado", green
 * 8. status === ACTIVE                                   → ACTIVE, "Ativo", blue
 * 9. fallback                                            → CONTRACT_STATUS_LABELS or "—", gray
 */
export function getCollaboratorStatus(
  user: User,
  opts?: { activeLeave?: boolean; inNoticePeriod?: boolean },
): CollaboratorStatus {
  // 1. Demitido — dismissed with an explicit terminated contract.
  if (user.isActive === false && user.currentContractStatus === CONTRACT_STATUS.TERMINATED) {
    return { key: "TERMINATED", label: "Desligado", variant: "red" };
  }

  // 2. Dismissed with no/empty contract — "Sem vínculo".
  if (user.isActive === false) {
    return { key: "NO_CONTRACT", label: "Sem vínculo", variant: "gray" };
  }

  // 3. Afastado (overlay from the Leave feature).
  if (opts?.activeLeave) {
    return { key: "ON_LEAVE", label: "Afastado", variant: "purple" };
  }

  // 4. Aviso prévio (overlay from an in-progress Termination).
  if (opts?.inNoticePeriod) {
    return { key: "NOTICE_PERIOD", label: "Aviso prévio", variant: "orange" };
  }

  // 5. Off-payroll categories (terceirizado/PJ/estagiário/autônomo): label by
  //    worker category. These carry no CONTRACT_TYPE modality and aren't "Efetivado".
  if (user.currentEmployeeType && user.currentEmployeeType !== EMPLOYEE_TYPE.CLT) {
    const offCltLabels: Record<string, string> = {
      [EMPLOYEE_TYPE.INTERN]: "Estagiário",
      [EMPLOYEE_TYPE.TERCEIRIZADO]: "Terceirizado",
      [EMPLOYEE_TYPE.PJ]: "PJ",
      [EMPLOYEE_TYPE.AUTONOMOUS]: "Autônomo",
    };
    const offCltVariants: Record<string, BadgeVariant> = {
      [EMPLOYEE_TYPE.INTERN]: "blue",
      [EMPLOYEE_TYPE.TERCEIRIZADO]: "teal",
      [EMPLOYEE_TYPE.PJ]: "teal",
      [EMPLOYEE_TYPE.AUTONOMOUS]: "blue",
    };
    return {
      key: user.currentEmployeeType,
      label: offCltLabels[user.currentEmployeeType] || user.currentEmployeeType,
      variant: offCltVariants[user.currentEmployeeType] || "teal",
    };
  }

  // 6. Em experiência — phase derived directly from the contract MODALITY.
  if (isInExperience(user)) {
    const phase = getExperiencePhase(user);
    let label = phase ? `Em experiência ${phase}` : "Em experiência";
    const daysRemaining = getDaysRemainingInExperiencePeriod(user);
    if (daysRemaining !== null) {
      label = `${label} - ${daysRemaining}d`;
    }
    return { key: "EXPERIENCE", label, variant: phase === 2 ? "orange" : "blue" };
  }

  // 7. Efetivado — confirmed indefinite CLT bond.
  if (
    user.currentContractStatus === CONTRACT_STATUS.ACTIVE &&
    user.currentContractType === CONTRACT_TYPE.INDETERMINATE
  ) {
    return { key: "EFFECTED", label: "Efetivado", variant: "green" };
  }

  // 8. Ativo — active bond without an indefinite modality (e.g. fixed-term).
  if (user.currentContractStatus === CONTRACT_STATUS.ACTIVE) {
    return { key: "ACTIVE", label: "Ativo", variant: "blue" };
  }

  // 9. Fallback.
  const fallbackLabel =
    (user.currentContractStatus ? CONTRACT_STATUS_LABELS[user.currentContractStatus] : undefined) || "—";
  return { key: user.currentContractStatus ?? "UNKNOWN", label: fallbackLabel, variant: "gray" };
}

/**
 * Get user status badge text with time information.
 * Delegates to the single canonical derivation; for ACTIVE/EFFECTED bonds it
 * appends the compact "time since status change" suffix (preserved behavior).
 */
export function getUserStatusBadgeText(user: User): string {
  const { key, label } = getCollaboratorStatus(user);

  // For active/effected bonds, show time since the status change in compact format.
  if (key === "ACTIVE" || key === "EFFECTED" || key === "TERMINATED") {
    const timeSince = formatTimeSinceStatusChangeCompact(user);
    if (timeSince) {
      return `${label} - ${timeSince}`;
    }
  }

  return label;
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
    [CONTRACT_STATUS.ACTIVE]: "green",
    [CONTRACT_STATUS.TERMINATED]: "gray",
    // Contract MODALITY colors (fallback).
    [CONTRACT_TYPE.EXPERIENCE_PERIOD_1]: "blue",
    [CONTRACT_TYPE.EXPERIENCE_PERIOD_2]: "orange",
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
export function hasPrivilege(user: User | null, requiredPrivilege: SECTOR_PRIVILEGES | typeof TEAM_LEADER | string): boolean {
  // TEAM_LEADER is a virtual privilege - resolved via the ledSector relation, not sector.privileges
  if (requiredPrivilege === TEAM_LEADER) return isTeamLeader(user);

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
export function hasAnyPrivilege(user: User | null, requiredPrivileges: (SECTOR_PRIVILEGES | typeof TEAM_LEADER | string)[]): boolean {
  if (!requiredPrivileges.length) return false;

  // ADMIN has access to everything (special case)
  if (user?.sector?.privileges === SECTOR_PRIVILEGES.ADMIN) return true;

  // Match each required privilege; TEAM_LEADER is resolved via the ledSector relation
  return requiredPrivileges.some((privilege) =>
    privilege === TEAM_LEADER ? isTeamLeader(user) : user?.sector?.privileges === privilege,
  );
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
export function groupUsersByStatus(users: User[]): Record<string, User[]> {
  const groups = {
    [CONTRACT_TYPE.INDETERMINATE]: [],
    [CONTRACT_TYPE.FIXED_TERM]: [],
    [CONTRACT_TYPE.INTERMITTENT]: [],
    [CONTRACT_TYPE.APPRENTICE]: [],
    [CONTRACT_TYPE.TEMPORARY]: [],
  } as Record<string, User[]>;

  users.forEach((user) => {
    // CLT bonds group by contract modality. Off-payroll categories carry no
    // modality, so group them under their EMPLOYEE_TYPE instead of dropping them.
    const key = user.currentContractType ?? user.currentEmployeeType ?? null;
    if (!key) return;
    if (!groups[key]) groups[key] = [];
    groups[key].push(user);
  });

  return groups;
}

/**
 * Group users by lifecycle STATUS (situação).
 */
export function groupUsersByContractStatus(users: User[]): Record<CONTRACT_STATUS, User[]> {
  const groups = {
    [CONTRACT_STATUS.ACTIVE]: [],
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
