import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import { hasInstitutionalPermission } from "@features/institutional-auth/utils/institutional-permission.util";

const INSTITUTIONAL_APPLICANT_ROLE_NAMES = new Set(["Postulante", "Estudiante"]);

export function canViewAcademicNavigation(user: InstitutionalUser): boolean {
  return Boolean(user.institutionId);
}

export function canManageDependents(user: InstitutionalUser): boolean {
  return Boolean(user.institutionId);
}

export function canRequestDependents(user: InstitutionalUser): boolean {
  return user.canRequestGuardianLinks ?? (!user.delegated && hasInstitutionalPermission(user, INSTITUTIONAL_PERMISSION.GUARDIAN_LINK_REQUEST));
}

export function canReviewGuardianLinks(user: InstitutionalUser): boolean {
  return hasInstitutionalPermission(user, INSTITUTIONAL_PERMISSION.GUARDIAN_LINK_REVIEW);
}

export function canViewOwnEnrollmentApplications(user: InstitutionalUser): boolean {
  const hasApplicantRole = user.roles.some((role) => INSTITUTIONAL_APPLICANT_ROLE_NAMES.has(role));

  return hasApplicantRole;
}

export function canViewOwnFormation(user: InstitutionalUser): boolean {
  return user.roles.includes("Estudiante");
}

export function canStartEnrollmentApplication(user: InstitutionalUser): boolean {
  return canViewOwnEnrollmentApplications(user);
}
