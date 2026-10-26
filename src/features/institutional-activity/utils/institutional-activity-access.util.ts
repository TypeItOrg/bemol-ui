import { MailIcon, ScrollTextIcon } from "lucide-react";

import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import type { InstitutionalHomeLink } from "@features/institutional-auth/utils/institutional-home-access.util";
import { hasInstitutionalPermission } from "@features/institutional-auth/utils/institutional-permission.util";

export function getInstitutionalActivityHomeLinks(user: Pick<InstitutionalUser, "permissions">): InstitutionalHomeLink[] {
  return [
    {
      href: "/audit-events",
      title: "Auditoría",
      description: "Consultá las acciones registradas en la institución.",
      icon: ScrollTextIcon,
      permission: INSTITUTIONAL_PERMISSION.AUDIT_READ,
    },
    {
      href: "/emails",
      title: "Correos",
      description: "Consultá los intentos de envío y sus resultados.",
      icon: MailIcon,
      permission: INSTITUTIONAL_PERMISSION.EMAIL_READ,
    },
  ].filter((link) => hasInstitutionalPermission(user, link.permission));
}
