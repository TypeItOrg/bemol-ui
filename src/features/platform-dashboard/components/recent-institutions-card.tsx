import { Fragment, type ReactElement } from "react";

import Link from "next/link";

import { Building2Icon, BuildingIcon, MapPinIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";
import { Badge } from "@common/components/ui/badge";
import { Card, CardContent, CardHeader } from "@common/components/ui/card";
import { Separator } from "@common/components/ui/separator";

import { DashboardEmptyState } from "@features/platform-dashboard/components/dashboard-empty-state";
import type { RecentInstitution } from "@features/platform-dashboard/types/recent-institution.types";
import { formatDashboardDate } from "@features/platform-dashboard/utils/dashboard-date.util";

export function RecentInstitutionsCard({ institutions }: { institutions: RecentInstitution[] }): ReactElement {
  return (
    <Card className="bg-background p-5 shadow-xs ring-0 sm:p-6">
      <CardHeader className="p-0">
        <SectionHeader
          icon={Building2Icon}
          descriptionBreakpoint="sm"
          title="Instituciones recientes"
          description="Las últimas instituciones incorporadas a la plataforma."
        />
      </CardHeader>
      <CardContent className="p-0">
        {institutions.length === 0 ? (
          <DashboardEmptyState
            icon={Building2Icon}
            title="Todavía no hay instituciones"
            description="Las instituciones nuevas aparecerán en este espacio."
          />
        ) : (
          <div className="flex flex-col">
            {institutions.map((institution, index) => (
              <Fragment key={institution.id}>
                {index > 0 ? <Separator className="-mx-5 data-horizontal:w-auto sm:-mx-6" /> : null}
                <RecentInstitutionRow institution={institution} />
              </Fragment>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentInstitutionRow({ institution }: { institution: RecentInstitution }): ReactElement {
  return (
    <Link
      href={`/admin/institutions/${institution.id}`}
      className="hover:bg-muted/50 -mx-2 flex min-w-0 items-center gap-3 rounded-lg px-2 py-3 transition-colors"
    >
      <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
        <BuildingIcon className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate font-medium">{institution.name}</p>
          <Badge variant={institution.active ? "success" : "destructive"}>{institution.active ? "Activa" : "Inactiva"}</Badge>
        </div>
        <p className="text-muted-foreground mt-1 flex min-w-0 items-center gap-1.5 text-xs">
          <MapPinIcon className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {institution.city}, {institution.province}
          </span>
        </p>
      </div>
      <time className="text-muted-foreground hidden shrink-0 text-xs tabular-nums sm:block" dateTime={institution.createdAt}>
        {formatDashboardDate(institution.createdAt)}
      </time>
    </Link>
  );
}
