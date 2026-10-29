import type { InstitutionalCapabilities } from "@features/institutional-auth/types/institutional-capabilities.types";

export type OperatingProfile = {
  actorPersonId: string;
  personId: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  self: boolean;
  canEnroll: boolean;
  capabilities: InstitutionalCapabilities;
  roles: readonly string[];
};
