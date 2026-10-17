"use client";

import { createContext, useContext, type PropsWithChildren, type ReactElement } from "react";

import { usePathname } from "next/navigation";

import type { GuardianWorkspaceContextValue } from "@features/guardian-workspace/types/guardian-workspace-context.types";
import type { OperatingProfile } from "@features/guardian-workspace/types/operating-profile.types";

const GuardianWorkspaceContext = createContext<GuardianWorkspaceContextValue | null>(null);

export function GuardianWorkspaceProvider({
  children,
  profiles,
  institutionId,
}: { institutionId: string; profiles: readonly OperatingProfile[] } & PropsWithChildren): ReactElement {
  const routePersonId = useOperatingPersonId();

  const activeProfile = profiles.find((profile) => (routePersonId ? profile.personId === routePersonId : profile.self)) ?? null;

  const personId = routePersonId ?? activeProfile?.personId;

  return <GuardianWorkspaceContext value={{ profiles, activeProfile, personId, institutionId }}>{children}</GuardianWorkspaceContext>;
}

export function useGuardianWorkspace(): GuardianWorkspaceContextValue {
  const context = useContext(GuardianWorkspaceContext);

  if (!context) {
    throw new Error("El selector debe utilizarse dentro del espacio institucional.");
  }

  return context;
}

export function useOperatingPersonId(): string | undefined {
  return usePathname().match(/^\/self-service\/([^/]+)/)?.[1];
}

export function useOperatingInstitutionId(): string | undefined {
  return useContext(GuardianWorkspaceContext)?.institutionId;
}
