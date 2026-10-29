import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import { hasInstitutionalPermission } from "@features/institutional-auth/utils/institutional-permission.util";

export function canViewAcademicNavigation(user: InstitutionalUser): boolean {
  return Boolean(user.institutionId);
}

export function canManageDependents(user: InstitutionalUser): boolean {
  return hasInstitutionalPermission(user, INSTITUTIONAL_PERMISSION.GUARDIAN_LINK_REQUEST);
}

export function canRequestDependents(user: InstitutionalUser): boolean {
  return canManageDependents(user) && (user.canRequestGuardianLinks ?? !user.delegated);
}

export function canReviewGuardianLinks(user: InstitutionalUser): boolean {
  return hasInstitutionalPermission(user, INSTITUTIONAL_PERMISSION.GUARDIAN_LINK_REVIEW);
}

export function canViewOwnEnrollmentApplications(user: InstitutionalUser): boolean {
  return user.capabilities.canViewOwnEnrollmentApplications;
}

export function canViewOwnFormation(user: InstitutionalUser): boolean {
  return user.capabilities.canViewOwnFormation;
}

export function canStartEnrollmentApplication(user: InstitutionalUser): boolean {
  return user.capabilities.canManageOwnEnrollmentApplications;
}
