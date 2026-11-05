import type { ReactElement } from "react";

import { InstitutionalEmailSettings } from "@features/institutional-auth/components/institutional-email-settings";
import { InstitutionalProfileForm } from "@features/institutional-auth/components/institutional-profile-form";
import { InstitutionalProfileSummary } from "@features/institutional-auth/components/institutional-profile-summary";
import type { InstitutionalPerson } from "@features/institutional-auth/types/institutional-person.types";

export { InstitutionalProfileForm };

type InstitutionalProfileProps = {
  person: InstitutionalPerson;
  canManageEmail: boolean;
  canEditContactEmail: boolean;
};

export function InstitutionalProfile({ person, canManageEmail, canEditContactEmail }: InstitutionalProfileProps): ReactElement {
  return (
    <>
      <InstitutionalProfileSummary person={person} />
      <InstitutionalEmailSettings
        key={person.personId}
        institutionId={person.institutionId}
        personId={person.personId}
        email={person.email}
        canManageEmail={canManageEmail}
        canEditContactEmail={canEditContactEmail}
      />
    </>
  );
}
