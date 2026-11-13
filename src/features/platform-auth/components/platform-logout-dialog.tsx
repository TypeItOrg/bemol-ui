"use client";

import type { ReactElement } from "react";

import { LogoutConfirmationDialog } from "@common/components/logout-confirmation-dialog";

import { useLogoutPlatform } from "@features/platform-auth/hooks/use-logout-platform.hook";

type PlatformLogoutDialogProps = {
  onClose: () => void;
};

export function PlatformLogoutDialog({ onClose }: PlatformLogoutDialogProps): ReactElement {
  const logout = useLogoutPlatform();

  return <LogoutConfirmationDialog isPending={logout.isPending} action={() => logout.mutate()} onClose={onClose} />;
}
