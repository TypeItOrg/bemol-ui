import { AcademicResource } from "@features/academic/types/academic-resource.types";
import { toPlatformInternalPath } from "@features/platform-auth/utils/platform-route-paths.util";

export type AcademicScope = "admin" | "institutional";

export const AcademicScope = {
  ADMIN: "admin",
  INSTITUTIONAL: "institutional",

  isAdmin(scope: AcademicScope): boolean {
    return scope === AcademicScope.ADMIN;
  },
} as const;

export function getAcademicApiBase(scope: AcademicScope, institutionId: string): string {
  const prefix = AcademicScope.isAdmin(scope) ? "/api/v1/admin/institutions" : "/api/v1/institutions";

  return `${prefix}/${institutionId}`;
}

export function getAcademicRouteBase(scope: AcademicScope, institutionId: string): string {
  return AcademicScope.isAdmin(scope) ? `/institutions/${institutionId}/academic` : "";
}

export function getAcademicResourceRoute(scope: AcademicScope, institutionId: string, resource: AcademicResource): string {
  return `${getAcademicRouteBase(scope, institutionId)}/${getCollectionResource(resource)}`;
}

function getCollectionResource(resource: AcademicResource): AcademicResource {
  switch (resource) {
    case AcademicResource.ACADEMIC_LEVEL:
    case AcademicResource.STUDY_PLAN_SPACE:
    case AcademicResource.PREREQUISITE:
      return AcademicResource.STUDY_PLAN;
    default:
      return resource;
  }
}

export function getAcademicRevalidationPath(scope: AcademicScope, path: string): string {
  return AcademicScope.isAdmin(scope) ? toPlatformInternalPath(path) : path;
}
