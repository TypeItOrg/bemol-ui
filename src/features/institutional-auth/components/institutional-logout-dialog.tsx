"use client";

import { useActionState, type ReactElement } from "react";

import { LogoutConfirmationDialog } from "@common/components/logout-confirmation-dialog";

import { logoutInstitutional } from "@features/institutional-auth/actions/institutional-logout.action";

type InstitutionalLogoutDialogProps = {
  onClose: () => void;
};

export function InstitutionalLogoutDialog({ onClose }: InstitutionalLogoutDialogProps): ReactElement {
  const [, action, isPending] = useActionState<null, FormData>(async () => {
    await logoutInstitutional();

    return null;
  }, null);

  return <LogoutConfirmationDialog isPending={isPending} action={action} onClose={onClose} />;
}
