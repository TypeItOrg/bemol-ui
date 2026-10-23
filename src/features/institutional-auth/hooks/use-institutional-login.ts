"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type SyntheticEvent } from "react";

import { isRedirectError } from "next/dist/client/components/redirect-error";

import { consumeInstitutionalLoginFlashes } from "@features/institutional-auth/actions/consume-institutional-login-flashes.action";
import { institutionalCredentialsLogin } from "@features/institutional-auth/actions/institutional-credentials-login.action";
import type { InstitutionalInstitution } from "@features/institutional-auth/components/institution-picker";
import { useInstitutionalBrand } from "@features/institutional-auth/components/institutional-brand-context";
import { useInstitutionalPasskeyLogin } from "@features/institutional-auth/hooks/use-institutional-passkey-login";
import type { InstitutionalCredentialsLoginState } from "@features/institutional-auth/types/institutional-credentials-login-state.types";

export function useInstitutionalLogin({ emailVerified = false, passwordChanged = false }: { emailVerified?: boolean; passwordChanged?: boolean }) {
  const fixedInstitution = useInstitutionalBrand();

  const [identity, setIdentity] = useState<{
    institution?: InstitutionalInstitution;
    documentNumber: string;
    method: "PASSWORD" | "PASSKEY";
    revision: number;
    rememberMe: boolean;
  }>({ documentNumber: "", method: "PASSWORD", revision: 0, rememberMe: false });

  const { institution, documentNumber, method, revision, rememberMe } = identity;

  const [status, setStatus] = useState<{ pending: boolean; error: string | null }>({
    pending: false,
    error: null,
  });

  const [passkeyFieldErrors, setPasskeyFieldErrors] = useState<InstitutionalCredentialsLoginState["fieldErrors"]>({});

  const pendingRef = useRef(false);

  const revisionRef = useRef(0);

  // Keep one-time notices visible after consuming their cookies.
  const [notices] = useState({ emailVerified, passwordChanged });

  const [passwordState, passwordAction, passwordPending] = useActionState<
    InstitutionalCredentialsLoginState & { revision?: number },
    { formData: FormData; revision: number }
  >(async (_previous, submitted) => {
    try {
      const result = await institutionalCredentialsLogin({}, submitted.formData);

      setPending(false);
      setError(result.error ?? null);

      return { ...result, revision: submitted.revision };
    } catch (error) {
      if (!isRedirectError(error)) {
        setPending(false);
      }

      throw error;
    }
  }, {});

  useEffect(() => {
    if (emailVerified || passwordChanged) {
      void consumeInstitutionalLoginFlashes();
    }
  }, [emailVerified, passwordChanged]);

  function setPending(pending: boolean): void {
    pendingRef.current = pending;
    setStatus((current) => ({ pending, error: pending ? null : current.error }));
  }

  function setError(error: string | null): void {
    setStatus((current) => ({ ...current, error }));
  }

  function invalidateInput(change: Partial<typeof identity>): void {
    setError(null);
    setPasskeyFieldErrors({});

    const nextRevision = ++revisionRef.current;

    setIdentity((current) => ({ ...current, ...change, revision: nextRevision }));
  }

  function changeDocument(value: string): void {
    if (pendingRef.current || value === documentNumber) {
      return;
    }

    invalidateInput({ documentNumber: value });
  }

  function changeInstitution(value: InstitutionalInstitution | undefined): void {
    if (pendingRef.current) {
      return;
    }

    if (value?.id !== institution?.id) {
      passkey.cancel();
      invalidateInput({ institution: value });

      return;
    }

    setIdentity((current) => ({ ...current, institution: value }));
  }

  function submitPassword(event: SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (pendingRef.current || passwordPending || passkey.pending) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    setIdentity((current) => ({ ...current, method: "PASSWORD" }));
    setPending(true);
    startTransition(() => passwordAction({ formData, revision }));
  }

  const currentPasswordErrors = passwordState.revision === revision ? passwordState.fieldErrors : undefined;

  const fieldErrors = method === "PASSKEY" ? passkeyFieldErrors : currentPasswordErrors;

  const showNotice = !status.pending && !status.error && !Object.keys(fieldErrors ?? {}).length;

  const activeInstitution = fixedInstitution ?? institution;

  function setRememberMe(value: boolean): void {
    setIdentity((current) => ({ ...current, rememberMe: value }));
  }

  const passkey = useInstitutionalPasskeyLogin({
    input: { institutionId: activeInstitution?.id ?? "" },
    rememberMe,
    onPendingChange: setPending,
    onError: setError,
    onFieldErrors: setPasskeyFieldErrors,
  });

  function loginWithPasskey(): void {
    if (pendingRef.current || passwordPending) {
      return;
    }

    setIdentity((current) => ({ ...current, method: "PASSKEY" }));
    void passkey.login();
  }

  return {
    institution,
    documentNumber,
    rememberMe,
    status,
    notices,
    fieldErrors,
    showNotice,
    changeDocument,
    changeInstitution,
    submitPassword,
    setRememberMe,
    passkey,
    loginWithPasskey,
  };
}
