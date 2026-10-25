import { Suspense, type ReactElement } from "react";

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Building2Icon } from "lucide-react";

import { ReturnToLink } from "@common/components/navigation/return-to-link";
import { SectionHeader } from "@common/components/section-header";
import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";
import { Card, CardContent, CardHeader } from "@common/components/ui/card";
import { DETAIL_LABEL_CLASS_NAME } from "@common/constants/detail-label.constants";
import type { QueryParamValue } from "@common/types/query-param.types";
import { getSafeReturnTo } from "@common/utils/return-to.util";

import { InstitutionDetail } from "@features/institutions/components/institution-detail";
import { InstitutionLogoManager } from "@features/institutions/components/institution-logo-manager";
import { InstitutionPeoplePreview, InstitutionPeoplePreviewSkeleton } from "@features/institutions/components/institution-people-preview";
import { InstitutionPublicAccessDetail } from "@features/institutions/components/institution-public-access-detail";
import { InstitutionReactivateButton } from "@features/institutions/components/institution-reactivate-button";
import { fetchInstitution } from "@features/institutions/services/fetch-institution.service";
import { getInstitutionLogoPlaceholder } from "@features/institutions/services/get-institution-logo-placeholder.service";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

type InstitutionDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: QueryParamValue }>;
};

export const metadata: Metadata = {
  title: "Detalle de institución",
  other: { "application-title": "Detalle de institución" },
};

export default async function InstitutionDetailPage({ params, searchParams }: InstitutionDetailPageProps): Promise<ReactElement> {
  const [{ id }, { returnTo }] = await Promise.all([params, searchParams]);

  const destination = getSafeReturnTo(returnTo, "/admin/institutions");

  const institution = await fetchInstitution(id);

  if (!institution) {
    notFound();
  }

  const userCount = Number.isFinite(institution.userCount) ? institution.userCount : 0;

  return (
    <PlatformPageShell
      title={institution.name}
      breadcrumb={<PlatformBreadcrumb segmentLabels={{ [id]: institution.name }} />}
      actions={<PlatformPageIcon icon={Building2Icon} />}
      minViewportHeight
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button asChild variant="outline" size="lg" className="self-start">
          <Link href={destination}>Volver</Link>
        </Button>
        {institution.active ? (
          <div className="flex w-full flex-wrap justify-start gap-3 md:w-auto md:flex-nowrap md:justify-end">
            <Button asChild variant="outline" size="lg" className="flex-1 md:flex-none">
              <Link href={`/admin/institutions/${id}/people`}>Administrar usuarios</Link>
            </Button>
            <Button asChild size="lg" className="w-full sm:w-auto sm:flex-1 md:flex-none">
              <ReturnToLink href={`/admin/institutions/${id}/edit`} returnTo={destination}>
                Editar institución
              </ReturnToLink>
            </Button>
          </div>
        ) : (
          <InstitutionReactivateButton institutionId={id} institutionName={institution.name} />
        )}
      </div>

      <Card className="bg-muted/25 gap-0 p-5 sm:p-6">
        <CardHeader className="-mx-5 border-b px-5 pb-5 sm:-mx-6 sm:px-6">
          <SectionHeader icon={Building2Icon} title="Información institucional" description="Datos principales de identificación y actividad." />
        </CardHeader>
        <CardContent className="mt-5 p-0">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className={DETAIL_LABEL_CLASS_NAME}>Estado</dt>
              <dd className="mt-1.5">
                <Badge variant={institution.active ? "success" : "destructive"}>{institution.active ? "Activa" : "Inactiva"}</Badge>
              </dd>
            </div>
            <div>
              <dt className={DETAIL_LABEL_CLASS_NAME}>Ubicación</dt>
              <dd className="text-foreground mt-1.5 text-sm font-medium">
                {institution.city.name}, {institution.province.name}
              </dd>
            </div>
            <div>
              <dt className={DETAIL_LABEL_CLASS_NAME}>Usuarios</dt>
              <dd className="text-foreground mt-1.5 text-sm font-medium">{userCount}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <InstitutionPublicAccessDetail publicSubdomain={institution.publicSubdomain} baseDomain={process.env.INSTITUTIONAL_BASE_DOMAIN ?? ""} />
      <InstitutionLogoManager
        logoBlurDataURL={await getInstitutionLogoPlaceholder(institution.id, institution.logoUrl)}
        institutionId={id}
        institutionName={institution.name}
        logoUrl={institution.logoUrl}
        scope="platform"
        canUpdate
      />

      <div className={institution.active ? "grid flex-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)]" : "flex flex-1 flex-col"}>
        <InstitutionDetail institution={institution} />

        {institution.active && (
          <div className="self-start">
            <Suspense fallback={<InstitutionPeoplePreviewSkeleton />}>
              <InstitutionPeoplePreview institutionId={id} />
            </Suspense>
          </div>
        )}
      </div>
    </PlatformPageShell>
  );
}
