import type { ReactElement } from "react";

import type { Metadata } from "next";

import type { QueryParamValue } from "@common/types/query-param.types";

import { DocumentCatalogNewPage } from "@features/document-catalog/components/document-catalog-new-page";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Nuevo documento");
}

export default function Page({ searchParams }: { searchParams: Promise<{ returnTo?: QueryParamValue }> }): Promise<ReactElement> {
  return DocumentCatalogNewPage({ scope: "institutional", searchParams });
}
