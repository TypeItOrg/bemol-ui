import type { ReactElement, ReactNode } from "react";

import { InstitutionalBrandIdentity } from "@features/institutional-auth/components/institutional-brand-identity";

type InstitutionalAuthStepHeaderProps = {
  title: string;
  description: ReactNode;
  showInstitutionName?: boolean;
};

export function InstitutionalAuthStepHeader({ title, description, showInstitutionName = false }: InstitutionalAuthStepHeaderProps): ReactElement {
  return (
    <header className="flex flex-col items-center space-y-1 text-center">
      <InstitutionalBrandIdentity
        className="mb-3 w-full md:hidden"
        imageContainerClassName="h-20 sm:h-24 w-full"
        imageClassName="max-h-20 max-w-56 sm:max-h-24 sm:max-w-64"
        showInstitutionName={showInstitutionName}
      />
      <h1 className="text-xl font-bold text-balance break-words sm:text-2xl">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </header>
  );
}
