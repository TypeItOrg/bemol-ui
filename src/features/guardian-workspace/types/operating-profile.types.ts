export type OperatingProfile = {
  actorPersonId: string;
  personId: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  self: boolean;
  canEnroll: boolean;
  roles: readonly string[];
};
