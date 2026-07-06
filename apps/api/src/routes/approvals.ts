import { FastifyInstance } from "fastify";
import { db, approvalRequests, approvalAudit, users } from "@raemonorepo/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";
import { executeApprovedAction } from "../services/approval-executor";

export async function approvalRoutes(app: FastifyInstance) {
  app.addHook("preHandler", tenantMiddleware);

  app.get("/api/approvals", async (request, _reply) => {
    const tenantId = request.tenantId!;
    const query = request.query as { status?: string; limit?: string };
    const limit = Math.min(parseInt(query.limit ?? "50", 10), 200);

    let result;
    if (query.status) {
      result = await db
        .select()
        .from(approvalRequests)
        .where(and(eq(approvalRequests.tenantId, tenantId as string), eq(approvalRequests.status, query.status as string)))
        .orderBy(desc(approvalRequests.createdAt))
        .limit(limit);
    } else {
      result = await db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.tenantId, tenantId as string))
        .orderBy(desc(approvalRequests.createdAt))
        .limit(limit);
    }
    return { approvals: result };
  });

  app.get("/api/approvals/stats", async (request, _reply) => {
    const tenantId = request.tenantId!;
    const rows = await db
      .select({
        status: approvalRequests.status,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(approvalRequests)
      .where(eq(approvalRequests.tenantId, tenantId as string))
      .groupBy(approvalRequests.status);
    const stats = { pending: 0, approved: 0, rejected: 0 };
    for (const row of rows) {
      if (row.status === "pending") stats.pending = row.count;
      else if (row.status === "approved") stats.approved = row.count;
      else if (row.status === "rejected") stats.rejected = row.count;
    }
    return stats;
  });

  app.get("/api/approvals/:id", async (request, reply) => {
    const tenantId = request.tenantId!;
    const { id } = request.params as { id: string };
    const result = await db
      .select()
      .from(approvalRequests)
      .where(and(eq(approvalRequests.id, id as string), eq(approvalRequests.tenantId, tenantId as string)))
      .limit(1);
    if (!result[0]) return reply.status(404).send({ error: "Approval request not found" });

    const audit = await db
      .select()
      .from(approvalAudit)
      .where(eq(approvalAudit.approvalId, id as string))
      .orderBy(desc(approvalAudit.createdAt));
    return { approval: result[0], audit };
  });

  app.post("/api/approvals", async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = request.userId!;
    const body = request.body as {
      action: string;
      targetType: string;
      targetId: string;
      payload?: Record<string, unknown>;
    };
    if (!body.action || !body.targetType || !body.targetId) {
      return reply.status(400).send({ error: "action, targetType, targetId required" });
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(and(eq(users.clerkId, userId as string), eq(users.tenantId, tenantId as string)))
      .limit(1);
    const dbUserId = existingUser[0]?.id ?? "00000000-0000-0000-0000-000000000002";

    const created = await db
      .insert(approvalRequests)
      .values({
        tenantId: tenantId as string,
        requestedBy: dbUserId as string,
        action: body.action,
        targetType: body.targetType,
        targetId: body.targetId,
        payload: (body.payload ?? {}) as any,
      })
      .returning();
    return { approval: created[0] };
  });

  async function canApprove(tenantId: string, clerkUserId: string): Promise<boolean> {
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.clerkId, clerkUserId as string), eq(users.tenantId, tenantId as string)))
      .limit(1);
    return user[0]?.role === "super_admin" || user[0]?.role === "approver";
  }

  app.post("/api/approvals/:id/approve", async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = request.userId!;
    const { id } = request.params as { id: string };
    const body = request.body as { comment?: string };

    if (!(await canApprove(tenantId as string, userId as string))) {
      return reply.status(403).send({ error: "Only super_admin or approver can approve" });
    }

    const existing = await db
      .select()
      .from(approvalRequests)
      .where(and(eq(approvalRequests.id, id as string), eq(approvalRequests.tenantId, tenantId as string)))
      .limit(1);
    if (!existing[0]) return reply.status(404).send({ error: "Approval request not found" });
    if (existing[0].status !== "pending") return reply.status(400).send({ error: "Already reviewed" });

    const existingUser = await db
      .select()
      .from(users)
      .where(and(eq(users.clerkId, userId as string), eq(users.tenantId, tenantId as string)))
      .limit(1);
    const dbUserId = existingUser[0]?.id ?? "00000000-0000-0000-0000-000000000002";

    await db
      .update(approvalRequests)
      .set({ status: "approved", reviewedBy: dbUserId as string, reviewComment: body.comment, reviewedAt: new Date(), updatedAt: new Date() })
      .where(eq(approvalRequests.id, id as string));

    await db.insert(approvalAudit).values({
      tenantId: tenantId as string,
      approvalId: id,
      action: "approved",
      performedBy: dbUserId as string,
      previousStatus: "pending",
      newStatus: "approved",
      comment: body.comment,
    });

    await executeApprovedAction(
      existing[0].action,
      existing[0].targetType,
      existing[0].targetId,
      existing[0].payload as Record<string, unknown>,
    );

    return { message: "Approved and executed" };
  });

  app.post("/api/approvals/:id/reject", async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = request.userId!;
    const { id } = request.params as { id: string };
    const body = request.body as { comment?: string };

    if (!(await canApprove(tenantId as string, userId as string))) {
      return reply.status(403).send({ error: "Only super_admin or approver can reject" });
    }

    const existing = await db
      .select()
      .from(approvalRequests)
      .where(and(eq(approvalRequests.id, id as string), eq(approvalRequests.tenantId, tenantId as string)))
      .limit(1);
    if (!existing[0]) return reply.status(404).send({ error: "Approval request not found" });
    if (existing[0].status !== "pending") return reply.status(400).send({ error: "Already reviewed" });

    const existingUser = await db
      .select()
      .from(users)
      .where(and(eq(users.clerkId, userId as string), eq(users.tenantId, tenantId as string)))
      .limit(1);
    const dbUserId = existingUser[0]?.id ?? "00000000-0000-0000-0000-000000000002";

    await db
      .update(approvalRequests)
      .set({ status: "rejected", reviewedBy: dbUserId as string, reviewComment: body.comment, reviewedAt: new Date(), updatedAt: new Date() })
      .where(eq(approvalRequests.id, id as string));

    await db.insert(approvalAudit).values({
      tenantId: tenantId as string,
      approvalId: id,
      action: "rejected",
      performedBy: dbUserId as string,
      previousStatus: "pending",
      newStatus: "rejected",
      comment: body.comment,
    });

    return { message: "Rejected" };
  });
}
