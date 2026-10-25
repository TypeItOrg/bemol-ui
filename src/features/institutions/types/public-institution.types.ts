export type PublicInstitution = {
  id: string;
  name: string;
  shortName: string | null;
  publicSubdomain: string;
  logoUrl: string | null;
  logoBlurDataURL?: string;
};
