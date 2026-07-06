export type TenantRole = "super_admin" | "advertiser" | "store_admin" | "technician";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}
