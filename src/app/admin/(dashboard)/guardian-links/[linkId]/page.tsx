import type { ReactElement } from "react";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UsersIcon } from "lucide-react";

import { getSafeReturnTo } from "@common/utils/return-to.util";
import { isValidUuid } from "@common/utils/uuid.util";

import { GuardianLinkDetail } from "@features/guardian-links/components/guardian-link-detail";
import { fetchGuardianLink } from "@features/guardian-links/services/fetch-guardian-link.service";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export const metadata: Metadata = { title: "Detalle de vinculación", other: { "application-title": "Detalle de vinculación" } };

export default async function GuardianLinkDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ linkId: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}): Promise<ReactElement> {
  const { linkId } = await params;

  if (!isValidUuid(linkId)) {
    notFound();
  }

  const request = await fetchGuardianLink(linkId);

  if (!request) {
    notFound();
  }

  const returnTo = getSafeReturnTo((await searchParams).returnTo, "/guardian-links");

  return (
    <PlatformPageShell
      title="Detalle de vinculación"
      breadcrumb={<PlatformBreadcrumb segmentLabels={{ [linkId]: "Detalle de vinculación" }} />}
      actions={<PlatformPageIcon icon={UsersIcon} />}
    >
      <GuardianLinkDetail request={request} returnTo={returnTo} platform />
    </PlatformPageShell>
  );
}
