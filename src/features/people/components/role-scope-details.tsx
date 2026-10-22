"use client";

import { useId } from "react";

import { InfoIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@common/components/ui/popover";

import { ROLE_SCOPE_MESSAGES as M } from "@features/people/constants/role-scope.constants";

export function RoleScopeDetails({ permissions }: { permissions: readonly string[] }) {
  const titleId = useId();

  if (permissions.length === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          aria-label={M.DETAILS_TRIGGER}
          title={M.DETAILS_TRIGGER}
        >
          <InfoIcon className="size-3.5" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" aria-labelledby={titleId} className="w-80 max-w-[calc(100vw-2rem)] gap-3 p-4" collisionPadding={16}>
        <PopoverHeader>
          <PopoverTitle id={titleId}>{M.INACTIVE}</PopoverTitle>
          <PopoverDescription>{M.EXPLANATION}</PopoverDescription>
        </PopoverHeader>
        <ul className="max-h-48 list-disc space-y-1 overflow-y-auto pl-4">
          {permissions.map((permission) => (
            <li key={permission}>{permission}</li>
          ))}
        </ul>
        <p className="text-muted-foreground text-xs leading-relaxed">{M.OTHER_ROLES}</p>
      </PopoverContent>
    </Popover>
  );
}
