export type AuditFieldChange = {
  field: string;
  label: string;
  valueType: string;
  before: string | null;
  after: string | null;
};
