import type { Metadata } from "next";

import { getInstitutionLogoUrl } from "@features/institutions/utils/institution-logo-url.util";

type BrandIcons = NonNullable<Metadata["icons"]>;

type BrandInstitution = {
  id: string;
  logoUrl: string | null;
};

export const BEMOL_FAVICON_ICONS: BrandIcons = {
  icon: [
    {
      url: "/brand/favicon.svg",
      type: "image/svg+xml",
      sizes: "any",
      media: "(prefers-color-scheme: light)",
    },
    {
      url: "/brand/favicon-dark.svg",
      type: "image/svg+xml",
      sizes: "any",
      media: "(prefers-color-scheme: dark)",
    },
  ],
};

export function getBrandFaviconIcons(institution?: BrandInstitution | null): BrandIcons {
  const institutionLogoUrl = institution ? getInstitutionLogoUrl(institution.id, institution.logoUrl) : null;

  if (!institutionLogoUrl) {
    return BEMOL_FAVICON_ICONS;
  }

  return {
    icon: [
      {
        url: institutionLogoUrl,
      },
    ],
  };
}
