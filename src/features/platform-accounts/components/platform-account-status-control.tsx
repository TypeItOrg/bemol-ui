"use client";

import { useState, useTransition, type ReactElement } from "react";

import { useRouter } from "next/navigation";

import { CircleAlertIcon, Loader2Icon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";

import { updatePlatformAccountStatusAction } from "@features/platform-accounts/actions/update-platform-account-status.action";
import { PlatformAccountDisableDialog } from "@features/platform-accounts/components/platform-account-disable-dialog";
import type { PlatformAccountAdmin } from "@features/platform-accounts/types/platform-account-admin.types";
import { usePlatformAccount } from "@features/platform-auth/hooks/use-platform-account.hook";

type PlatformAccountStatusControlProps = {
  account: PlatformAccountAdmin;
};

export function PlatformAccountStatusControl({ account }: PlatformAccountStatusControlProps): ReactElement {
  const { platformAccountId: accountId, enabled } = account;

  const router = useRouter();

  const { account: currentAccount } = usePlatformAccount();

  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string>();

  const [disableOpen, setDisableOpen] = useState(false);

  const isCurrentAccount = currentAccount?.platformAccountId === accountId;

  const nextEnabled = !enabled;

  function updateStatus(): void {
    setError(undefined);
    startTransition(async () => {
      const result = await updatePlatformAccountStatusAction(accountId, nextEnabled);

      if (result.error) {
        setError(result.error);

        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>No se pudo cambiar el estado</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        size="lg"
        variant={enabled ? "destructive" : "default"}
        onClick={enabled ? () => setDisableOpen(true) : updateStatus}
        disabled={isPending || (enabled && (!currentAccount || isCurrentAccount))}
      >
        {isPending ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : null}
        {getStatusActionLabel(enabled, isPending)}
      </Button>
      {disableOpen ? <PlatformAccountDisableDialog account={account} onClose={() => setDisableOpen(false)} /> : null}
    </div>
  );
}

function getStatusActionLabel(enabled: boolean, isPending: boolean): string {
  if (isPending) {
    return enabled ? "Deshabilitando..." : "Habilitando...";
  }

  return enabled ? "Deshabilitar" : "Habilitar";
}
