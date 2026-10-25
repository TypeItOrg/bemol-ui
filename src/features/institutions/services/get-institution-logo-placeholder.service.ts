import { cache } from "react";

import "server-only";

import sharp from "sharp";

import { fetchInstitutionLogo } from "@features/institutions/services/fetch-institution-logo.service";
import { getInstitutionLogoUrl } from "@features/institutions/utils/institution-logo-url.util";

export const getInstitutionLogoPlaceholder = cache(async (institutionId: string, logoUrl: string | null): Promise<string | undefined> => {
  const url = getInstitutionLogoUrl(institutionId, logoUrl);

  if (!url) {
    return undefined;
  }

  try {
    const version = new URL(url, "http://logo.invalid").searchParams.get("v");

    const response = await fetchInstitutionLogo(institutionId, version);

    if (!response.ok) {
      return undefined;
    }

    const image = await sharp(new Uint8Array(await response.arrayBuffer()), { limitInputPixels: 16_777_216 })
      .resize(32, 32, { fit: "inside", withoutEnlargement: true })
      .blur(0.6)
      .timeout({ seconds: 3 })
      .png()
      .toBuffer();

    return `data:image/png;base64,${image.toString("base64")}`;
  } catch {
    return undefined;
  }
});
