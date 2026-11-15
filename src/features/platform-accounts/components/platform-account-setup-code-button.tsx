"use client";

import type { ReactElement } from "react";

import { Button } from "@common/components/ui/button";

import { PlatformAccountSetupCodeFlow } from "@features/platform-accounts/components/platform-account-setup-code-flow";
import type { PlatformAccountAdmin } from "@features/platform-accounts/types/platform-account-admin.types";

export function PlatformAccountSetupCodeButton({ account }: { account: PlatformAccountAdmin }): ReactElement {
  return (
    <PlatformAccountSetupCodeFlow account={account} errorMode="inline">
      {({ issue, issuing, available }) =>
        available ? (
          <Button
            disabled={issuing || !account.enabled}
            size="lg"
            title={account.enabled ? undefined : "Habilitá la cuenta para generar un código."}
            type="button"
            variant="outline"
            onClick={issue}
          >
            {issuing ? "Generando…" : "Generar código de acceso"}
          </Button>
        ) : null
      }
    </PlatformAccountSetupCodeFlow>
  );
}
