import sharp from "sharp";

import { fetchInstitutionLogo } from "@features/institutions/services/fetch-institution-logo.service";

export async function GET(request: Request, { params }: { params: Promise<{ institutionId: string }> }): Promise<Response> {
  const { institutionId } = await params;

  const { searchParams } = new URL(request.url);

  const logo = await fetchInstitutionLogo(institutionId, searchParams.get("v"));

  if (!logo.ok || searchParams.get("format") !== "png" || logo.headers.get("Content-Type") === "image/png") {
    return logo;
  }

  try {
    const png = await sharp(await logo.arrayBuffer(), { limitInputPixels: 4_000_000, autoOrient: true })
      .png()
      .toBuffer();

    const headers = new Headers(logo.headers);

    headers.set("Content-Type", "image/png");

    return new Response(png, { headers });
  } catch {
    return Response.json({ message: "Logo no disponible." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
