import type { ReactNode } from "react";

import type { Metadata } from "next";

import { getRequestInstitution } from "@common/services/institutional-host/institutional-host.service";
import { getBrandFaviconIcons } from "@common/utils/brand-favicon.util";

import { InstitutionalBrandProvider } from "@features/institutional-auth/components/institutional-brand-context";
import { getInstitutionLogoPlaceholder } from "@features/institutions/services/get-institution-logo-placeholder.service";

export async function generateMetadata(): Promise<Metadata> {
  const institution = await getRequestInstitution();

  return {
    icons: getBrandFaviconIcons(institution),
  };
}

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const institution = await getRequestInstitution();

  const brand = institution
    ? { ...institution, logoBlurDataURL: await getInstitutionLogoPlaceholder(institution.id, institution.logoUrl) }
    : undefined;

  return (
    <main className="bg-muted flex min-h-(--app-viewport-height) flex-col items-center justify-center p-4 md:p-10">
      <section className="w-full max-w-sm md:max-w-5xl">
        <InstitutionalBrandProvider institution={brand}>{children}</InstitutionalBrandProvider>
      </section>
    </main>
  );
}
