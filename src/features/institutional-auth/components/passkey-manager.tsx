"use client";

import { useState, type ReactElement } from "react";

import { useRouter } from "next/navigation";

import { PlusIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";

import { revokePasskeyAction } from "@features/institutional-auth/actions/passkey-management.actions";
import { PasskeyReauthDialog } from "@features/institutional-auth/components/passkey-reauth-dialog";
import { PasskeyRegistrationDialog } from "@features/institutional-auth/components/passkey-registration-dialog";
import { PasskeyRenameDialog } from "@features/institutional-auth/components/passkey-rename-dialog";
import { PasskeyRevokeDialog } from "@features/institutional-auth/components/passkey-revoke-dialog";
import { PasskeysTablePresentation } from "@features/institutional-auth/components/passkeys-table-presentation";
import { useWebAuthnSupport } from "@features/institutional-auth/hooks/use-webauthn-support.hook";
import type { Passkey } from "@features/institutional-auth/types/passkey.types";
import type { ReAuthenticateState } from "@features/institutional-auth/types/re-authenticate-state.types";
import { DEFAULT_PASSKEY_SORT, type PasskeySort } from "@features/institutional-auth/utils/passkey-query.util";
import { revokePlatformPasskey } from "@features/platform-auth/actions/platform-passkey.actions";
import { PlatformCollectionActions } from "@features/platform-auth/components/platform-collection-actions";

type PasskeyOperation = { kind: "register"; label: string } | { kind: "revoke"; passkey: Passkey };
type PasskeyDialog = PasskeyOperation | { kind: "rename"; passkey: Passkey } | { kind: "reauth"; next: PasskeyOperation };

type PasskeyManagerProps = {
  activePasskeys?: number;
  initialPasskeys: Passkey[];
  maxActivePasskeys: number;
  platform?: boolean;
  search?: string;
  sort?: PasskeySort;
  used?: boolean;
};

export function PasskeyManager({
  activePasskeys,
  initialPasskeys,
  maxActivePasskeys,
  platform = false,
  search = "",
  sort = DEFAULT_PASSKEY_SORT,
  used,
}: PasskeyManagerProps): ReactElement {
  const router = useRouter();

  const [dialog, setDialog] = useState<PasskeyDialog | null>(null);

  const webauthnSupported = useWebAuthnSupport();

  const activeCount = activePasskeys ?? initialPasskeys.length;

  function close(): void {
    setDialog(null);
  }

  function complete(): void {
    close();
    router.refresh();
  }

  async function resumeOperation(next: PasskeyOperation): Promise<ReAuthenticateState> {
    if (next.kind === "register") {
      setDialog(next);

      return {};
    }

    const result = await (platform ? revokePlatformPasskey : revokePasskeyAction)(next.passkey.id);

    if (result.error) {
      return result;
    }

    complete();

    return {};
  }

  return (
    <div className="flex flex-col gap-4">
      <PlatformCollectionActions className="sm:justify-start">
        <Button
          className="w-full"
          disabled={activeCount >= maxActivePasskeys || !webauthnSupported}
          onClick={() => setDialog({ kind: "register", label: "" })}
          size="lg"
          type="button"
        >
          <PlusIcon data-icon="inline-start" />
          Añadir llave de acceso
        </Button>
      </PlatformCollectionActions>

      <DataTableNavigationProvider>
        <PasskeysTablePresentation
          activeCount={activeCount}
          maxActivePasskeys={maxActivePasskeys}
          passkeys={initialPasskeys}
          platform={platform}
          search={search}
          sort={sort}
          used={used}
          webauthnSupported={webauthnSupported}
          onRename={(passkey) => setDialog({ kind: "rename", passkey })}
          onRevoke={(passkey) => setDialog({ kind: "revoke", passkey })}
        />
      </DataTableNavigationProvider>

      {dialog?.kind === "register" ? (
        <PasskeyRegistrationDialog
          platform={platform}
          initialLabel={dialog.label}
          onClose={close}
          onSuccess={complete}
          onRequireReauth={(label) => setDialog({ kind: "reauth", next: { kind: "register", label } })}
        />
      ) : null}
      {dialog?.kind === "rename" ? <PasskeyRenameDialog platform={platform} passkey={dialog.passkey} onClose={close} onSuccess={complete} /> : null}
      {dialog?.kind === "revoke" ? (
        <PasskeyRevokeDialog
          platform={platform}
          passkey={dialog.passkey}
          onClose={close}
          onSuccess={complete}
          onRequireReauth={() => setDialog({ kind: "reauth", next: dialog })}
        />
      ) : null}
      {dialog?.kind === "reauth" ? (
        <PasskeyReauthDialog
          platform={platform}
          target={dialog.next.kind === "register" ? "register" : `revoke:${dialog.next.passkey.id}`}
          onClose={close}
          onVerified={() => resumeOperation(dialog.next)}
        />
      ) : null}
    </div>
  );
}
