export type BulkPublishClassStatus = "published" | "failed" | "uncertain";

export type BulkPublishClassResult = {
  classId: string;
  status: BulkPublishClassStatus;
  publishedGrades?: number;
  deletedGrades?: number;
  affectedStudents?: number;
  error?: string;
};

export type BulkPublishResult = {
  error?: string;
  publishedClasses?: number;
  publishedGrades?: number;
  deletedGrades?: number;
  failedClasses?: number;
  uncertainClasses?: number;
  uncertainClassIds?: string[];
  results?: BulkPublishClassResult[];
};
