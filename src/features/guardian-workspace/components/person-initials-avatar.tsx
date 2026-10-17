import type { ReactElement } from "react";

import { Avatar, AvatarFallback } from "@common/components/ui/avatar";
import { cn } from "@common/utils/cn.util";

export function PersonInitialsAvatar({ firstName, lastName, className }: { firstName: string; lastName: string; className?: string }): ReactElement {
  const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase() || "?";

  return (
    <Avatar aria-hidden="true" className={cn("size-8 rounded-md", className)}>
      <AvatarFallback className="bg-primary text-primary-foreground! rounded-md font-semibold">{initials}</AvatarFallback>
    </Avatar>
  );
}
