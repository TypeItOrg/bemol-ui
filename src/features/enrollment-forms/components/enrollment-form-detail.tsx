"use client";

import { useEffect, useState, type ReactElement } from "react";

import { useRouter } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { FileTextIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { Skeleton } from "@common/components/ui/skeleton";
import { useSearchParamNavigation } from "@common/hooks/use-search-param-navigation";
import type { PaginatedResponse } from "@common/types/paginated-response.types";

import { EnrollmentFormDiscardDialog } from "@features/enrollment-forms/components/enrollment-form-discard-dialog";
import { EnrollmentFormFeedback } from "@features/enrollment-forms/components/enrollment-form-feedback";
import { EnrollmentFormHistoryDialog } from "@features/enrollment-forms/components/enrollment-form-history-dialog";
import { EnrollmentFormRename } from "@features/enrollment-forms/components/enrollment-form-rename";
import { EnrollmentFormVersionSession } from "@features/enrollment-forms/components/enrollment-form-version-session";
import { enrollmentFormQueryKey, useEnrollmentFormResource } from "@features/enrollment-forms/hooks/use-enrollment-form-admin";
import { readEnrollmentFormResource } from "@features/enrollment-forms/services/enrollment-form-client.service";
import type { EnrollmentFormContext } from "@features/enrollment-forms/types/enrollment-form-context.types";
import type { EnrollmentFormModel } from "@features/enrollment-forms/types/enrollment-form-model.types";
import type { EnrollmentFormVersionSummary } from "@features/enrollment-forms/types/enrollment-form-version-summary.types";
import type { EnrollmentFormVersion } from "@features/enrollment-forms/types/enrollment-form-version.types";
import { InstitutionalBreadcrumb } from "@features/institutional-auth/components/institutional-breadcrumb";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export function EnrollmentFormDetail({
  context,
  modelId,
  returnTo,
  versionId,
  institutionName,
}: {
  context: EnrollmentFormContext;
  modelId: string;
  returnTo: string;
  versionId?: string;
  institutionName?: string;
}): ReactElement {
  const router = useRouter();

  const { navigate: navigateParams } = useSearchParamNavigation();

  const [dirty, setDirty] = useState(false);

  const [navigation, setNavigation] = useState<(() => void) | null>(null);

  const [renaming, setRenaming] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);

  const model = useEnrollmentFormResource<EnrollmentFormModel>(context, `enrollment-forms/${modelId}`);

  const versionsPath = `enrollment-forms/${modelId}/versions?page=0&size=10`;

  // Warm history once; a closed dialog must not refetch after every autosave.
  const versions = useQuery({
    queryKey: enrollmentFormQueryKey(context, versionsPath),
    queryFn: ({ signal }) =>
      readEnrollmentFormResource<PaginatedResponse<EnrollmentFormVersionSummary>>(context.scope, context.institutionId, versionsPath, signal),
    enabled: (query) => !versionId || (query.state.data === undefined && query.state.error === null),
  });

  const defaultVersionId = versions.data?.items[0]?.id;

  useEffect(() => {
    if (!versionId && defaultVersionId) {
      navigateParams({ versionId: defaultVersionId, page: undefined, size: undefined }, { replace: true });
    }
  }, [versionId, defaultVersionId, navigateParams]);

  const detail = useEnrollmentFormResource<EnrollmentFormVersion>(context, `enrollment-forms/${modelId}/versions/${versionId}`, Boolean(versionId));

  const loading = versionId ? detail.isPending || !versions.isFetched : versions.isPending || Boolean(defaultVersionId);

  const modelName = model.data?.name ?? "Formulario de inscripción";

  const Breadcrumb = context.scope === "platform" ? PlatformBreadcrumb : InstitutionalBreadcrumb;

  function navigate(action: () => void) {
    if (dirty) {
      setNavigation(() => action);
    } else {
      action();
    }
  }

  function goBack() {
    navigate(() => router.push(returnTo));
  }

  return (
    <PlatformPageShell
      title={model.isPending ? <Skeleton className="h-8 w-56 max-w-full" /> : modelName}
      breadcrumb={
        model.isPending ? (
          <Skeleton className="h-5 w-56 max-w-full" />
        ) : (
          <Breadcrumb
            segmentLabels={{
              [context.institutionId]: institutionName ?? "Institución",
              "enrollment-forms": "Formularios de inscripción",
              [modelId]: modelName,
            }}
            segmentHrefs={{ "enrollment-forms": returnTo }}
          />
        )
      }
      actions={<PlatformPageIcon icon={FileTextIcon} />}
    >
      <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
        {!detail.data || !versions.isFetched ? (
          <Button type="button" variant="outline" size="lg" className="self-start" onClick={goBack}>
            Volver
          </Button>
        ) : null}
        <EnrollmentFormFeedback error={model.error || (!versionId && versions.error) || detail.error} />
        {!versionId && versions.isError ? (
          <Button type="button" variant="outline" className="self-start" disabled={versions.isFetching} onClick={() => void versions.refetch()}>
            Reintentar carga
          </Button>
        ) : null}
        {renaming && model.data ? <EnrollmentFormRename context={context} model={model.data} onDone={() => setRenaming(false)} /> : null}
        {historyOpen && versionId ? (
          <EnrollmentFormHistoryDialog
            context={context}
            modelId={modelId}
            selectedVersionId={versionId}
            onClose={() => setHistoryOpen(false)}
            onSelectVersion={(id) =>
              navigate(() => {
                setHistoryOpen(false);
                navigateParams({ versionId: id, page: undefined, size: undefined }, { replace: true });
              })
            }
          />
        ) : null}
        {!versionId && versions.data?.totalItems === 0 ? <p className="text-muted-foreground text-sm">No hay versiones disponibles.</p> : null}
        {loading ? <Skeleton role="status" aria-label="Cargando formulario de inscripción" className="min-h-80 w-full flex-1 rounded-xl" /> : null}
        {detail.data && versions.isFetched ? (
          <EnrollmentFormVersionSession
            key={detail.data.id}
            context={context}
            initial={detail.data}
            modelName={modelName}
            onBack={goBack}
            onRename={() => setRenaming(true)}
            onOpenHistory={() => setHistoryOpen(true)}
            onDirty={setDirty}
            reload={async () => {
              const result = await detail.refetch();

              if (!result.data || result.error) {
                throw result.error ?? new Error("No se pudo recargar la versión.");
              }

              return result.data;
            }}
            onCreated={(version) => navigateParams({ versionId: version.id, page: undefined, size: undefined }, { replace: true })}
          />
        ) : null}
        {navigation ? (
          <EnrollmentFormDiscardDialog
            onCancel={() => setNavigation(null)}
            onConfirm={() => {
              navigation();
              setNavigation(null);
            }}
          />
        ) : null}
      </div>
    </PlatformPageShell>
  );
}
