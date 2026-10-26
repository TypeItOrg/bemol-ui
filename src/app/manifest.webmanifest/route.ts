import type { MetadataRoute } from "next";

import { InstitutionalHostError } from "@common/services/institutional-host/institutional-host-error";
import { resolveRequestInstitution } from "@common/services/institutional-host/institutional-host.service";

export async function GET(request: Request): Promise<Response> {
  try {
    const institution = await resolveRequestInstitution(request.headers);

    const name = institution ? `${institution.shortName?.trim() || institution.name} - Bemol` : "Administración - Bemol";

    const manifest: MetadataRoute.Manifest = {
      id: "/",
      name,
      short_name: name,
      description: "Plataforma de gestión para instituciones educativas",
      lang: "es",
      start_url: institution ? "/" : "/admin",
      scope: "/",
      display: "standalone",
      display_override: ["window-controls-overlay"],
      theme_color: "#10080a",
      background_color: "#faf9f6",
      icons: [
        { src: "/brand/pwa-192.png?v=2", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/brand/pwa-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/brand/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    };

    return Response.json(manifest, {
      headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    const status = error instanceof InstitutionalHostError ? error.status : 503;

    return new Response(null, { status, headers: { "Cache-Control": "no-store" } });
  }
}
