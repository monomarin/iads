"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface ApprovalRequest {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  status: string;
  payload: Record<string, unknown>;
  review_comment: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  comment: string | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  activate_campaign: "Activate Campaign",
  publish_playlist: "Publish Playlist",
  force_sync: "Force Sync",
  upload_audio: "Upload Audio",
  change_schedule: "Change Schedule",
  edge_command: "Edge Command",
};

export default function ApprovalDetailPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [approval, setApproval] = useState<ApprovalRequest | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [comment, setComment] = useState("");
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn || !id) { router.push("/sign-in"); return; }
    loadApproval();
  }, [isSignedIn, id]);

  async function loadApproval() {
    const token = (await getToken()) || undefined;
    const data = await api.get(`/approvals/${id}`, token);
    setApproval(data.approval);
    setAudit(data.audit ?? []);
    setLoading(false);
  }

  async function handleApprove() {
    const token = (await getToken()) || undefined;
    setProcessing(true);
    try {
      await api.post(`/approvals/${id}/approve`, { comment }, token);
      await loadApproval();
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    const token = (await getToken()) || undefined;
    setProcessing(true);
    try {
      await api.post(`/approvals/${id}/reject`, { comment }, token);
      await loadApproval();
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />
        </div>
      </div>
    );
  }

  if (!approval) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-2xl text-center mt-20">
          <p className="text-muted-foreground">Approval request not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/approvals")}>Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">
            {ACTION_LABELS[approval.action] ?? approval.action}
          </h1>
          <Button variant="outline" onClick={() => router.push("/approvals")}>Back</Button>
        </div>

        <Card className="mb-6 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${
                approval.status === "pending" ? "bg-amber-500/20 text-amber-500" :
                approval.status === "approved" ? "bg-success/20 text-success" :
                "bg-destructive/20 text-destructive"
              }`}>
                {approval.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="text-sm text-foreground mt-1">{approval.target_type} / {approval.target_id.slice(0, 8)}...</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm text-foreground mt-1">{new Date(approval.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reviewed</p>
              <p className="text-sm text-foreground mt-1">{approval.reviewed_at ? new Date(approval.reviewed_at).toLocaleString() : "—"}</p>
            </div>
          </div>
        </Card>

        <Card className="mb-6 p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">Payload</h2>
          <pre className="overflow-auto rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            {JSON.stringify(approval.payload, null, 2)}
          </pre>
        </Card>

        {approval.status === "pending" && (
          <Card className="mb-6 p-4">
            <h2 className="mb-3 text-sm font-medium text-foreground">Review</h2>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional comment..."
              className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              rows={2}
            />
            <div className="flex gap-2">
              <Button onClick={handleApprove} disabled={processing} className="flex-1">
                {processing ? "Processing..." : "Approve"}
              </Button>
              <Button onClick={handleReject} disabled={processing} variant="destructive" className="flex-1">
                {processing ? "Processing..." : "Reject"}
              </Button>
            </div>
          </Card>
        )}

        {approval.review_comment && (
          <Card className="mb-6 p-4">
            <h2 className="mb-1 text-sm font-medium text-foreground">Review Comment</h2>
            <p className="text-sm text-muted-foreground">{approval.review_comment}</p>
          </Card>
        )}

        {audit.length > 0 && (
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-medium text-foreground">Audit Trail</h2>
            <div className="space-y-2">
              {audit.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${
                      entry.action === "approved" ? "bg-success" :
                      entry.action === "rejected" ? "bg-destructive" : "bg-muted-foreground"
                    }`} />
                    <span className="text-sm text-foreground">{entry.action}</span>
                    {entry.comment && (
                      <span className="text-xs text-muted-foreground">— {entry.comment}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
