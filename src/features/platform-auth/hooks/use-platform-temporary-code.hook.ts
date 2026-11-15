"use client";

import { useActionState, useState } from "react";

import type { ReAuthenticateState } from "@features/institutional-auth/types/re-authenticate-state.types";
import type { PlatformTemporaryCodeState } from "@features/platform-auth/types/platform-temporary-code-state.types";

type IssuedTemporaryCode = { code: string; expiresAt?: string; recovery?: boolean };

type UsePlatformTemporaryCodeOptions = {
  issue: () => Promise<PlatformTemporaryCodeState>;
  cancel: () => Promise<PlatformTemporaryCodeState>;
  issueLabel: string;
  issueErrorMessage: string;
};

export function usePlatformTemporaryCode({ issue, cancel, issueLabel, issueErrorMessage }: UsePlatformTemporaryCodeOptions) {
  const [issued, setIssued] = useState<IssuedTemporaryCode | null>(null);

  const [reauthOpen, setReauthOpen] = useState(false);

  function applyIssued(result: PlatformTemporaryCodeState): boolean {
    if (!result.code) {
      return false;
    }

    setIssued({ code: result.code, expiresAt: result.expiresAt, recovery: result.recovery });

    return true;
  }

  const [issueState, issueAction, issuing] = useActionState<PlatformTemporaryCodeState>(async () => {
    const result = await issue();

    if (result.requiresReauth) {
      setReauthOpen(true);

      return {};
    }

    applyIssued(result);

    return result;
  }, {});

  const [cancelState, cancelAction, cancelling] = useActionState<PlatformTemporaryCodeState>(async () => {
    const result = await cancel();

    if (result.cancelled) {
      setIssued(null);
    }

    return result;
  }, {});

  async function handleVerifiedReauth(): Promise<ReAuthenticateState> {
    const result = await issue();

    if (result.error) {
      return { error: result.error };
    }

    if (!applyIssued(result)) {
      return { error: issueErrorMessage };
    }

    setReauthOpen(false);

    return {};
  }

  function getIssueLabel(): string {
    if (issuing) {
      return "Generando…";
    }

    return issued ? "Generar nuevo código" : issueLabel;
  }

  return {
    issued,
    issueAction,
    cancelAction,
    issuing,
    cancelling,
    pending: issuing || cancelling,
    error: issueState.error ?? cancelState.error,
    issueLabel: getIssueLabel(),
    reauthOpen,
    closeReauth: () => setReauthOpen(false),
    dismiss: () => setIssued(null),
    handleVerifiedReauth,
  };
}
