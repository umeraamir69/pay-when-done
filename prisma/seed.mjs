/**
 * Local/dev admin seed for Better Auth email+password sign-in.
 *
 * Admin access is gated by ADMIN_EMAILS (comma-separated). Set:
 *   ADMIN_EMAILS=umer@umer.com
 * If ADMIN_EMAILS is unset, any signed-in user can hit /admin APIs.
 *
 * Re-run safely: upserts user + credential account password.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

/** Load KEY=VALUE from a dotenv file into process.env (override existing). */
function loadEnvFile(relativePath) {
  const full = resolve(process.cwd(), relativePath);
  if (!existsSync(full)) return;
  for (const line of readFileSync(full, "utf8").split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

// Prefer Next.js-style .env.local over Prisma's default .env (may be a stub).
loadEnvFile(".env");
loadEnvFile(".env.local");

const prisma = new PrismaClient();

const ADMIN_EMAIL = "umer@umer.com";
const ADMIN_PASSWORD = "umer123123";
const ADMIN_NAME = "Umer Admin";

async function main() {
  const email = ADMIN_EMAIL.toLowerCase();
  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: ADMIN_NAME,
      emailVerified: true,
    },
    update: {
      name: ADMIN_NAME,
      emailVerified: true,
    },
  });

  const existing = await prisma.account.findFirst({
    where: {
      userId: user.id,
      providerId: "credential",
    },
  });

  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: {
        password: passwordHash,
        accountId: user.id,
      },
    });
  } else {
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: passwordHash,
      },
    });
  }

  console.log(`Seeded admin user: ${email} (id=${user.id})`);
  console.log(
    "Ensure ADMIN_EMAILS includes this address for allow-listed /admin access.",
  );
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
