import { FastifyInstance } from "fastify";
import { db, campaigns, audioVariants } from "@raemonorepo/db";
import { eq, sql, desc } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

export async function campaignRoutes(app: FastifyInstance) {
  app.addHook("onRequest", tenantMiddleware);

  app.get("/api/campaigns", async (request, reply) => {
    const { status, store_id } = request.query as { status?: string; store_id?: string };
    const conditions = [eq(campaigns.tenantId, request.tenantId!)];
    if (status) conditions.push(eq(campaigns.status, status));
    if (store_id) conditions.push(eq(campaigns.storeId, store_id));

    const list = await db.select().from(campaigns)
      .where(conditions.length === 1 ? conditions[0]! : sql`${conditions.join(" AND ")}`)
      .orderBy(desc(campaigns.createdAt));

    return reply.send(list);
  });

  app.post("/api/campaigns", async (request, reply) => {
    const body = request.body as {
      store_id: string;
      name: string;
      start_date?: string;
      end_date?: string;
      goal?: string;
      notes?: string;
    };

    const campaign = await db.insert(campaigns).values({
      tenantId: request.tenantId!,
      storeId: body.store_id,
      name: body.name,
      startDate: body.start_date ? new Date(body.start_date) : null,
      endDate: body.end_date ? new Date(body.end_date) : null,
      goal: body.goal,
      notes: body.notes,
    }).returning();

    return reply.status(201).send(campaign[0]);
  });

  app.get("/api/campaigns/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const campaign = await db.select().from(campaigns)
      .where(sql`${campaigns.id} = ${id} AND ${campaigns.tenantId} = ${request.tenantId}`)
      .limit(1);

    if (!campaign[0]) {
      return reply.status(404).send({ error: "Campaign not found" });
    }

    const variants = await db.select()
      .from(audioVariants)
      .where(eq(audioVariants.campaignId, id));

    return reply.send({ ...campaign[0], variants });
  });

  app.put("/api/campaigns/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      start_date?: string;
      end_date?: string;
      goal?: string;
      notes?: string;
      store_id?: string;
    };

    const updated = await db.update(campaigns)
      .set({
        ...(body.name ? { name: body.name } : {}),
        ...(body.store_id ? { storeId: body.store_id } : {}),
        ...(body.goal ? { goal: body.goal } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.start_date ? { startDate: new Date(body.start_date) } : {}),
        ...(body.end_date ? { endDate: new Date(body.end_date) } : {}),
        updatedAt: new Date(),
      })
      .where(sql`${campaigns.id} = ${id} AND ${campaigns.tenantId} = ${request.tenantId}`)
      .returning();

    if (!updated[0]) {
      return reply.status(404).send({ error: "Campaign not found" });
    }
    return reply.send(updated[0]);
  });

  app.delete("/api/campaigns/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = await db.delete(campaigns)
      .where(sql`${campaigns.id} = ${id} AND ${campaigns.tenantId} = ${request.tenantId} AND ${campaigns.status} = 'draft'`)
      .returning();

    if (!deleted[0]) {
      return reply.status(400).send({ error: "Campaign not found or not in draft status" });
    }
    return reply.send({ success: true });
  });

  app.patch("/api/campaigns/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };

    const validStatuses = ["draft", "active", "paused", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return reply.status(400).send({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const updated = await db.update(campaigns)
      .set({ status, updatedAt: new Date() })
      .where(sql`${campaigns.id} = ${id} AND ${campaigns.tenantId} = ${request.tenantId}`)
      .returning();

    if (!updated[0]) {
      return reply.status(404).send({ error: "Campaign not found" });
    }
    return reply.send(updated[0]);
  });

  app.post("/api/campaigns/:id/variants", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      role: string;
      script?: string;
      weight?: number;
    };

    const validRoles = ["control", "variant_a", "variant_b", "variant_c", "variant_d"];
    if (!validRoles.includes(body.role)) {
      return reply.status(400).send({ error: `Invalid role. Must be: ${validRoles.join(", ")}` });
    }

    const existingCount = await db.select({ count: sql<number>`count(*)` })
      .from(audioVariants)
      .where(eq(audioVariants.campaignId, id));

    if (existingCount[0]?.count && existingCount[0].count >= 5) {
      return reply.status(400).send({ error: "Maximum 5 variants per campaign" });
    }

    const variant = await db.insert(audioVariants).values({
      campaignId: id,
      role: body.role,
      script: body.script || "",
      weight: body.weight || 20,
    }).returning();

    return reply.status(201).send(variant[0]);
  });

  app.put("/api/campaigns/:id/variants/:vid", async (request, reply) => {
    const { vid } = request.params as { vid: string };
    const body = request.body as {
      script?: string;
      weight?: number;
      audio_url?: string;
      role?: string;
    };

    const updated = await db.update(audioVariants)
      .set({
        ...(body.script !== undefined ? { script: body.script } : {}),
        ...(body.weight !== undefined ? { weight: body.weight } : {}),
        ...(body.audio_url !== undefined ? { audioUrl: body.audio_url } : {}),
        ...(body.role ? { role: body.role } : {}),
        updatedAt: new Date(),
      })
      .where(eq(audioVariants.id, vid))
      .returning();

    if (!updated[0]) {
      return reply.status(404).send({ error: "Variant not found" });
    }
    return reply.send(updated[0]);
  });

  app.delete("/api/campaigns/:id/variants/:vid", async (request, reply) => {
    const { vid } = request.params as { vid: string };
    await db.delete(audioVariants).where(eq(audioVariants.id, vid));
    return reply.send({ success: true });
  });

  app.post("/api/campaigns/:id/generate", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { prompt } = request.body as { prompt: string };

    const campaign = await db.select().from(campaigns)
      .where(sql`${campaigns.id} = ${id} AND ${campaigns.tenantId} = ${request.tenantId}`)
      .limit(1);

    if (!campaign[0]) {
      return reply.status(404).send({ error: "Campaign not found" });
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2000,
          messages: [{
            role: "user",
            content: `Generate an audio ad script for a retail store campaign. 
Campaign name: ${campaign[0].name}
Goal: ${campaign[0].goal || "general"}
User prompt: ${prompt}

Generate 4 variants (control + 3 variants) with different approaches. 
Return as JSON array: [{role: "control", script: "..."}, {role: "variant_a", script: "..."}, ...]`,
          }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        app.log.warn({ msg: "Anthropic API error", error: errorText });
        return reply.status(502).send({ error: "AI generation failed" });
      }

      const result = await response.json();
      const content = result.content?.[0]?.text;
      let generatedVariants: Array<{ role: string; script: string }> = [];

      try {
        generatedVariants = JSON.parse(content || "[]");
      } catch {
        generatedVariants = [{ role: "control", script: content || "" }];
      }

      for (const v of generatedVariants) {
        const existingRole = await db.select()
          .from(audioVariants)
          .where(sql`${audioVariants.campaignId} = ${id} AND ${audioVariants.role} = ${v.role}`)
          .limit(1);

        if (existingRole[0]) {
          await db.update(audioVariants)
            .set({ script: v.script, isGenerated: true, updatedAt: new Date() })
            .where(eq(audioVariants.id, existingRole[0].id));
        } else {
          await db.insert(audioVariants).values({
            campaignId: id,
            role: v.role,
            script: v.script,
            weight: 20,
            isGenerated: true,
          });
        }
      }

      const updatedVariants = await db.select()
        .from(audioVariants)
        .where(eq(audioVariants.campaignId, id));

      return reply.send(updatedVariants);
    } catch (err) {
      app.log.error({ msg: "AI generate error", err });
      return reply.status(502).send({ error: "AI service unavailable" });
    }
  });
}
