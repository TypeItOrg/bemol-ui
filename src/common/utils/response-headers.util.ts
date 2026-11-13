/** Private, non-sniffable proxy headers with the named upstream headers copied over. */
export function copyResponseHeaders(source: Response, names: readonly string[]): Headers {
  const headers = new Headers({ "cache-control": "private, no-store", "x-content-type-options": "nosniff" });

  for (const name of names) {
    const value = source.headers.get(name);

    if (value) {
      headers.set(name, value);
    }
  }

  return headers;
}
