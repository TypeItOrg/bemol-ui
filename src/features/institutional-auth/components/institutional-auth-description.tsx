"use client";

import type { ReactElement } from "react";

import { useInstitutionalBrand } from "@features/institutional-auth/components/institutional-brand-context";

type InstitutionalAuthDescriptionProps = {
  generic: string;
  before: string;
  after: string;
};

export function InstitutionalAuthDescription({ generic, before, after }: InstitutionalAuthDescriptionProps): ReactElement {
  const institution = useInstitutionalBrand();

  if (!institution) {
    return <>{generic}</>;
  }

  return (
    <>
      {before}
      <strong>{institution.name}</strong>
      {after}
    </>
  );
}
