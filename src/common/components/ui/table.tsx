"use client";

import type { ComponentProps } from "react";

import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";

import { cn } from "@common/utils/cn.util";

type TableProps = ComponentProps<"table"> & {
  containerClassName?: string;
  stickyActions?: boolean;
};

function Table({ className, containerClassName, stickyActions = false, ...props }: TableProps) {
  return (
    <ScrollAreaPrimitive.Root type="auto" data-slot="table-container" className={cn("relative w-full overflow-hidden", containerClassName)}>
      <ScrollAreaPrimitive.Viewport
        tabIndex={0}
        className="focus-visible:outline-ring w-full focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <table
          data-slot="table"
          data-sticky-actions={stickyActions || undefined}
          className={cn("w-full caption-bottom text-sm", className)}
          {...props}
        />
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        data-slot="table-scrollbar"
        orientation="horizontal"
        className="flex h-2.5 cursor-grab touch-none select-none active:cursor-grabbing"
        style={{ position: "relative" }}
      >
        <ScrollAreaPrimitive.Thumb className="bg-primary relative h-full rounded-full" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  );
}

function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />;
}

function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return <tfoot data-slot="table-footer" className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)} {...props} />;
}

function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors", className)}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap first:pl-4 last:pr-4 [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("p-2 align-middle whitespace-nowrap first:pl-4 last:pr-4 [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: ComponentProps<"caption">) {
  return <caption data-slot="table-caption" className={cn("text-muted-foreground mt-4 text-sm", className)} {...props} />;
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
