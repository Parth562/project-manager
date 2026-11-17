import { Prisma, PrismaClient } from "@prisma/client";

// Supabase's pooler (Supavisor) closes client connections that sit idle. Prisma
// only notices when it next tries to use one, and that query fails with
// "Server has closed the connection" (P1017) or a similar connection error.
// We retry such queries, rebuilding the pool if a plain retry hits the same
// dead connection again.
const RETRYABLE_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Database server timed out
  "P1017", // Server has closed the connection
  "P2024", // Timed out fetching a connection from the pool
]);
const RETRY_DELAYS_MS = [150, 500, 500];

function isConnectionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_CODES.has(error.code);
  }
  if (
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientInitializationError
  ) {
    // e.g. 57P01 "terminating connection due to administrator command" when the
    // pooler/Postgres kills the backend, or a raw socket reset.
    return /closed the connection|terminating connection|57P01|connection reset|broken pipe|can't reach database/i.test(
      error.message
    );
  }
  return false;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createPrismaClient() {
  // Set PRISMA_LOG_QUERIES=1 to print every query with its duration (debugging only).
  const logQueries = process.env.PRISMA_LOG_QUERIES === "1";
  const base = new PrismaClient(
    logQueries ? { log: [{ emit: "event", level: "query" }] } : undefined
  );
  if (logQueries) {
    (base as unknown as PrismaClient<Prisma.PrismaClientOptions, "query">).$on("query", (e) => {
      console.log(`[prisma:query] ${String(e.duration).padStart(5)}ms ${e.query.slice(0, 110)}`);
    });
  }
  // Open the pool eagerly: the first handshake to the remote Supabase pooler
  // can take several seconds, so pay it at startup, not on the first page view.
  base.$connect().catch(() => {
    // Ignore here; the first real query will retry and surface any error.
  });

  // Prisma does not always evict a dead connection right away, so a plain retry
  // can land on the same broken socket. Rebuilding the pool guarantees fresh
  // connections. Concurrent failures share one reset instead of each doing one.
  let resetInFlight: Promise<void> | null = null;
  function resetPool() {
    resetInFlight ??= (async () => {
      try {
        await base.$disconnect();
        await base.$connect();
      } catch {
        // The retried query will surface a real error if the DB is truly down.
      } finally {
        resetInFlight = null;
      }
    })();
    return resetInFlight;
  }

  return base.$extends({
    name: "retry-on-connection-error",
    query: {
      async $allOperations({ args, query, operation, model }) {
        for (let attempt = 0; ; attempt++) {
          try {
            return await query(args);
          } catch (error) {
            if (!isConnectionError(error) || attempt >= RETRY_DELAYS_MS.length) throw error;
            console.warn(
              `[prisma] ${model ?? ""}.${operation} hit a dropped connection, retry ${attempt + 1}/${RETRY_DELAYS_MS.length}`
            );
            await sleep(RETRY_DELAYS_MS[attempt]);
            // First retry reuses the pool; if that failed too, rebuild it.
            if (attempt >= 1) await resetPool();
          }
        }
      },
    },
  });
}

// Opening a connection to the remote Supabase pooler costs 3-7s, and idle
// connections get dropped after roughly 30s. Without a keep-alive, almost every
// page after a short pause paid that handshake again. A tiny periodic query keeps
// the pooled connections warm. One ping per pooled connection (connection_limit).
const KEEP_ALIVE_MS = 20_000;
const POOL_SIZE = Number(
  /[?&]connection_limit=(\d+)/.exec(process.env.DATABASE_URL ?? "")?.[1] ?? 1
);

function startKeepAlive(client: ExtendedPrismaClient) {
  const timer = setInterval(() => {
    Promise.all(
      Array.from({ length: POOL_SIZE }, () => client.$queryRaw`SELECT 1`)
    ).catch(() => {
      // Ignore: the retry logic handles dropped connections on real queries.
    });
  }, KEEP_ALIVE_MS);
  timer.unref(); // never keep the process alive just for this
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

// Reuse one client across hot reloads in dev. Bump the key when the client
// setup changes, so a running dev server stops reusing the cached old client.
const GLOBAL_KEY = "prismaClientV4";
const globalForPrisma = globalThis as unknown as Record<string, ExtendedPrismaClient | undefined>;

function createClientWithKeepAlive() {
  const client = createPrismaClient();
  startKeepAlive(client);
  return client;
}

export const prisma = globalForPrisma[GLOBAL_KEY] ?? createClientWithKeepAlive();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma[GLOBAL_KEY] = prisma;
}
