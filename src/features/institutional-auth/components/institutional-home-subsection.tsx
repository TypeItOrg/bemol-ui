"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactElement, type ReactNode } from "react";

import { cn } from "@common/utils/cn.util";

const SCROLL_SHADOW_OFFSET_PX = 24;

export function InstitutionalHomeSelector({ sections }: InstitutionalHomeSelectorProps): ReactElement {
  const [selectedId, setSelectedId] = useState<string>(() => sections[0]?.id ?? "");

  const [scrollShadows, setScrollShadows] = useState({ bottom: false, top: false });

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const contentRef = useRef<HTMLDivElement | null>(null);

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const activeSection = sections.find((section) => section.id === selectedId) ?? sections[0];

  const updateScrollShadows = useCallback(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    const remainingBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;

    const nextTop = scroller.scrollTop > SCROLL_SHADOW_OFFSET_PX;

    const nextBottom = remainingBottom > SCROLL_SHADOW_OFFSET_PX;

    setScrollShadows((previous) => {
      if (previous.top === nextTop && previous.bottom === nextBottom) {
        return previous;
      }

      return { bottom: nextBottom, top: nextTop };
    });
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;

    if (scroller) {
      scroller.scrollTop = 0;
    }

    const frameId = window.requestAnimationFrame(updateScrollShadows);

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateScrollShadows) : null;

    if (observer && scroller) {
      observer.observe(scroller);
    }

    if (observer && contentRef.current) {
      observer.observe(contentRef.current);
    }

    window.addEventListener("resize", updateScrollShadows);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener("resize", updateScrollShadows);
    };
  }, [activeSection?.id, updateScrollShadows]);

  if (!activeSection) {
    return <></>;
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number): void {
    let nextIndex = -1;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % sections.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + sections.length) % sections.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = sections.length - 1;
    }

    if (nextIndex === -1) {
      return;
    }

    event.preventDefault();

    const nextSection = sections[nextIndex];

    if (!nextSection) {
      return;
    }

    setSelectedId(nextSection.id);
    tabRefs.current[nextSection.id]?.focus();
  }

  const totalAccessCount = sections.reduce((total, section) => total + section.itemCount, 0);

  return (
    <div className="@container/home-workspace flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 @6xl/home-workspace:grid-cols-[max-content_minmax(0,1fr)]">
        <aside className="bg-background flex min-h-0 flex-col gap-3 rounded-xl border p-2.5 shadow-xs sm:p-3.5 @6xl/home-workspace:h-full @6xl/home-workspace:min-w-72">
          <div
            role="tablist"
            aria-label="Secciones de inicio"
            aria-orientation="vertical"
            className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:flex lg:flex-row lg:flex-wrap @6xl/home-workspace:-mr-2.5 @6xl/home-workspace:flex @6xl/home-workspace:min-h-0 @6xl/home-workspace:flex-1 @6xl/home-workspace:flex-col @6xl/home-workspace:flex-nowrap @6xl/home-workspace:justify-start @6xl/home-workspace:gap-1 @6xl/home-workspace:overflow-y-auto @6xl/home-workspace:overscroll-contain @6xl/home-workspace:pr-2.5 @6xl/home-workspace:sm:-mr-3 @6xl/home-workspace:sm:pr-3"
          >
            {sections.map((section, index) => {
              const isSelected = section.id === activeSection.id;

              return (
                <button
                  key={section.id}
                  ref={(element) => {
                    tabRefs.current[section.id] = element;
                  }}
                  type="button"
                  role="tab"
                  id={`${section.id}-tab`}
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setSelectedId(section.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={cn(
                    "focus-visible:ring-ring relative flex min-h-10 w-full shrink-0 cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent px-3.5 py-2.5 text-left text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none lg:w-auto lg:min-w-68 lg:flex-1 @6xl/home-workspace:w-full @6xl/home-workspace:min-w-0 @6xl/home-workspace:flex-none @6xl/home-workspace:gap-6",
                    "aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:shadow-xs",
                    !isSelected && "text-foreground hover:bg-muted/60",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    {section.menuIcon}
                    <span className="whitespace-nowrap">{section.title}</span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      isSelected ? "bg-black/20 text-white dark:bg-white/20" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {section.itemCount}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="bg-muted/70 dark:bg-muted/40 mt-auto hidden flex-col gap-0.5 rounded-lg px-3.5 py-3 @6xl/home-workspace:flex">
            <p className="text-foreground text-xs font-semibold tracking-tight">
              {sections.length} {sections.length === 1 ? "sección disponible" : "secciones disponibles"}
            </p>
            <p className="text-muted-foreground text-xs">
              {totalAccessCount} {totalAccessCount === 1 ? "acceso habilitado" : "accesos habilitados"}
            </p>
          </div>
        </aside>

        <section
          role="tabpanel"
          aria-labelledby={`${activeSection.id}-tab`}
          className="bg-background flex min-h-0 flex-col gap-3.5 rounded-xl border p-4 shadow-xs sm:p-5 @6xl/home-workspace:h-full"
        >
          <div className="flex shrink-0 items-stretch gap-3.5">
            <div className="from-primary to-primary/80 text-primary-foreground flex w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-xs">
              {activeSection.headerIcon}
            </div>
            <div className="min-w-0 flex-1">
              <h2 id={activeSection.id} className="truncate text-xl leading-none font-bold tracking-tight">
                {activeSection.title}
              </h2>
              <p className="text-muted-foreground mt-1.5 truncate text-sm leading-normal">{activeSection.description}</p>
            </div>
          </div>

          <div className="relative flex flex-col @6xl/home-workspace:-mr-2.5 @6xl/home-workspace:min-h-0 @6xl/home-workspace:flex-1 @6xl/home-workspace:overflow-hidden @6xl/home-workspace:sm:-mr-3">
            <div
              aria-hidden="true"
              className={cn(
                "from-background/90 pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-5 bg-linear-to-b to-transparent transition-opacity duration-200 @6xl/home-workspace:block",
                scrollShadows.top ? "opacity-100" : "opacity-0",
              )}
            />

            <div
              ref={scrollerRef}
              onScroll={updateScrollShadows}
              className="@container/home-content @6xl/home-workspace:min-h-0 @6xl/home-workspace:flex-1 @6xl/home-workspace:overflow-y-auto @6xl/home-workspace:overscroll-contain @6xl/home-workspace:pr-2.5 @6xl/home-workspace:sm:pr-3"
            >
              <div ref={contentRef} className="flex min-h-full flex-col">
                {activeSection.content}
              </div>
            </div>

            <div
              aria-hidden="true"
              className={cn(
                "from-background/90 pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden h-5 bg-linear-to-t to-transparent transition-opacity duration-200 @6xl/home-workspace:block",
                scrollShadows.bottom ? "opacity-100" : "opacity-0",
              )}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export type InstitutionalHomeSectionItem = {
  content: ReactNode;
  description: string;
  headerIcon: ReactNode;
  id: string;
  itemCount: number;
  menuIcon: ReactNode;
  title: string;
};

export type InstitutionalHomeSelectorProps = {
  sections: readonly InstitutionalHomeSectionItem[];
};
