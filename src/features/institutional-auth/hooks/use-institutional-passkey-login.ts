"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { beginInstitutionalPasskeyLogin } from "@features/institutional-auth/actions/begin-passkey-login.action";
import { finishPasskeyLogin } from "@features/institutional-auth/actions/finish-passkey-login.action";
import { INSTITUTIONAL_AUTH_ERROR_MESSAGES } from "@features/institutional-auth/constants/error-messages.constants";
import type { BeginPasskeyLoginState } from "@features/institutional-auth/types/begin-passkey-login-state.types";
import type { InstitutionalPasskeyLoginInput } from "@features/institutional-auth/types/institutional-passkey-login-input.types";
import { getPasskeyAssertion, isUserCancelled, toPublicKeyRequestOptions } from "@features/institutional-auth/utils/passkey-authentication.util";
import { isWebAuthnSupported } from "@features/institutional-auth/utils/webauthn-capability.util";

type PasskeyCeremonyState = { phase: "idle" | "requesting" | "verifying" };
type InstitutionalPasskeyLoginProps = {
  input: InstitutionalPasskeyLoginInput;
  onFieldErrors: (errors: BeginPasskeyLoginState["fieldErrors"]) => void;
  rememberMe: boolean;
  onPendingChange: (pending: boolean) => void;
  onError: (message: string | null) => void;
};

export function useInstitutionalPasskeyLogin({ input, onFieldErrors, rememberMe, onPendingChange, onError }: InstitutionalPasskeyLoginProps) {
  const router = useRouter();

  const [ceremony, setCeremony] = useState<PasskeyCeremonyState>({ phase: "idle" });

  const ceremonyRef = useRef<AbortController | null>(null);

  const verifyingRef = useRef(false);

  const passkeyPending = ceremony.phase !== "idle";

  const passkeyVerifying = ceremony.phase === "verifying";

  // Cancel the browser prompt when the form unmounts.
  useEffect(() => {
    return () => {
      ceremonyRef.current?.abort();
      ceremonyRef.current = null;
    };
  }, []);

  function abortCeremony(): void {
    ceremonyRef.current?.abort();
    ceremonyRef.current = null;
  }

  function isCurrentCeremony(controller: AbortController): boolean {
    return ceremonyRef.current === controller;
  }

  function handleCancelCeremony(): void {
    if (verifyingRef.current) {
      return;
    }

    abortCeremony();
    setCeremony({ phase: "idle" });
  }

  async function handlePasskeyLogin(): Promise<void> {
    if (ceremonyRef.current) {
      return;
    }

    if (!isWebAuthnSupported()) {
      onError(INSTITUTIONAL_AUTH_ERROR_MESSAGES.PASSKEY_UNSUPPORTED);

      return;
    }

    const controller = new AbortController();

    ceremonyRef.current = controller;
    setCeremony({ phase: "requesting" });
    onError(null);
    onFieldErrors({});

    const remembered = rememberMe;

    try {
      const begin = await beginInstitutionalPasskeyLogin(input);

      if (!isCurrentCeremony(controller)) {
        return;
      }

      if (begin.fieldErrors) {
        onFieldErrors(begin.fieldErrors);

        return;
      }

      if (begin.error || !begin.ceremonyId || !begin.options) {
        onError(begin.error ?? INSTITUTIONAL_AUTH_ERROR_MESSAGES.PASSKEY_FAILED);

        return;
      }

      const requestOptions = toPublicKeyRequestOptions(begin.options);

      const credential = await getPasskeyAssertion(requestOptions, controller.signal);

      if (!isCurrentCeremony(controller)) {
        return;
      }

      verifyingRef.current = true;
      setCeremony({ phase: "verifying" });
      onPendingChange(true);

      const finish = await finishPasskeyLogin({
        ceremonyId: begin.ceremonyId,
        credentialJson: JSON.stringify(credential),
        rememberMe: remembered,
      });

      if (!isCurrentCeremony(controller)) {
        return;
      }

      if (finish.redirectTo) {
        router.push(finish.redirectTo);
        ceremonyRef.current = null;

        return;
      }

      if (finish.error) {
        onError(finish.error);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.debug("[passkey] login ceremony settled with error", error instanceof DOMException ? error.name : error?.constructor?.name);
      }

      if (!isCurrentCeremony(controller)) {
        return;
      }

      if (isUserCancelled(error)) {
        return;
      }

      onError(INSTITUTIONAL_AUTH_ERROR_MESSAGES.PASSKEY_FAILED);
    } finally {
      if (isCurrentCeremony(controller)) {
        ceremonyRef.current = null;
        verifyingRef.current = false;
        onPendingChange(false);
        setCeremony({ phase: "idle" });
      }
    }
  }

  return {
    pending: passkeyPending,
    verifying: passkeyVerifying,
    login: handlePasskeyLogin,
    cancel: handleCancelCeremony,
  };
}
