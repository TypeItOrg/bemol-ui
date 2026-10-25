import type { ReactElement, ReactNode } from "react";

import { UserRoundIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";
import { Badge } from "@common/components/ui/badge";
import { DETAIL_LABEL_CLASS_NAME } from "@common/constants/detail-label.constants";

import type { PlatformAccountAdmin } from "@features/platform-accounts/types/platform-account-admin.types";

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

type PlatformAccountDetailProps = {
  account: PlatformAccountAdmin;
};

export function PlatformAccountDetail({ account }: PlatformAccountDetailProps): ReactElement {
  return (
    <section className="bg-muted/25 space-y-5 rounded-xl border p-4 sm:p-5">
      <SectionHeader
        icon={UserRoundIcon}
        title="Información del administrador"
        description="Datos personales y estado de acceso a la plataforma."
        descriptionBreakpoint="sm"
      />
      <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <DetailItem label="Nombre" value={account.name} />
        <DetailItem label="Apellido" value={account.lastName} />
        <DetailItem label="Correo electrónico" value={account.email} />
        <DetailItem label="Fecha de alta" value={dateTimeFormatter.format(new Date(account.createdAt)).replace(",", "")} />
        <DetailItem
          label="Estado"
          value={<Badge variant={account.enabled ? "success" : "destructive"}>{account.enabled ? "Habilitado" : "Deshabilitado"}</Badge>}
        />
      </dl>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }): ReactElement {
  return (
    <div className="min-w-0">
      <dt className={DETAIL_LABEL_CLASS_NAME}>{label}</dt>
      <dd className="mt-1 text-sm break-words">{value}</dd>
    </div>
  );
}
