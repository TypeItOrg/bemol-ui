import type { ReactNode } from "react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Bemol",
    statusBarStyle: "default",
  },
};

export default function AdminLayout({ children }: { children: ReactNode }): ReactNode {
  return children;
}
