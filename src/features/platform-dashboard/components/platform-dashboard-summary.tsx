import type { ReactElement } from "react";

import { Building2Icon, BuildingIcon, KeyRoundIcon, UsersIcon, type LucideIcon } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@common/components/ui/card";

import type { PlatformDashboardSummary as PlatformDashboardSummaryData } from "@features/platform-dashboard/types/platform-dashboard-summary.types";

const numberFormatter = new Intl.NumberFormat("es-AR");

type SummaryCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
};

function SummaryCard({ label, value, icon: Icon }: SummaryCardProps): ReactElement {
  return (
    <Card className="bg-background p-5 shadow-xs ring-0 sm:p-6">
      <CardHeader className="p-0">
        <CardTitle>{label}</CardTitle>
        <CardAction className="bg-muted flex size-9 items-center justify-center rounded-lg">
          <Icon className="text-muted-foreground size-4" aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent className="mt-auto p-0">
        <p className="text-4xl font-bold tracking-tight tabular-nums">{numberFormatter.format(value)}</p>
      </CardContent>
    </Card>
  );
}

export function PlatformDashboardSummary({ summary }: { summary: PlatformDashboardSummaryData }): ReactElement {
  const cards: SummaryCardProps[] = [
    {
      label: "Instituciones",
      value: summary.institutions,
      icon: Building2Icon,
    },
    {
      label: "Instituciones activas",
      value: summary.activeInstitutions,
      icon: BuildingIcon,
    },
    {
      label: "Personas",
      value: summary.people,
      icon: UsersIcon,
    },
    {
      label: "Usuarios con acceso",
      value: summary.usersWithAccess,
      icon: KeyRoundIcon,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCard key={card.label} {...card} />
      ))}
    </div>
  );
}
