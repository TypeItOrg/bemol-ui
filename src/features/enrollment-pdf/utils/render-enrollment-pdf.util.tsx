import type { EnrollmentPdfData } from "@features/enrollment-pdf/types/enrollment-pdf-data.types";
import { getInstitutionLogoUrl } from "@features/institutions/utils/institution-logo-url.util";

async function loadLogo(data: EnrollmentPdfData): Promise<string | undefined> {
  const path = data.institutionId ? getInstitutionLogoUrl(data.institutionId, data.logoUrl) : null;

  if (!path) {
    return undefined;
  }

  const url = new URL(path, window.location.origin);

  url.searchParams.set("format", "png");

  try {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok || response.headers.get("content-type")?.split(";")[0].trim() !== "image/png") {
      return undefined;
    }

    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

export async function renderEnrollmentPdf(data: EnrollmentPdfData): Promise<Blob> {
  const [{ pdf }, { EnrollmentPdfDocument }, { registerEnrollmentPdfFonts }, logo] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@features/enrollment-pdf/components/enrollment-pdf-document"),
    import("@features/enrollment-pdf/utils/register-enrollment-pdf-fonts.util"),
    loadLogo(data),
  ]);

  registerEnrollmentPdfFonts(window.location.origin);

  return pdf(<EnrollmentPdfDocument data={data} logo={logo} />).toBlob();
}
