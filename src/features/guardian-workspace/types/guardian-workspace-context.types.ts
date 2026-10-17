import type { OperatingProfile } from "@features/guardian-workspace/types/operating-profile.types";

export type GuardianWorkspaceContextValue = {
  institutionId: string;
  profiles: readonly OperatingProfile[];
  activeProfile: OperatingProfile | null;
  personId: string | undefined;
};
