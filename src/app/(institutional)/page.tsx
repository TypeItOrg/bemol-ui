import type { ReactElement } from "react";

import type { Metadata } from "next";

import { InstitutionalHome } from "@features/institutional-auth/components/institutional-home";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Inicio");
}

export default function Home(): ReactElement {
  return <InstitutionalHome />;
}
