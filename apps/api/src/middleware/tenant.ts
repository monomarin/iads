import { FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    tenantId?: string;
    userId?: string;
    userRole?: string;
  }
}

export async function tenantMiddleware(request: FastifyRequest, reply: FastifyReply) {
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

    request.tenantId = payload.tenant_id as string;
    request.userId = payload.sub as string;
    request.userRole = payload.role as string;

    if (!request.tenantId) {
      return reply.status(403).send({ error: "No tenant assigned" });
    }
  } catch {
    return reply.status(401).send({ error: "Invalid or expired token" });
  }
}
