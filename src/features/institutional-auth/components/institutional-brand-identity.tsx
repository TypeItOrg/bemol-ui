"use client";

import { useState, type ReactElement } from "react";

import { LogoImage } from "@common/components/logo-image";
import { cn } from "@common/utils/cn.util";

import { useInstitutionalBrand } from "@features/institutional-auth/components/institutional-brand-context";
import type { PublicInstitution } from "@features/institutions/types/public-institution.types";
import { getInstitutionLogoUrl } from "@features/institutions/utils/institution-logo-url.util";

export function InstitutionalBrandIdentity({
  institution: providedInstitution,
  className,
  imageClassName,
  imageContainerClassName = "h-56 w-full",
  showInstitutionName = false,
  darkBackground = false,
}: {
  institution?: Pick<PublicInstitution, "id" | "name" | "logoUrl" | "logoBlurDataURL">;
  className?: string;
  imageClassName?: string;
  imageContainerClassName?: string;
  showInstitutionName?: boolean;
  darkBackground?: boolean;
}): ReactElement {
  const contextualInstitution = useInstitutionalBrand();

  const institution = providedInstitution ?? contextualInstitution;

  const productLogoUrl = darkBackground ? "/brand/logo-dark.svg" : "/brand/logo.svg";

  const institutionLogoUrl = institution ? getInstitutionLogoUrl(institution.id, institution.logoUrl) : null;

  const [failedUrl, setFailedUrl] = useState<string>();

  const hasInstitutionLogo = Boolean(institutionLogoUrl && failedUrl !== institutionLogoUrl);

  const logoUrl = hasInstitutionLogo ? institutionLogoUrl : productLogoUrl;

  const hasLogo = Boolean(logoUrl && failedUrl !== logoUrl);

  const preview = hasInstitutionLogo ? institution?.logoBlurDataURL : undefined;

  const showProductLogoVariant = !hasInstitutionLogo && !darkBackground;

  return (
    <div className={cn("flex min-w-0 flex-col items-center gap-3 text-center", className)}>
      {hasLogo && logoUrl ? (
        <div className={cn("relative flex items-center justify-center", imageContainerClassName)}>
          <LogoImage
            key={logoUrl}
            blurDataURL={preview}
            preload
            unoptimized={Boolean(institution)}
            sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, (max-width: 1024px) 256px, 288px"
            width={institution ? 240 : 32}
            height={institution ? 240 : 32}
            src={logoUrl}
            alt={hasInstitutionLogo && institution ? `Logo de ${institution.name}` : "Logo de Bemol"}
            className={cn("h-full w-full object-contain", showProductLogoVariant && "dark:hidden", imageClassName)}
            onError={() => setFailedUrl(logoUrl)}
          />
          {/* CSS selects the product variant without changing image attributes during hydration. */}
          {showProductLogoVariant ? (
            <LogoImage
              preload
              sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, (max-width: 1024px) 256px, 288px"
              width={32}
              height={32}
              src="/brand/logo-dark.svg"
              alt="Logo de Bemol"
              className={cn("hidden h-full w-full object-contain dark:block", imageClassName)}
              onError={() => setFailedUrl(logoUrl)}
            />
          ) : null}
        </div>
      ) : null}
      {institution && showInstitutionName ? <p className="w-full text-lg leading-snug font-semibold break-words">{institution.name}</p> : null}
    </div>
  );
}

export function InstitutionalBrandPanel({ showInstitutionName = false }: { showInstitutionName?: boolean }): ReactElement {
  return (
    <section className="from-primary to-primary/80 text-primary-foreground relative hidden bg-linear-to-l p-8 md:flex md:items-center md:justify-center lg:p-12">
      <InstitutionalBrandIdentity
        className="w-full max-w-64 lg:max-w-72"
        imageContainerClassName="h-64 w-full lg:h-72"
        showInstitutionName={showInstitutionName}
        darkBackground
      />
    </section>
  );
}
