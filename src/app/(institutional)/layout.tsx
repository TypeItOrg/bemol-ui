import type { ReactElement, ReactNode } from "react";

import type { Metadata } from "next";

import { getBrandFaviconIcons } from "@common/utils/brand-favicon.util";

import { InstitutionalRouteLayout } from "@features/institutional-auth/components/institutional-route-layout";
import { getInstitutionalBrand } from "@features/institutional-auth/services/get-institutional-brand.service";

export async function generateMetadata(): Promise<Metadata> {
  const institution = await getInstitutionalBrand();

  return {
    icons: getBrandFaviconIcons(institution),
  };
}

export default async function InstitutionalLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): Promise<ReactElement> {
  return <InstitutionalRouteLayout>{children}</InstitutionalRouteLayout>;
}
