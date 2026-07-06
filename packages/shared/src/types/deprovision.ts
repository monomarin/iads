export type DeprovisionStep = "active" | "suspended" | "grace" | "warning" | "deleting" | "deleted";

export interface DeprovisionStatus {
  step: DeprovisionStep;
  suspendedAt: string | null;
  deletionScheduledAt: string | null;
  daysRemaining: number;
  canReactivate: boolean;
}
