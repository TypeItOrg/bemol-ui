import type { ReactElement } from "react";

import type { Metadata } from "next";

import type { QueryParamValue } from "@common/types/query-param.types";

import { DocumentCatalogEditPage } from "@features/document-catalog/components/document-catalog-edit-page";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Editar documento");
}

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<{ returnTo?: QueryParamValue }>;
}): Promise<ReactElement> {
  return DocumentCatalogEditPage({ scope: "institutional", params, searchParams });
}
