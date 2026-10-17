"use client";

import type { ReactElement, ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";

export function FormCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
}): ReactElement {
  return (
    <section className="bg-muted/25 min-w-0 rounded-xl border p-4 sm:p-5">
      <header className="-mx-4 border-b px-4 pb-4 sm:-mx-5 sm:px-5 sm:pb-5">
        <SectionHeader icon={icon} title={title} description={description} />
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}
