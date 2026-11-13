import type { ReactElement } from "react";

import { ShieldCheckIcon, UserRoundCheckIcon, UserRoundIcon, type LucideIcon } from "lucide-react";

import { OptionalValue } from "@common/components/optional-value";
import { SectionHeader } from "@common/components/section-header";
import { Badge } from "@common/components/ui/badge";
import { DETAIL_LABEL_CLASS_NAME } from "@common/constants/detail-label.constants";

import { ROLE_SCOPE_MESSAGES } from "@features/people/constants/role-scope.constants";
import type { PersonRole } from "@features/people/types/person-role.types";
import type { Person } from "@features/people/types/person.types";
import { formatAssignedAt } from "@features/people/utils/person-role-assigned-at.util";

type PersonDetailViewProps = {
  person: Person;
  assignedRoles: PersonRole[];
};

export function PersonDetailView({ person, assignedRoles }: PersonDetailViewProps): ReactElement {
  return (
    <div className="grid gap-4">
      <section className="bg-muted/25 rounded-xl border p-4 sm:p-5">
        <header className="-mx-4 border-b px-4 pb-4 sm:-mx-5 sm:px-5 sm:pb-5">
          <DetailSectionHeader description="Información principal del usuario institucional." icon={UserRoundIcon} title="Datos personales" />
        </header>
        <dl className="mt-4 grid gap-4 sm:mt-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailValue fallback="Sin nombre" label="Nombre" value={person.firstName} />
          <DetailValue fallback="Sin apellido" label="Apellido" value={person.lastName} />
          <DetailValue fallback="Sin documento" label="Documento Nacional de Identidad" value={person.documentNumber} />
          <DetailValue fallback="Sin fecha de nacimiento" label="Fecha de nacimiento" value={formatDate(person.birthDate)} />
          <DetailValue fallback="Sin correo electrónico" label="Correo electrónico" value={person.email} />
          <DetailValue fallback="Sin nacionalidad" label="Nacionalidad" value={person.nationalityCountry?.name ?? null} />
          <DetailValue fallback="Sin teléfono" label="Teléfono" value={person.phoneNumber} />
        </dl>
      </section>

      <section className="bg-muted/25 rounded-xl border p-4 sm:p-5">
        <header className="-mx-4 border-b px-4 pb-4 sm:-mx-5 sm:px-5 sm:pb-5">
          <DetailSectionHeader description="Permisos asignados actualmente a esta persona." icon={ShieldCheckIcon} title="Roles asignados" />
        </header>
        {assignedRoles.length > 0 ? (
          <ul className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-2 sm:mt-5">
            {assignedRoles.map((role) => (
              <li
                key={role.roleId}
                className="bg-background flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-lg border px-3.5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <UserRoundCheckIcon className="size-4.5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm leading-5 font-medium wrap-anywhere">{role.displayName}</p>
                    <p className="text-muted-foreground text-xs leading-4">Asignado: {formatAssignedAt(role.assignedAt)}</p>
                  </div>
                </div>
                <Badge variant="outline">{getRoleScopeLabel(role)}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground mt-4 text-sm sm:mt-5">No tiene roles asignados.</p>
        )}
      </section>
    </div>
  );
}

function DetailSectionHeader({ description, icon: Icon, title }: { description: string; icon: LucideIcon; title: string }): ReactElement {
  return <SectionHeader descriptionBreakpoint="sm" icon={Icon} title={title} description={description} />;
}

function getRoleScopeLabel(role: PersonRole): string {
  if (role.accessScope === "INSTITUTION") {
    return ROLE_SCOPE_MESSAGES.INSTITUTION;
  }

  const count = role.trainingPathIds.length;

  return count === 1 ? "1 trayecto formativo" : `${count} trayectos formativos`;
}

function DetailValue({ label, value, fallback }: { label: string; value: string | null; fallback: string }): ReactElement {
  return (
    <div>
      <dt className={DETAIL_LABEL_CLASS_NAME}>{label}</dt>
      <dd className="mt-1 text-sm font-medium">
        <OptionalValue value={value} fallback={fallback} />
      </dd>
    </div>
  );
}

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-");

  return year && month && day ? `${day}/${month}/${year}` : value;
}
