import type { ReactElement } from "react";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UsersIcon } from "lucide-react";

import { getSafeReturnTo } from "@common/utils/return-to.util";
import { isValidUuid } from "@common/utils/uuid.util";

import { GuardianLinkDetail } from "@features/guardian-links/components/guardian-link-detail";
import { fetchGuardianLink } from "@features/guardian-links/services/fetch-guardian-link.service";
import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { InstitutionalBreadcrumb } from "@features/institutional-auth/components/institutional-breadcrumb";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { canReviewGuardianLinks } from "@features/institutional-auth/utils/institutional-applicant-role.util";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Detalle de vinculación");
}

export default async function GuardianLinkDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ linkId: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}): Promise<ReactElement> {
  const user = await requireInstitutionalUser();

  if (!canReviewGuardianLinks(user)) {
    return <InstitutionalAccessDenied description="No tenés permisos para validar vinculaciones." />;
  }

  const { linkId } = await params;

  if (!isValidUuid(linkId)) {
    notFound();
  }

  const request = await fetchGuardianLink(linkId, user.institutionId);

  if (!request) {
    notFound();
  }

  const returnTo = getSafeReturnTo((await searchParams).returnTo, "/guardian-links");

  return (
    <PlatformPageShell
      title="Detalle de vinculación"
      breadcrumb={<InstitutionalBreadcrumb segmentLabels={{ [linkId]: "Detalle de vinculación" }} />}
      actions={<PlatformPageIcon icon={UsersIcon} />}
    >
      <GuardianLinkDetail request={request} returnTo={returnTo} institutionId={user.institutionId} />
    </PlatformPageShell>
  );
}
