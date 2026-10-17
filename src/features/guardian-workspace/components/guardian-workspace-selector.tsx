"use client";

import type { ReactElement } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { UsersRoundIcon } from "lucide-react";

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@common/components/ui/dropdown-menu";

import { useGuardianWorkspace } from "@features/guardian-workspace/components/guardian-workspace-provider";
import { PersonInitialsAvatar } from "@features/guardian-workspace/components/person-initials-avatar";

export function GuardianWorkspaceMenuItems({ onNavigate }: { onNavigate: (url: string) => void }): ReactElement {
  const { profiles, personId } = useGuardianWorkspace();

  const router = useRouter();

  return (
    <>
      <DropdownMenuLabel>Identidad activa</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={personId ?? ""}
        onValueChange={(id) => {
          const url = `/self-service/${id}`;

          // Selecting a profile updates the drawer; only section links schedule its close.
          router.push(url);
        }}
      >
        {profiles.map((profile) => (
          <DropdownMenuRadioItem
            key={profile.personId}
            value={profile.personId}
            className="focus:text-popover-foreground data-[state=checked]:bg-accent gap-2.5 py-2 pr-8 pl-2.5 focus:**:text-inherit"
          >
            <PersonInitialsAvatar firstName={profile.firstName} lastName={profile.lastName} />
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-baseline gap-1" title={`${profile.firstName} ${profile.lastName}`}>
                <span className="truncate">
                  {profile.firstName} {profile.lastName}
                </span>
                {profile.self ? <span className="text-muted-foreground! shrink-0 text-xs">(Vos)</span> : null}
              </span>
              <span className="text-muted-foreground! block truncate text-xs">{profile.documentNumber}</span>
            </span>
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild className="px-2.5 py-1.5">
        <Link href="/my-dependents" onClick={() => onNavigate("/my-dependents")}>
          <UsersRoundIcon />
          Gestionar personas a cargo
        </Link>
      </DropdownMenuItem>
    </>
  );
}
