import { SECTOR_PRIVILEGES } from "@/constants/enums";

export function canViewPricing(userRole: string): boolean {
  return [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.COMMERCIAL,
  ].includes(userRole as SECTOR_PRIVILEGES);
}

export function canCreatePricing(userRole: string): boolean {
  return [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.FINANCIAL,
  ].includes(userRole as SECTOR_PRIVILEGES);
}

export function canEditPricing(userRole: string): boolean {
  return [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.FINANCIAL,
  ].includes(userRole as SECTOR_PRIVILEGES);
}

export function canApprovePricing(userRole: string): boolean {
  return [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.FINANCIAL,
  ].includes(userRole as SECTOR_PRIVILEGES);
}

export function canDeletePricing(userRole: string): boolean {
  return userRole === SECTOR_PRIVILEGES.ADMIN;
}
