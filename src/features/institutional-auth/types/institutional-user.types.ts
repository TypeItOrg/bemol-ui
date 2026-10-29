import type { InstitutionalCapabilities } from "@features/institutional-auth/types/institutional-capabilities.types";
import type { PermissionAccess } from "@features/institutional-auth/types/permission-access.types";
import type { SystemRoleCode } from "@features/people/types/system-role-code.types";

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
  systemRoleCodes: readonly SystemRoleCode[];
  capabilities: InstitutionalCapabilities;
  permissions: readonly string[];
  permissionScopes?: Readonly<Record<string, PermissionAccess>>;
};
