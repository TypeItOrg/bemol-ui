import { Suspense, type ReactElement } from "react";

import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";
import { PlatformDashboardContent } from "@features/platform-dashboard/components/platform-dashboard-content";
import { PlatformDashboardErrorBoundary } from "@features/platform-dashboard/components/platform-dashboard-error";
import { PlatformDashboardSkeleton } from "@features/platform-dashboard/components/platform-dashboard-skeleton";

export const metadata = {
  title: "Inicio",
  other: { "application-title": "Inicio" },
  description: "Resumen general de la actividad de la plataforma.",
};

export default function PlatformPage(): ReactElement {
  return (
    <PlatformPageShell title="Inicio" hideHeader contentVariant="plain">
      <Suspense fallback={<PlatformDashboardSkeleton />}>
        <PlatformDashboardErrorBoundary>
          <PlatformDashboardContent />
        </PlatformDashboardErrorBoundary>
      </Suspense>
    </PlatformPageShell>
  );
}
