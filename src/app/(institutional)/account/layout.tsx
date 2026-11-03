import type { ReactElement, ReactNode } from "react";

import { InstitutionalAccountIcon, InstitutionalAccountTitle } from "@features/institutional-auth/components/institutional-account-header";
import { InstitutionalBreadcrumb } from "@features/institutional-auth/components/institutional-breadcrumb";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export default async function AccountLayout({ children }: { children: ReactNode }): Promise<ReactElement> {
  await requireInstitutionalUser();

  return (
    <PlatformPageShell
      title={<InstitutionalAccountTitle />}
      minViewportHeight
      breadcrumb={<InstitutionalBreadcrumb segmentLabels={{ edit: "Editar perfil" }} />}
      headerClassName="flex-row items-center justify-between"
      actionsClassName="self-stretch"
      actions={<InstitutionalAccountIcon />}
    >
      {children}
    </PlatformPageShell>
  );
}
