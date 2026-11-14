import type { ReactElement } from "react";

import type { Metadata } from "next";

import { DocumentCatalogPage } from "@features/document-catalog/components/document-catalog-page";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Documentación");
}

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<ReactElement> {
  return DocumentCatalogPage({ scope: "institutional", searchParams });
}
