const THEME_COLORS = new Map([
  ["light", "#faf9f6"],
  ["dark", "#10080a"],
]);

const THEME_COLOR_META_SELECTOR = 'meta[name="theme-color"]';

// Keep theme-color outside route metadata so navigation cannot reset the selected theme.
export const PWA_THEME_COLOR_SCRIPT = `
  (() => {
    const meta = document.querySelector('${THEME_COLOR_META_SELECTOR}') ?? document.createElement("meta");
    meta.name = "theme-color";
    meta.content = document.documentElement.style.colorScheme === "dark" ? "${THEME_COLORS.get("dark")}" : "${THEME_COLORS.get("light")}";
    document.head.appendChild(meta);
  })();
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

export function syncPwaWindowTitle(onTitleChange: (title: string) => void): () => void {
  const displayMode = window.matchMedia?.("(display-mode: standalone), (display-mode: minimal-ui), (display-mode: window-controls-overlay)");

  let browserTitle = document.title;

  let appliedTitle: string | undefined;

  function syncTitle(): void {
    if (document.title !== appliedTitle) {
      browserTitle = document.title;
    }

    const standalone = displayMode?.matches || ("standalone" in navigator && navigator.standalone === true);

    const pageTitle = document.querySelector<HTMLMetaElement>('meta[name="application-title"]')?.content.trim();

    const appName = document.querySelector<HTMLMetaElement>('meta[name="application-name"]')?.content.trim();

    const overlayTitle = pageTitle && appName ? `${pageTitle} | ${appName}` : appName || browserTitle;

    // Native window titles already include the installed application name.
    const title = standalone ? pageTitle || appName || browserTitle : browserTitle;

    if (document.title !== title) {
      document.title = title;
    }

    appliedTitle = title;
    onTitleChange(overlayTitle);
  }

  const observer = new MutationObserver(syncTitle);

  observer.observe(document.head, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["content"] });
  displayMode?.addEventListener("change", syncTitle);
  syncTitle();

  return () => {
    observer.disconnect();
    displayMode?.removeEventListener("change", syncTitle);

    if (document.title === appliedTitle) {
      document.title = browserTitle;
    }
  };
}
