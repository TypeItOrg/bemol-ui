"use client";

import { useState, useTransition, type ReactElement } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlertIcon, Loader2Icon, LockKeyholeIcon, UserRoundCogIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { SectionHeader } from "@common/components/section-header";
import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Field, FieldLabel } from "@common/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@common/components/ui/select";
import { FORM_MODE } from "@common/types/form-mode.types";

import { createPlatformAccountAction } from "@features/platform-accounts/actions/create-platform-account.action";
import { updatePlatformAccountAction } from "@features/platform-accounts/actions/update-platform-account.action";
import { PlatformAccountIdentityFields, PlatformAccountPasswordFields } from "@features/platform-accounts/components/platform-account-fields";
import { PLATFORM_ACCOUNT_ERROR_MESSAGES } from "@features/platform-accounts/constants/error-messages.constants";
import {
  platformAccountFormSchema,
  platformAccountUpdateFormSchema,
  type PlatformAccountFormInput,
  type PlatformAccountFormValues,
} from "@features/platform-accounts/schemas/platform-account-form.schema";
import type { PlatformAccountAdmin } from "@features/platform-accounts/types/platform-account-admin.types";
import {
  createFormData,
  getDefaultValues,
  getSectionDescription,
  getSubmitLabel,
  hasSensitiveChanges,
  setActionFieldErrors,
} from "@features/platform-accounts/utils/platform-account-form.util";
import { logoutPlatform } from "@features/platform-auth/actions/platform-logout.action";
import { usePlatformAccount } from "@features/platform-auth/hooks/use-platform-account.hook";

const PLATFORM_ACCOUNTS_PATH = "/admin/accounts";

type CreateMode = {
  mode: typeof FORM_MODE.CREATE;
  account?: never;
};

type EditMode = {
  mode: typeof FORM_MODE.EDIT;
  account: PlatformAccountAdmin;
};

type PlatformAccountFormProps = (CreateMode | EditMode) & {
  returnTo?: string;
};

export function PlatformAccountForm({ mode, account, returnTo }: PlatformAccountFormProps): ReactElement {
  const router = useRouter();

  const { account: currentAccount } = usePlatformAccount();

  const isEdit = mode === FORM_MODE.EDIT;

  const defaultDestination = isEdit ? `${PLATFORM_ACCOUNTS_PATH}/${account.platformAccountId}` : PLATFORM_ACCOUNTS_PATH;

  const destination = returnTo ?? defaultDestination;

  const isCurrentAccount = isEdit && currentAccount?.platformAccountId === account.platformAccountId;

  const [isPending, startTransition] = useTransition();

  const [formError, setFormError] = useState<string>();

  const [initialEnabled, setInitialEnabled] = useState("true");

  const defaultValues = getDefaultValues(account);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PlatformAccountFormInput, unknown, PlatformAccountFormValues>({
    resolver: zodResolver(isEdit ? platformAccountUpdateFormSchema : platformAccountFormSchema),
    defaultValues,
  });

  function onSubmit(values: PlatformAccountFormValues): void {
    setFormError(undefined);

    startTransition(async () => {
      const formData = createFormData(values);

      if (!isEdit) {
        formData.set("enabled", initialEnabled);
      }

      const result = isEdit ? await updatePlatformAccountAction(account.platformAccountId, formData) : await createPlatformAccountAction(formData);

      const hasFieldErrors = setActionFieldErrors(result, setError);

      setFormError(hasFieldErrors ? undefined : result.error);

      if (result.success) {
        if (isEdit && isCurrentAccount && hasSensitiveChanges(values, account)) {
          await logoutPlatform();

          return;
        }

        router.push(destination);
      }
    });
  }

  function handleCancel(): void {
    router.push(destination);
  }

  const errorAlert = formError ? (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertTitle>{isEdit ? PLATFORM_ACCOUNT_ERROR_MESSAGES.UPDATE_TITLE : PLATFORM_ACCOUNT_ERROR_MESSAGES.CREATE_TITLE}</AlertTitle>
      <AlertDescription>{formError}</AlertDescription>
    </Alert>
  ) : null;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-4">
        {errorAlert}

        <section className="bg-muted/25 rounded-xl border p-5 md:p-6">
          <header className="-mx-5 border-b px-5 pb-5 md:-mx-6 md:px-6">
            <SectionHeader icon={UserRoundCogIcon} title={isEdit ? "Identidad y acceso" : "Identidad"} description={getSectionDescription(isEdit)} />
          </header>
          <PlatformAccountIdentityFields errors={errors} defaultValues={defaultValues} register={register} isEdit={isEdit} />
          {isEdit ? <PlatformAccountPasswordFields errors={errors} defaultValues={defaultValues} register={register} isEdit /> : null}
        </section>
        {!isEdit ? (
          <section className="bg-muted/25 rounded-xl border p-5 md:p-6">
            <header className="-mx-5 border-b px-5 pb-5 md:-mx-6 md:px-6">
              <SectionHeader icon={LockKeyholeIcon} title="Acceso" description="Contraseña y estado inicial de acceso a la plataforma." />
            </header>
            <PlatformAccountPasswordFields errors={errors} defaultValues={defaultValues} register={register} isEdit={false} />
            <Field className="mt-5">
              <FieldLabel htmlFor="platform-account-enabled" required>
                Estado
              </FieldLabel>
              <Select required value={initialEnabled} onValueChange={setInitialEnabled}>
                <SelectTrigger id="platform-account-enabled" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="true" className="px-2.5 py-1.5">
                      Activo
                    </SelectItem>
                    <SelectItem value="false" className="px-2.5 py-1.5">
                      Inactivo
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </section>
        ) : null}
      </div>

      <div className="flex flex-row flex-wrap items-center justify-end gap-3">
        <Button type="button" variant="outline" size="lg" className="flex-1 sm:flex-none" onClick={handleCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="flex-1 sm:flex-none" disabled={isPending}>
          {isPending ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : null}
          {getSubmitLabel({ isEdit, isPending })}
        </Button>
      </div>
    </form>
  );
}
