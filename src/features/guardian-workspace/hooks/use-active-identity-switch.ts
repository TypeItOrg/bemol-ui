"use client";

import { useActionState, useEffect } from "react";

import { selectActiveIdentityAction } from "@features/guardian-workspace/actions/select-active-identity.action";
import type { ActiveIdentityState } from "@features/guardian-workspace/types/active-identity-state.types";

export function useActiveIdentitySwitch() {
  const [state, action, pending] = useActionState<ActiveIdentityState, FormData>(selectActiveIdentityAction, {});

  useEffect(() => {
    if (!state.success) {
      return;
    }

    try {
      window.localStorage.setItem("institutional-active-identity", String(Date.now()));
    } catch {
      // Storage may be unavailable; the current tab must still discard its previous identity.
    }

    window.location.replace(state.returnTo ?? "/");
  }, [state.success, state.returnTo]);

  return { state, action, pending };
}
