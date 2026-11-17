import type { ReactElement } from "react";

import { NavigationCardSkeleton } from "@common/components/navigation/navigation-card-skeleton";
import { Skeleton } from "@common/components/ui/skeleton";

import { InstitutionalBrandIdentity } from "@features/institutional-auth/components/institutional-brand-identity";
import type { PublicInstitution } from "@features/institutions/types/public-institution.types";

export function InstitutionalHomeSkeleton({
  institution,
}: {
  institution?: Pick<PublicInstitution, "id" | "name" | "logoUrl">;
} = {}): ReactElement {
  return (
    <main
      className="flex min-h-full flex-1 flex-col gap-4 min-[1600px]:[@media(min-height:860px)]:h-[calc(var(--app-viewport-height)-7.625rem)] min-[1600px]:[@media(min-height:860px)]:max-h-[calc(var(--app-viewport-height)-7.625rem)] min-[1600px]:[@media(min-height:860px)]:min-h-[540px] min-[1600px]:[@media(min-height:860px)]:flex-none min-[1600px]:[@media(min-height:860px)]:overflow-hidden"
      aria-label="Cargando portal institucional"
      role="status"
    >
      <header className="bg-muted/60 @container/home-hero relative flex h-56 min-w-0 items-center overflow-hidden shadow-sm @2xl/home-hero:h-64">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-r from-black/80 via-black/60 to-black/25 sm:from-black/85 sm:via-black/60 sm:via-[65%] sm:to-black/15 sm:to-[90%] 2xl:from-black/85 2xl:via-black/50 2xl:via-[50%] 2xl:to-black/5 2xl:to-[100%] dark:bg-black/20"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent dark:from-black/35" />
        <div className="relative flex max-w-3xl min-w-0 items-center gap-4 p-5 text-white @2xl/home-hero:p-6 @4xl/home-hero:p-8">
          <InstitutionalBrandIdentity
            institution={institution}
            darkBackground
            className="shrink-0"
            imageContainerClassName="h-28 w-28 @2xl/home-hero:h-32 @2xl/home-hero:w-32 @4xl/home-hero:h-36 @4xl/home-hero:w-36"
          />
          <div className="flex h-28 min-w-0 flex-col justify-center gap-3 py-1 @2xl/home-hero:h-32 @2xl/home-hero:gap-4 @4xl/home-hero:h-36 @4xl/home-hero:py-2">
            <div>
              <Skeleton className="h-8 w-48 max-w-full bg-white/25 @2xl/home-hero:w-60 @4xl/home-hero:h-9 @4xl/home-hero:w-72" />
              <Skeleton className="mt-2 h-4 w-40 max-w-full bg-white/20 @2xl/home-hero:h-5 @2xl/home-hero:w-56" />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 @2xl/home-hero:gap-x-4">
              <Skeleton className="h-4 w-32 bg-white/20 @2xl/home-hero:w-36" />
              <div className="hidden h-3.5 w-px bg-white/30 @2xl/home-hero:block" />
              <Skeleton className="h-6 w-24 rounded-full bg-white/20 @2xl/home-hero:w-28" />
            </div>
          </div>
        </div>
      </header>

      <div className="@container/home-workspace flex min-h-0 flex-1 flex-col gap-4 px-3 pb-3 md:px-4 md:pb-4">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 @6xl/home-workspace:grid-cols-[max-content_minmax(0,1fr)]">
          {/* Selector lateral skeleton */}
          <aside className="bg-background flex min-h-0 flex-col gap-3 rounded-xl border p-2.5 shadow-xs sm:p-3.5 @6xl/home-workspace:h-full @6xl/home-workspace:min-w-72">
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:flex lg:flex-row lg:flex-wrap @6xl/home-workspace:flex @6xl/home-workspace:flex-1 @6xl/home-workspace:flex-col @6xl/home-workspace:flex-nowrap">
              <Skeleton className="h-10 w-full rounded-lg lg:min-w-68 lg:flex-1 @6xl/home-workspace:min-w-0 @6xl/home-workspace:flex-none" />
              <Skeleton className="h-10 w-full rounded-lg lg:min-w-68 lg:flex-1 @6xl/home-workspace:min-w-0 @6xl/home-workspace:flex-none" />
              <Skeleton className="h-10 w-full rounded-lg lg:min-w-68 lg:flex-1 @6xl/home-workspace:min-w-0 @6xl/home-workspace:flex-none" />
              <Skeleton className="h-10 w-full rounded-lg lg:min-w-68 lg:flex-1 @6xl/home-workspace:min-w-0 @6xl/home-workspace:flex-none" />
              <Skeleton className="h-10 w-full rounded-lg lg:min-w-68 lg:flex-1 @6xl/home-workspace:min-w-0 @6xl/home-workspace:flex-none" />
            </div>
            <div className="bg-muted/70 dark:bg-muted/40 mt-auto hidden flex-col gap-1.5 rounded-lg px-3.5 py-3 @6xl/home-workspace:flex">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          </aside>

          {/* Panel de accesos skeleton */}
          <section className="bg-background flex min-h-0 flex-col gap-3.5 rounded-xl border p-4 shadow-xs sm:p-5 @6xl/home-workspace:h-full">
            <div className="flex shrink-0 items-stretch gap-3.5">
              <Skeleton className="w-12 shrink-0 rounded-xl" />
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72 max-w-full" />
              </div>
            </div>
            <div className="@container/home-content grid min-h-0 flex-1 auto-rows-[minmax(8.5rem,1fr)] grid-cols-6 gap-3 sm:gap-4">
              <NavigationCardSkeleton className="bg-background col-span-6 h-full min-h-34 items-stretch p-4 sm:p-5 @xl/home-content:col-span-3 [&>div:first-child]:h-full [&>div:first-child]:w-full [&>div:first-child]:flex-col [&>div:first-child]:items-start [&>div:first-child]:justify-between [&>div:first-child>div:first-child]:size-11 [&>div:first-child>div:first-child]:rounded-xl [&>div:first-child>div:last-child]:mt-auto [&>div:first-child>div:last-child]:w-full [&>div:first-child>div:last-child]:flex-none [&>div:last-child]:hidden" />
              <NavigationCardSkeleton className="bg-background col-span-6 h-full min-h-34 items-stretch p-4 sm:p-5 @xl/home-content:col-span-3 [&>div:first-child]:h-full [&>div:first-child]:w-full [&>div:first-child]:flex-col [&>div:first-child]:items-start [&>div:first-child]:justify-between [&>div:first-child>div:first-child]:size-11 [&>div:first-child>div:first-child]:rounded-xl [&>div:first-child>div:last-child]:mt-auto [&>div:first-child>div:last-child]:w-full [&>div:first-child>div:last-child]:flex-none [&>div:last-child]:hidden" />
              <NavigationCardSkeleton className="bg-background col-span-6 h-full min-h-34 items-stretch p-4 sm:p-5 @xl/home-content:col-span-3 [&>div:first-child]:h-full [&>div:first-child]:w-full [&>div:first-child]:flex-col [&>div:first-child]:items-start [&>div:first-child]:justify-between [&>div:first-child>div:first-child]:size-11 [&>div:first-child>div:first-child]:rounded-xl [&>div:first-child>div:last-child]:mt-auto [&>div:first-child>div:last-child]:w-full [&>div:first-child>div:last-child]:flex-none [&>div:last-child]:hidden" />
              <NavigationCardSkeleton className="bg-background col-span-6 h-full min-h-34 items-stretch p-4 sm:p-5 @xl/home-content:col-span-3 [&>div:first-child]:h-full [&>div:first-child]:w-full [&>div:first-child]:flex-col [&>div:first-child]:items-start [&>div:first-child]:justify-between [&>div:first-child>div:first-child]:size-11 [&>div:first-child>div:first-child]:rounded-xl [&>div:first-child>div:last-child]:mt-auto [&>div:first-child>div:last-child]:w-full [&>div:first-child>div:last-child]:flex-none [&>div:last-child]:hidden" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
