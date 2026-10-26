import type { ReactElement } from "react";

import type { Metadata } from "next";

import { InstitutionalActivityDetail } from "@features/institutional-activity/components/institutional-activity-detail";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Detalle del correo");
}

export default async function ActivityEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}): Promise<ReactElement> {
  const { eventId } = await params;

  return <InstitutionalActivityDetail eventId={eventId} returnTo={(await searchParams).returnTo} mailView={true} />;
}
