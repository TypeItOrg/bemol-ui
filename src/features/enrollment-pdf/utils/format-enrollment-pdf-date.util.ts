const formatter = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Cordoba",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatEnrollmentPdfDate(value: string): string {
  const parts = Object.fromEntries(formatter.formatToParts(new Date(value)).map((part) => [part.type, part.value]));

  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}
