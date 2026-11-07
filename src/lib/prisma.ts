import { copyFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma SQLite URLs are relative to the schema folder (`prisma/`).
 * On Vercel only /tmp is writable — copy the seeded DB there once per instance.
 */
function resolveDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL;

  if (configured && !configured.startsWith("file:")) {
    return configured;
  }

  if (process.env.VERCEL) {
    const runtimePath = "/tmp/pay-when-done.db";
    const seedCandidates = [
      join(process.cwd(), "prisma", "deploy.db"),
      join(process.cwd(), "prisma", "dev.db"),
      join(process.cwd(), "prisma", "prisma", "deploy.db"),
      join(process.cwd(), "prisma", "prisma", "dev.db"),
    ];
    if (!existsSync(runtimePath)) {
      mkdirSync(dirname(runtimePath), { recursive: true });
      const seed = seedCandidates.find((p) => existsSync(p));
      if (seed) {
        copyFileSync(seed, runtimePath);
      }
    }
    return `file:${runtimePath}`;
  }

  return configured || "file:./dev.db";
}

const databaseUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = databaseUrl;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
