export interface Store {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  timezone: string;
  syncSchedule?: string;
  createdAt: string;
  updatedAt: string;
}
