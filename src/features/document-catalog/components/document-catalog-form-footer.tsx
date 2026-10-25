"use client";

import type { ElementType, ReactElement, RefObject } from "react";

import type { useRouter } from "next/navigation";

import { Button } from "@common/components/ui/button";

export function DocumentCatalogFormFooter({
  Footer,
  isDialog,
  pending,
  onCancel,
  returnTo,
  router,
  saveButtonRef,
  disabled,
  hasValidRequiredFields,
  currentId,
  impact,
  impactError,
}: {
  Footer: ElementType;
  isDialog: boolean;
  pending: boolean;
  onCancel: (() => void) | undefined;
  returnTo: string | undefined;
  router: ReturnType<typeof useRouter>;
  saveButtonRef: RefObject<HTMLButtonElement | null>;
  disabled: boolean;
  hasValidRequiredFields: boolean;
  currentId: string | undefined;
  impact: { paths: number; drafts: number } | undefined;
  impactError: string;
}): ReactElement {
  const actionLabel = currentId ? "Guardar cambios" : "Crear documento";

  const pendingLabel = currentId ? "Guardando…" : "Creando…";

  return (
    <Footer className={isDialog ? "mt-0 shrink-0" : "flex flex-row flex-wrap items-center justify-end gap-3"}>
      <Button
        type="button"
        size="lg"
        variant="outline"
        className={isDialog ? "h-11 w-full shrink-0 sm:h-9 sm:w-auto" : "flex-1 sm:flex-none"}
        disabled={pending}
        onClick={() => {
          if (onCancel) {
            onCancel();
          } else if (returnTo) {
            router.push(returnTo);
          }
        }}
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        ref={saveButtonRef}
        size="lg"
        className={isDialog ? "h-11 w-full shrink-0 sm:h-9 sm:w-auto" : "flex-1 sm:flex-none"}
        disabled={disabled || !hasValidRequiredFields || (Boolean(currentId) && (!impact || Boolean(impactError)))}
      >
        {pending ? pendingLabel : actionLabel}
      </Button>
    </Footer>
  );
}
