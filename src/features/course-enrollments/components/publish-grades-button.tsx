"use client";

import { useState } from "react";
import type { ReactElement } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, RefreshCwIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";

import { PublishGradesDialog } from "@features/course-enrollments/components/publish-grades-dialog";
import {
  fetchClassPendingSummaryClient,
  fetchTeacherPendingSummaryClient,
  type GradeManagementMode,
} from "@features/course-enrollments/services/course-enrollment-grade-client.service";
import { gradeQueryKeys, invalidateGradeQueries } from "@features/course-enrollments/utils/course-enrollment-grade-query-keys.util";

type PublishGradesButtonProps = {
  classId: string;
  mode: GradeManagementMode;
  label?: string;
};

export function PublishGradesButton({ classId, mode, label }: PublishGradesButtonProps): ReactElement {
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);

  const summaryQuery = useQuery({
    queryKey: gradeQueryKeys.pendingSummary(mode, classId),
    queryFn: ({ signal }) =>
      mode === "teacher" ? fetchTeacherPendingSummaryClient(classId, signal) : fetchClassPendingSummaryClient(classId, signal),
    retry: false,
    meta: { refreshOnReturn: true },
  });

  if (summaryQuery.isPending) {
    return (
      <Button size="lg" disabled aria-busy="true">
        <span className="sr-only" role="status">
          Cargando cambios pendientes…
        </span>
        <span aria-hidden="true" className="inline-flex items-center gap-2">
          <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
          Cargando…
        </span>
      </Button>
    );
  }

  if (summaryQuery.isError) {
    return (
      <Button variant="outline" size="lg" onClick={() => void summaryQuery.refetch()} disabled={summaryQuery.isFetching}>
        <RefreshCwIcon className="size-4" aria-hidden="true" />
        Reintentar pendientes
      </Button>
    );
  }

  const summary = summaryQuery.data ?? null;

  const pending = summary?.pendingChanges ?? 0;

  return (
    <>
      <Button size="lg" onClick={() => setIsOpen(true)} disabled={pending === 0}>
        {label ?? "Publicar notas"}
        {pending > 0 ? ` (${pending})` : ""}
      </Button>
      <PublishGradesDialog
        classId={classId}
        mode={mode}
        summary={summary}
        open={isOpen}
        onOpenChange={setIsOpen}
        onPublished={() => {
          void invalidateGradeQueries(queryClient);
        }}
        label={label}
      />
    </>
  );
}
