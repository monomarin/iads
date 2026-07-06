export interface EdgeNode {
  id: string;
  storeId: string;
  name: string;
  deviceToken?: string;
  platform: string;
  fcmToken?: string;
  lastSeenAt?: string;
  firmwareVersion?: string;
  settings: Record<string, unknown>;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SyncLog {
  id: string;
  storeId: string;
  status: "pending" | "running" | "success" | "failed";
  type: "scheduled" | "manual" | "urgent";
  startedAt?: string;
  finishedAt?: string;
  itemsSynced: number;
  itemsFailed: number;
  errorLog?: string;
  createdAt: string;
}

export interface SyncSchedule {
  id: string;
  storeId?: string;
  cronExpression: string;
  timezone: string;
  isActive: boolean;
  overrideGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}
