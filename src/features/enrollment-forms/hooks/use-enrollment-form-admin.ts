"use client";

import { useMutation, useQuery, useQueryClient, type QueryFilters } from "@tanstack/react-query";

import { readEnrollmentFormResource, runEnrollmentFormCommand } from "@features/enrollment-forms/services/enrollment-form-client.service";
import type { EnrollmentFormCommand } from "@features/enrollment-forms/types/enrollment-form-command.types";
import type { EnrollmentFormContext } from "@features/enrollment-forms/types/enrollment-form-context.types";

export function enrollmentFormQueryKey(context: EnrollmentFormContext, path?: string) {
  return ["enrollment-forms", context.scope, context.institutionId, ...(path ? [path] : [])];
}

export function useEnrollmentFormResource<T>(context: EnrollmentFormContext, path: string, enabled = true) {
  return useQuery({
    queryKey: enrollmentFormQueryKey(context, path),
    queryFn: ({ signal }) => readEnrollmentFormResource<T>(context.scope, context.institutionId, path, signal),
    enabled,
  });
}

export function useEnrollmentFormMutation<T>(context: EnrollmentFormContext, onSuccess?: (data: T) => void) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (command: EnrollmentFormCommand) => runEnrollmentFormCommand<T>(context.scope, context.institutionId, command),
    onSuccess: async (data, command) => {
      if (command.kind === "save") {
        const versionsPath = `enrollment-forms/${command.formId}/versions`;

        const versionLists: QueryFilters = {
          queryKey: enrollmentFormQueryKey(context),
          predicate: ({ queryKey }) =>
            (typeof queryKey[3] === "string" && queryKey[3].startsWith(`${versionsPath}?`)) ||
            (queryKey[3] === "version-options" && queryKey[4] === command.formId),
        };

        // Cancel older reads before the save callback caches the authoritative version.
        await Promise.all([
          client.cancelQueries({ queryKey: enrollmentFormQueryKey(context, `${versionsPath}/${command.versionId}`), exact: true }),
          client.cancelQueries(versionLists),
        ]);

        onSuccess?.(data);
        await client.invalidateQueries(versionLists);

        return;
      }

      onSuccess?.(data);
      await client.invalidateQueries({ queryKey: enrollmentFormQueryKey(context) });
    },
    retry: false,
  });
}
