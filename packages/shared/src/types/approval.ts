export type ApprovalAction =
  | "activate_campaign" | "publish_playlist" | "force_sync"
  | "upload_audio" | "change_schedule" | "edge_command";
export type ApprovalTargetType =
  | "campaign" | "playlist" | "sync" | "audio" | "schedule" | "edge_node";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalRequest {
  id: string;
  tenantId: string;
  requestedBy: string;
  action: ApprovalAction;
  targetType: ApprovalTargetType;
  targetId: string;
  payload: Record<string, unknown>;
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewComment?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalAuditEntry {
  id: string;
  tenantId: string;
  approvalId: string;
  action: string;
  performedBy: string;
  previousStatus?: string;
  newStatus?: string;
  comment?: string;
  createdAt: string;
}
