import { z } from "zod";

import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import { SYSTEM_ROLE_CODES } from "@features/people/types/system-role-code.types";

const institutionalUserResponseSchema = z.object({
  user: z.object({
    userId: z.string().min(1).nullable(),
    personId: z.string().nullable().optional(),
    name: z.string(),
    lastName: z.string(),
    documentNumber: z.string(),
    institutionId: z.string().min(1),
    delegated: z.boolean().optional(),
    actorPersonId: z.string().nullable().optional(),
    canRequestGuardianLinks: z.boolean().optional(),
    actorPermissions: z.array(z.string()).optional(),
    roles: z.array(z.string()).default([]),
    systemRoleCodes: z.array(z.enum(SYSTEM_ROLE_CODES)),
    capabilities: z.object({
      canViewOwnEnrollmentApplications: z.boolean(),
      canManageOwnEnrollmentApplications: z.boolean(),
      canViewOwnFormation: z.boolean(),
      canViewTeaching: z.boolean(),
      canUpdateTeachingAcademicStatus: z.boolean(),
    }),
    permissions: z.array(z.string()).default([]),
    permissionScopes: z
      .record(
        z.string(),
        z.object({
          accessScope: z.enum(["INSTITUTION", "TRAINING_PATHS"]),
          trainingPathIds: z.array(z.string()),
        }),
      )
      .optional(),
  }),
});

export function parseInstitutionalUser(payload: unknown): InstitutionalUser | null {
  const result = institutionalUserResponseSchema.safeParse(payload);

  if (!result.success) {
    return null;
  }

  return result.data.user;
}
