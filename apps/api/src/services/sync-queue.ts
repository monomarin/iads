import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null }) as any;

export const syncQueue = new Queue("sync", { connection });

export function createSyncWorker(processor: (job: { data: { storeId: string; type: string } }) => Promise<void>) {
  const worker = new Worker(
    "sync",
    async (job) => {
      await processor({ data: job.data as { storeId: string; type: string } });
    },
    { connection } as any,
  );
  worker.on("completed", (job) => console.log(`Sync job ${job.id} completed`));
  worker.on("failed", (job, err) => console.error(`Sync job ${job?.id} failed:`, err));
  return worker;
}

export async function addSyncJob(storeId: string, type: "scheduled" | "manual" | "urgent" = "manual") {
  return syncQueue.add("sync-store", { storeId, type }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 60000 },
  });
}
