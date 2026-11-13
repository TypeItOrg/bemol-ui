import type { ReactElement, ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import { cn } from "@common/utils/cn.util";

type DataTableIconBadgeProps = {
  className?: string;
  icon: LucideIcon;
  title?: string;
};

type DataTableIconLabelProps = {
  children: ReactNode;
  className?: string;
  icon: LucideIcon;
  title?: string;
};

export function DataTableIconBadge({ className, icon: Icon, title }: DataTableIconBadgeProps): ReactElement {
  return (
    <span
      title={title}
      data-slot="data-table-icon-badge"
      className={cn("bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full", className)}
    >
      <Icon className="size-4" aria-hidden="true" />
    </span>
  );
}

export function DataTableIconLabel({ children, className, icon, title }: DataTableIconLabelProps): ReactElement {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <DataTableIconBadge icon={icon} title={title} />
      {children}
    </span>
  );
}
