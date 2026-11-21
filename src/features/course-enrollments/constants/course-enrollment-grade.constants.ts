export const COURSE_ENROLLMENT_GRADE_MESSAGES = {
  DIALOG_TITLE: "Notas de la cursada",
  STUDENT_DIALOG_TITLE: "Notas",
  ADD_GRADE: "Añadir nota",
  SAVE_GRADE: "Guardar nota",
  EDIT_GRADE: "Editar nota",
  DELETE_GRADE: "Eliminar nota",
  CANCEL_DELETION: "Deshacer eliminación",
  PUBLISH_GRADES: "Publicar notas",
  PUBLISH_GRADES_OF_CLASS: "Publicar notas de la clase",
  NO_GRADES_TITLE: "Sin notas cargadas",
  NO_GRADES: "Cuando se registren evaluaciones para esta cursada van a aparecer acá.",
  NO_GRADES_CLOSED: "No se registraron notas para esta cursada.",
  NO_PUBLISHED_GRADES_TITLE: "Sin notas publicadas",
  NO_PUBLISHED_GRADES: "Todavía no hay notas publicadas para esta materia.",
  NO_PUBLISHED_GRADES_CLOSED: "No se publicaron notas para esta cursada.",
  DRAFT_DESCRIPTION: "Las notas se guardan como borrador hasta publicar la clase.",
  PUBLISHED_EDIT_DESCRIPTION:
    "Los cambios quedan pendientes hasta publicar la clase; mientras tanto el estudiante sigue viendo la versión publicada.",
  DRAFT_SAVED: "Nota guardada como borrador.",
  CHANGES_SAVED: "Cambios guardados. Se harán visibles cuando se publiquen las notas de la clase.",
  UNCHANGED: "No hubo cambios; la nota quedó igual.",
  UNCONFIRMED: "No pudimos confirmar si hubo cambios; revisá la nota.",
  DELETE_DRAFT_CONFIRM: "¿Eliminar este borrador? Esta acción no se puede deshacer y no afecta a los estudiantes.",
  DELETE_PUBLISHED_CONFIRM: "La nota seguirá visible para el estudiante hasta que se publiquen las notas de la clase.",
  PUBLISH_CONFIRM_TITLE: "Publicar notas",
  PUBLISH_SUCCESS: "Notas publicadas correctamente.",
  LOAD_FAILED: "No se pudieron cargar las notas.",
  MUTATION_FAILED: "No se pudo guardar la nota. Revisá los datos e intentá nuevamente.",
  VIEW_GRADES: "Ver notas",
} as const;

export const COURSE_ENROLLMENT_GRADE_HISTORY_PAGE_SIZE = 20;

export const COURSE_ENROLLMENT_GRADE_BULK_PUBLISH_LIMIT = 20;

export const COURSE_ENROLLMENT_GRADE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Calificación registrada",
  PENDING_CHANGES: "Cambios sin publicar",
  PENDING_DELETION: "Pendiente de eliminación",
};
