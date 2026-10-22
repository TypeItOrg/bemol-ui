import type { ReactNode } from "react";

import type { Metadata } from "next";

import { BEMOL_FAVICON_ICONS } from "@common/utils/brand-favicon.util";

export const metadata: Metadata = {
  icons: BEMOL_FAVICON_ICONS,
};

export default function PlatformAuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <section className="w-full max-w-sm md:max-w-4xl">{children}</section>
    </main>
  );
}
