import { PlusIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";

import type { AssignableRole } from "@features/people/types/assignable-role.types";

type Props = {
  roles: readonly AssignableRole[];
  initialRoleIds: ReadonlySet<string>;
  disabled: boolean;
  canSelect: (role: AssignableRole) => boolean;
  onSelect: (role: AssignableRole) => void;
  emptyMessage?: string;
};

export function PersonAvailableRoles({
  roles,
  initialRoleIds,
  disabled,
  canSelect,
  onSelect,
  emptyMessage = "Todos los roles están seleccionados.",
}: Props) {
  if (roles.length === 0) {
    return <p className="text-muted-foreground rounded-lg border p-4 text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {roles.map((role) => (
        <div key={role.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="min-w-0">
            <p className="font-medium">{role.name}</p>
            {initialRoleIds.has(role.id) ? <p className="text-muted-foreground mt-1 text-xs">Se revocará al guardar.</p> : null}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onSelect(role)} disabled={disabled || !canSelect(role)}>
            <PlusIcon data-icon="inline-start" />
            Asignar
          </Button>
        </div>
      ))}
    </div>
  );
}
