import type { ReactElement } from "react";

import type { Metadata } from "next";

import { InstitutionalActivityPage } from "@features/institutional-activity/components/institutional-activity-page";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";
import type { AuditSearchParams } from "@features/platform-audit/types/audit-search-params.types";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Auditoría");
}

export default async function ActivityPage({ searchParams }: { searchParams: Promise<AuditSearchParams> }): Promise<ReactElement> {
  return <InstitutionalActivityPage params={await searchParams} mailView={false} />;
}
