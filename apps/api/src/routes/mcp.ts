import { FastifyInstance } from "fastify";
import { db, mcpActions } from "@raemonorepo/db";
import { eq } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

const DEFAULT_MCP_ACTIONS = [
  { action: "generate_script", label: "Generate AI Scripts" },
  { action: "create_campaign", label: "Create Campaign" },
  { action: "upload_audio", label: "Upload Audio" },
  { action: "modify_playlist", label: "Modify Playlist" },
  { action: "trigger_sync", label: "Trigger Sync" },
  { action: "send_edge_command", label: "Send Edge Command" },
  { action: "export_report", label: "Export Report" },
  { action: "delete_resource", label: "Delete Resources" },
];

export async function mcpRoutes(app: FastifyInstance) {
  app.addHook("preHandler", tenantMiddleware);

  app.get("/api/mcp/actions", async (request, _reply) => {
    const tenantId = request.tenantId!;
    let actions = await db
      .select()
      .from(mcpActions)
      .where(eq(mcpActions.tenantId, tenantId as string))
      .orderBy(mcpActions.action);

    if (actions.length === 0) {
      for (const a of DEFAULT_MCP_ACTIONS) {
        await db.insert(mcpActions).values({ tenantId: tenantId as string, action: a.action, label: a.label });
      }
      actions = await db
        .select()
        .from(mcpActions)
        .where(eq(mcpActions.tenantId, tenantId as string))
        .orderBy(mcpActions.action);
    }
    return { actions };
  });

  app.put("/api/mcp/actions/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { enabled } = request.body as { enabled: boolean };

    const updated = await db
      .update(mcpActions)
      .set({ enabled, updatedAt: new Date() })
      .where(eq(mcpActions.id, id as string))
      .returning();
    if (!updated[0]) return reply.status(404).send({ error: "Action not found" });
    return { action: updated[0] };
  });
}
