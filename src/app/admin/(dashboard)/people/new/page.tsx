import type { ReactElement } from "react";

import { UserRoundIcon } from "lucide-react";

import type { QueryParamValue } from "@common/types/query-param.types";
import { getSafeReturnTo } from "@common/utils/return-to.util";

import { PersonForm } from "@features/people/components/person-form";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export const metadata = { title: "Nuevo usuario" };

export default async function NewPlatformPersonPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: QueryParamValue }>;
}): Promise<ReactElement> {
  const { returnTo } = await searchParams;

  const destination = getSafeReturnTo(returnTo, "/admin/people");

  return (
    <PlatformPageShell
      backHref={destination}
      title="Nuevo usuario"
      minViewportHeight
      breadcrumb={<PlatformBreadcrumb />}
      headerClassName="flex-row items-center justify-between"
      actionsClassName="self-stretch"
      actions={<PlatformPageIcon icon={UserRoundIcon} />}
    >
      <PersonForm mode="create" returnTo={destination} />
    </PlatformPageShell>
  );
}
