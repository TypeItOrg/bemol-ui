import { Font } from "@react-pdf/renderer";

// Words stay whole; only tokens too long for a field (emails, URLs) may break, preferably after separators.
function splitLongWord(word: string): string[] {
  if (word.length <= 24) {
    return [word];
  }

  return word.split(/(?<=[/.@_\-])/).flatMap((part) => (part.length > 16 ? (part.match(/.{1,8}/gu) ?? [part]) : [part]));
}

let registeredOrigin: string | undefined;

export function registerEnrollmentPdfFonts(origin: string): void {
  if (registeredOrigin === origin) {
    return;
  }

  const source = (weight: number) => new URL(`/fonts/manrope/manrope-latin-${weight}-normal.woff`, origin).href;

  Font.register({
    family: "Manrope",
    fonts: [
      { src: source(400), fontWeight: 400 },
      { src: source(500), fontWeight: 500 },
      { src: source(700), fontWeight: 700 },
      // Manrope has no italic; the regular face keeps missing values legible.
      { src: source(400), fontWeight: 400, fontStyle: "italic" },
    ],
  });
  Font.registerHyphenationCallback(splitLongWord);
  registeredOrigin = origin;
}
