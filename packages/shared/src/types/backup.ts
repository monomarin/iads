export interface BackupConfig {
  id: string;
  tenantId: string;
  retentionDays: number;
  frequency: "daily" | "weekly" | "monthly";
  time: string;
}

export interface BackupLog {
  id: string;
  tenantId: string;
  status: string;
  size?: string;
  errorLog?: string;
  startedAt: string;
  finishedAt?: string;
}
