"use client";

import { useState, type ReactElement } from "react";

import { ImageIcon } from "lucide-react";

import { LogoImage } from "@common/components/logo-image";
import { SectionHeader } from "@common/components/section-header";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@common/components/ui/empty";
import { cn } from "@common/utils/cn.util";

import { INSTITUTION_ERROR_MESSAGES } from "@features/institutions/constants/error-messages.constants";
import { getInstitutionLogoUrl } from "@features/institutions/utils/institution-logo-url.util";

const LOGO_FALLBACK_DESCRIPTION = "Se mostrará el nombre de la institución en el acceso público.";

type InstitutionLogoManagerProps = {
  institutionId: string;
  institutionName: string;
  logoUrl: string | null;
  scope?: "platform" | "institutional";
  canUpdate?: boolean;
};

export function InstitutionLogoManager({ institutionId, institutionName, logoUrl }: InstitutionLogoManagerProps): ReactElement {
  const currentUrl = getInstitutionLogoUrl(institutionId, logoUrl);

  return (
    <section className="bg-muted/25 rounded-xl border p-4 sm:p-5">
      <header className="-mx-4 border-b px-4 pb-4 sm:-mx-5 sm:px-5 sm:pb-5">
        <SectionHeader icon={ImageIcon} title="Logo institucional" description="Identidad visible en el acceso público de la institución." />
      </header>
      <div className="bg-background mt-5 flex min-h-32 items-center justify-center rounded-lg border p-4">
        {currentUrl ? (
          <InstitutionLogoImage src={currentUrl} alt={`Logo de ${institutionName}`} className="h-auto max-h-40 w-auto max-w-full object-contain" />
        ) : (
          <InstitutionLogoPlaceholder />
        )}
      </div>
    </section>
  );
}

export function InstitutionLogoImage({
  src,
  alt,
  className,
  compact = false,
}: {
  src: string;
  alt: string;
  className?: string;
  compact?: boolean;
}): ReactElement {
  const [failedUrl, setFailedUrl] = useState<string>();

  if (failedUrl === src) {
    return (
      <div
        role="img"
        aria-label={INSTITUTION_ERROR_MESSAGES.PREVIEW_UNAVAILABLE}
        aria-description={compact ? undefined : LOGO_FALLBACK_DESCRIPTION}
        className={cn("text-muted-foreground flex items-center justify-center", compact ? className : "w-full")}
      >
        {compact ? <ImageIcon aria-hidden="true" className="size-5 shrink-0" /> : <InstitutionLogoPlaceholder unavailable />}
      </div>
    );
  }

  return <LogoImage key={src} unoptimized src={src} alt={alt} width={240} height={160} className={className} onError={() => setFailedUrl(src)} />;
}

function InstitutionLogoPlaceholder({ unavailable = false }: { unavailable?: boolean }): ReactElement {
  return (
    <Empty className="border-0 px-0 py-6">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ImageIcon aria-hidden="true" className="size-5" />
        </EmptyMedia>
        <EmptyTitle className="text-base">{unavailable ? "Logo no disponible" : "Sin logo institucional"}</EmptyTitle>
        <EmptyDescription>
          {unavailable ? `${INSTITUTION_ERROR_MESSAGES.PREVIEW_UNAVAILABLE} ` : null}
          {LOGO_FALLBACK_DESCRIPTION}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
