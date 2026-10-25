const THEME_COLORS = new Map([
  ["light", "#faf9f6"],
  ["dark", "#10080a"],
]);

const THEME_COLOR_META_SELECTOR = 'meta[name="theme-color"]';

export const PWA_THEME_COLOR_SCRIPT = `
  document.querySelector('${THEME_COLOR_META_SELECTOR}')?.setAttribute(
    "content",
    document.documentElement.style.colorScheme === "dark" ? "${THEME_COLORS.get("dark")}" : "${THEME_COLORS.get("light")}"
  );
`;

const PRODUCTION_ENVIRONMENT = "production";

const SERVICE_WORKER_URL = "/sw.js";

const SERVICE_WORKER_OPTIONS: RegistrationOptions = { scope: "/", updateViaCache: "none" };

export function registerPwaServiceWorker(): void {
  const isProduction = process.env.NODE_ENV === PRODUCTION_ENVIRONMENT;

  if (!isProduction) {
    return;
  }

  const serviceWorker = typeof navigator === "undefined" ? undefined : navigator.serviceWorker;

  if (!serviceWorker) {
    return;
  }

  void serviceWorker.register(SERVICE_WORKER_URL, SERVICE_WORKER_OPTIONS).catch(() => {
    console.warn("[PWA] No se pudo preparar el aviso sin conexión. La aplicación sigue disponible online.");
  });
}

export function syncPwaThemeColor(theme: string | undefined): void {
  const color = theme ? THEME_COLORS.get(theme) : undefined;

  if (!color) {
    return;
  }

  document.querySelector<HTMLMetaElement>(THEME_COLOR_META_SELECTOR)?.setAttribute("content", color);
}
