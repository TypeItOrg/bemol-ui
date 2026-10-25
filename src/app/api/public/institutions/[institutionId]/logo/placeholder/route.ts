import { NextResponse } from "next/server";

import sharp from "sharp";

import { GET as getInstitutionLogo } from "@app/api/public/institutions/[institutionId]/logo/route";

export async function GET(request: Request, context: { params: Promise<{ institutionId: string }> }): Promise<Response> {
  const response = await getInstitutionLogo(request, context);

  if (!response.ok) {
    return response;
  }

  try {
    const image = await sharp(new Uint8Array(await response.arrayBuffer()), { limitInputPixels: 16_777_216 })
      .resize(32, 32, { fit: "inside", withoutEnlargement: true })
      .timeout({ seconds: 3 })
      .png()
      .toBuffer();

    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ message: "Vista previa no disponible." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
