import type { ReactElement } from "react";

import Link from "next/link";

import { UserPlusIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import type { QueryParamValue } from "@common/types/query-param.types";
import { getSafeReturnTo } from "@common/utils/return-to.util";

import { PlatformAccountForm } from "@features/platform-accounts/components/platform-account-form";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export const metadata = {
  title: "Nuevo administrador",
  other: { "application-title": "Nuevo administrador" },
  description: "Creá un nuevo administrador para la plataforma.",
};

export default async function NewPlatformAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: QueryParamValue }>;
}): Promise<ReactElement> {
  const { returnTo } = await searchParams;

  const destination = getSafeReturnTo(returnTo, "/accounts");

  return (
    <PlatformPageShell
      title="Nuevo administrador"
      minViewportHeight
      breadcrumb={<PlatformBreadcrumb />}
      headerClassName="flex-row items-center justify-between"
      actionsClassName="self-stretch"
      actions={<PlatformPageIcon icon={UserPlusIcon} />}
    >
      <div>
        <Button asChild variant="outline" size="lg">
          <Link href={destination}>Volver</Link>
        </Button>
      </div>
      <PlatformAccountForm mode="create" returnTo={destination} />
    </PlatformPageShell>
  );
}
