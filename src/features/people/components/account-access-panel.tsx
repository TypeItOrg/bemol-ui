"use client";

import { useActionState, useId, useState, type ReactElement } from "react";

import { useRouter } from "next/navigation";

import { useQuery } from "@tanstack/react-query";

import { ActionForm } from "@common/components/action-form";
import { Alert, AlertDescription } from "@common/components/ui/alert";
import { AlertDialogFooter } from "@common/components/ui/alert-dialog";
import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";
import { Skeleton } from "@common/components/ui/skeleton";
import { useActionFormErrorFocus } from "@common/hooks/use-action-form-error-focus";

import { manageAccountAccess, type ManageAccountAccessState } from "@features/people/actions/manage-account-access.action";
import { AccountAccessFields } from "@features/people/components/account-access-fields";
import { AccountAccessSuspendDialog } from "@features/people/components/account-access-suspend-dialog";
import { AccountInvitationDetails } from "@features/people/components/account-invitation-details";
import {
  ACCOUNT_ACCESS_OPERATION_LABELS,
  ACCOUNT_ACCESS_STATUS_LABELS,
  getAvailableAccountAccessOperations,
  type AccountAccessOperation,
} from "@features/people/utils/account-access-options.util";
import { accountAccessQueryOptions } from "@features/people/utils/account-access-query.util";
import type { PeopleScope } from "@features/people/utils/people-scope.util";

export function AccountAccessPanel({
  institutionId,
  personId,
  scope = "institutional",
  mode = "owner",
  email = "",
  onClose,
  onPendingChange,
}: {
  institutionId: string;
  personId: string;
  scope?: PeopleScope;
  mode?: "owner" | "guardian" | "administration";
  email?: string;
  onClose: () => void;
  onPendingChange?: (pending: boolean) => void;
}): ReactElement {
  const id = useId();

  const router = useRouter();

  const isOwner = mode === "owner";

  const [selectedOperation, setSelectedOperation] = useState<AccountAccessOperation>(isOwner ? "email" : "invite");

  const [confirmingSuspend, setConfirmingSuspend] = useState(false);

  const query = useQuery({ ...accountAccessQueryOptions(scope, institutionId, personId), enabled: !isOwner });

  const [state, action, pending] = useActionState(async (previous: ManageAccountAccessState, form: FormData) => {
    onPendingChange?.(true);

    try {
      const result = await manageAccountAccess(scope, institutionId, personId, previous, form);

      if (result.success) {
        if (!isOwner) {
          await query.refetch();
        }

        router.refresh();
      }

      return result;
    } finally {
      onPendingChange?.(false);
    }
  }, {});

  const formRef = useActionFormErrorFocus(state, pending);

  const invitation = query.data?.invitation;

  const options = !isOwner && query.data ? getAvailableAccountAccessOperations(query.data.status, invitation?.status === "PENDING", mode) : [];

  const activeOption = options.find((option) => option.value === selectedOperation) ?? options[0];

  const operation = isOwner ? "email" : (activeOption?.value ?? "invite");

  const fields = (
    <AccountAccessFields
      id={id}
      owner={isOwner}
      operation={operation}
      options={options}
      onOperationChange={setSelectedOperation}
      email={email}
      pending={pending}
      state={state}
    />
  );

  const isSuspend = operation === "suspend";

  const submitButton = (
    <Button
      type={isSuspend ? "button" : "submit"}
      size="lg"
      disabled={pending || (!isOwner && query.isPending)}
      variant={operation === "autonomy" || isSuspend ? "destructive" : "default"}
      onClick={isSuspend ? () => setConfirmingSuspend(true) : undefined}
    >
      {pending ? "Solicitando…" : (activeOption?.label ?? ACCOUNT_ACCESS_OPERATION_LABELS[operation])}
    </Button>
  );

  const panelSection = isOwner ? (
    fields
  ) : (
    <section className="bg-muted/25 space-y-5 rounded-xl border p-4 sm:p-5">
      {query.isPending ? (
        <div className="space-y-5" role="status" aria-label="Cargando acceso">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-17 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}
      {query.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            No se pudo consultar el acceso.{" "}
            <Button type="button" variant="link" onClick={() => void query.refetch()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {query.data ? (
        <>
          <div className="bg-background space-y-3 rounded-lg border p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Estado del acceso</span>
              <Badge variant="outline">{ACCOUNT_ACCESS_STATUS_LABELS[query.data.status] ?? query.data.status}</Badge>
            </div>
            {invitation ? <AccountInvitationDetails invitation={invitation} /> : null}
          </div>
          {options.length > 0 ? fields : null}
        </>
      ) : null}
    </section>
  );

  const suspendDialog = confirmingSuspend ? (
    <AccountAccessSuspendDialog
      onOpenChange={setConfirmingSuspend}
      onConfirm={() => {
        setConfirmingSuspend(false);
        formRef.current?.requestSubmit();
      }}
    />
  ) : null;

  return (
    <ActionForm
      ref={formRef}
      noValidate
      resetOnSuccess={Boolean(state.success)}
      action={action}
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-5"
    >
      <div className="-mx-5 min-h-0 flex-1 overflow-y-auto px-5">{panelSection}</div>
      <AlertDialogFooter className="shrink-0">
        <Button disabled={pending} size="lg" type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        {isOwner || query.isPending || options.length > 0 ? submitButton : null}
      </AlertDialogFooter>
      {suspendDialog}
    </ActionForm>
  );
}
