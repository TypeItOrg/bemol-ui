import type { ReactNode } from "react";

import type { Metadata } from "next";

import { IPHONE_STARTUP_IMAGES } from "@common/utils/pwa-startup-images.util";

const APP_NAME = "Administración - Bemol";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    template: `%s | ${APP_NAME}`,
    absolute: APP_NAME,
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
    startupImage: IPHONE_STARTUP_IMAGES,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }): ReactNode {
  return children;
}
