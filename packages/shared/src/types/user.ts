export type UserRole = "super_admin" | "advertiser" | "store_admin" | "technician" | "approver";

export interface User {
  id: string;
  clerkId: string;
  tenantId: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
