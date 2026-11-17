import type { ReactElement } from "react";

import Link from "next/link";

import { FadeImage } from "@common/components/fade-image";
import { cn } from "@common/utils/cn.util";

import type { InstitutionalHomeLink } from "@features/institutional-auth/utils/institutional-home-access.util";

const HOME_CARD_IMAGES = [
  "/images/institutional-management.webp",
  "/images/subjects/piano.webp",
  "/images/academic-management.webp",
  "/images/subjects/ensemble.webp",
  "/images/subjects/score.webp",
] as const;

export interface InstitutionalHomeCardProps {
  index: number;
  link: InstitutionalHomeLink;
  totalCount: number;
}

export function InstitutionalHomeCard({ index, link, totalCount }: InstitutionalHomeCardProps): ReactElement {
  const Icon = link.icon;

  const isFullSpan = totalCount <= 2 || (totalCount % 2 === 1 && index === totalCount - 1);

  const imageSrc = HOME_CARD_IMAGES[index % HOME_CARD_IMAGES.length];

  return (
    <Link
      href={link.href}
      className={cn(
        "focus-visible:ring-ring group relative flex h-full min-h-34 min-w-0 flex-col items-start justify-between gap-3 overflow-hidden rounded-xl border border-white/10 bg-(--card-surface) p-4 text-[oklch(0.97_0.006_80)] shadow-xs transition-colors [--card-surface:oklch(0.22_0.02_18)] hover:border-white/25 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset sm:p-5 dark:[--card-surface:oklch(0.145_0.015_10)]",
        isFullSpan ? "col-span-6" : "col-span-6 @xl/home-content:col-span-3",
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-3/5 overflow-hidden">
        <FadeImage
          src={imageSrc}
          alt=""
          fill
          sizes="(max-width: 1023px) 240px, 420px"
          className="object-cover object-center opacity-55 transition-opacity duration-300 group-hover:opacity-75 dark:opacity-35 dark:group-hover:opacity-55"
        />
        <div className="absolute inset-0 bg-linear-to-r from-(--card-surface) from-12% via-(--card-surface)/75 via-42% to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-(--card-surface)/65 via-transparent to-transparent dark:from-(--card-surface)/85" />
      </div>
      <span className="dark:text-primary relative z-10 flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-(--card-surface)/90 text-[oklch(0.66_0.18_15.5)] shadow-xs backdrop-blur-xs transition-colors group-hover:border-white/20">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="relative z-10 mt-auto w-full min-w-0">
        <span className="block truncate text-base font-semibold tracking-tight sm:text-lg">{link.title}</span>
        <span className="mt-0.5 block truncate text-sm leading-relaxed text-[oklch(0.88_0.008_80)] dark:text-[oklch(0.84_0.01_65)]">
          {link.description}
        </span>
      </span>
    </Link>
  );
}
