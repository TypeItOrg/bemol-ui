import type { Metadata } from "next";

import { getInstitutionLogoUrl } from "@features/institutions/utils/institution-logo-url.util";

type BrandIcons = NonNullable<Metadata["icons"]>;

type BrandInstitution = {
  id: string;
  logoUrl: string | null;
};

export const BEMOL_FAVICON_ICONS = {
  apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
} satisfies BrandIcons;

export function getBrandFaviconIcons(institution?: BrandInstitution | null): BrandIcons {
  const institutionLogoUrl = institution ? getInstitutionLogoUrl(institution.id, institution.logoUrl) : null;

  if (!institutionLogoUrl) {
    return BEMOL_FAVICON_ICONS;
  }

  return {
    apple: BEMOL_FAVICON_ICONS.apple,
    icon: [
      {
        url: institutionLogoUrl,
      },
    ],
  };
}
