import { Fragment, type ReactElement } from "react";

import Link from "next/link";

import { Building2Icon, BuildingIcon, MapPinIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";
import { Avatar, AvatarFallback, AvatarImage } from "@common/components/ui/avatar";
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
      <CardContent className="bg-muted/50 rounded-lg p-4 sm:p-5">
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
                {index > 0 ? <Separator /> : null}
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
      className="group focus-visible:ring-ring flex min-w-0 items-center gap-3 rounded-lg py-3 outline-none first:pt-0 last:pb-0 focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <Avatar size="lg" className="rounded-lg after:rounded-lg">
        <AvatarImage src={`/api/public/institutions/${institution.id}/logo`} alt="" className="bg-background rounded-lg object-contain p-1" />
        <AvatarFallback className="bg-primary/10 text-primary rounded-lg">
          <BuildingIcon className="size-4" aria-hidden="true" />
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate font-medium underline-offset-4 group-hover:underline group-focus-visible:underline">{institution.name}</p>
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
