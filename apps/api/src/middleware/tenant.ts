import { FastifyRequest, FastifyReply } from "fastify";
import { db, users, tenants } from "@raemonorepo/db";
import { eq } from "drizzle-orm";

declare module "fastify" {
  interface FastifyRequest {
    tenantId?: string;
    userId?: string;
    userRole?: string;
  }
}

export async function tenantMiddleware(request: FastifyRequest, reply: FastifyReply) {
  if (request.method === "OPTIONS") {
    return;
  }
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing authorization header" });
  }

  const token = authHeader.slice(7);
  try {
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      throw new Error("Invalid token format");
    }

    const payload = JSON.parse(
      Buffer.from(tokenParts[1]!, "base64").toString("utf-8"),
    );

    const clerkUserId: string = payload.sub as string;
    request.userId = clerkUserId;
    request.tenantId = payload.tenant_id as string | undefined;
    request.userRole = payload.role as string | undefined;

    // ── Step 1: Try to find user in our DB ────────────────────────────────────
    if (clerkUserId) {
      try {
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, clerkUserId))
          .limit(1);

        if (userResult[0]) {
          // User exists – use DB values as source of truth
          request.tenantId = userResult[0].tenantId;
          request.userRole = userResult[0].role;
        } else {
          // ── Step 2: User not in DB (webhook missed). Auto-provision them. ────
          console.log(`[TenantMiddleware] Auto-provisioning user ${clerkUserId}`);

          // Determine or create tenant
          let tenantId = request.tenantId;

          if (!tenantId) {
            // Check if email is in the token (Clerk includes it sometimes)
            const email: string = (payload.email as string) || `user_${clerkUserId.slice(-8)}@local.dev`;
            const slug = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "-") || "new-store";

            // Create new tenant
            const newTenant = await db.insert(tenants).values({
              name: `${slug}'s Store`,
              slug: `${slug}-${Date.now()}`,
              features: ["analytics", "campaigns", "playlists", "edge-nodes", "billing"],
            }).returning();
            tenantId = newTenant[0]!.id;
          } else {
            // Ensure the tenant row exists
            const existing = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
            if (!existing[0]) {
              const email: string = (payload.email as string) || `user_${clerkUserId.slice(-8)}@local.dev`;
              const slug = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "-") || "new-store";
              await db.insert(tenants).values({
                id: tenantId,
                name: `${slug}'s Store`,
                slug: `${slug}-${Date.now()}`,
                features: ["analytics", "campaigns", "playlists", "edge-nodes", "billing"],
              });
            }
          }

          // Create user record
          const email: string = (payload.email as string) || `user_${clerkUserId.slice(-8)}@local.dev`;
          const newUser = await db.insert(users).values({
            clerkId: clerkUserId,
            tenantId: tenantId!,
            email,
            role: request.userRole || "store_admin",
          }).returning();

          request.tenantId = newUser[0]!.tenantId;
          request.userRole = newUser[0]!.role;
          console.log(`[TenantMiddleware] Auto-provisioned: tenant=${request.tenantId} role=${request.userRole}`);
        }
      } catch (dbErr) {
        console.error("[TenantMiddleware] DB operation failed:", dbErr);
        // Final fallback so the request doesn't hang
        if (!request.tenantId) {
          request.tenantId = "00000000-0000-0000-0000-000000000001";
          request.userRole = request.userRole || "super_admin";
        }
      }
    }

    // ── Step 3: Absolute last resort fallback ─────────────────────────────────
    if (!request.tenantId) {
      request.tenantId = "00000000-0000-0000-0000-000000000001";
      if (!request.userRole) {
        request.userRole = "super_admin";
      }
    }
  } catch {
    return reply.status(401).send({ error: "Invalid or expired token" });
  }
}
