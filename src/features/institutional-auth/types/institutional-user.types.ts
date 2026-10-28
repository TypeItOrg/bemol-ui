import type { PermissionAccess } from "@features/institutional-auth/types/permission-access.types";

export type InstitutionalUser = {
  userId: string | null;
  personId?: string | null;
  name: string;
  lastName: string;
  documentNumber: string;
  institutionId: string;
  delegated?: boolean;
  actorPersonId?: string | null;
  canRequestGuardianLinks?: boolean;
  actorPermissions?: readonly string[];
  roles: readonly string[];
  permissions: readonly string[];
  permissionScopes?: Readonly<Record<string, PermissionAccess>>;
};
