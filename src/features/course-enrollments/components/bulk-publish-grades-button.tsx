"use client";

import { useState } from "react";
import type { ReactElement } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@common/components/ui/button";

import { BulkPublishGradesDialog } from "@features/course-enrollments/components/bulk-publish-grades-dialog";
import { invalidateGradeQueries } from "@features/course-enrollments/utils/course-enrollment-grade-query-keys.util";

export function BulkPublishGradesButton(): ReactElement {
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="lg" onClick={() => setIsOpen(true)}>
        Publicar notas
      </Button>
      <BulkPublishGradesDialog open={isOpen} onOpenChange={setIsOpen} onPublished={() => void invalidateGradeQueries(queryClient)} />
    </>
  );
}
