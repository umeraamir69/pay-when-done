import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { passkey } from "@better-auth/passkey";
import { prisma } from "./prisma";

function originHost(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const explicitBase =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "http://localhost:3000";

const trustedOrigins = Array.from(
  new Set(
    [
      explicitBase,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.BETTER_AUTH_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : null,
      "https://pay-when-done.vercel.app",
      "https://pay-when-done-umeraamir69s-projects.vercel.app",
      "http://localhost:3000",
    ].filter(Boolean) as string[],
  ),
);

// WebAuthn rpID must match the browser hostname (no scheme/port).
const rpID =
  originHost(explicitBase) ||
  originHost("https://pay-when-done.vercel.app") ||
  "localhost";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: explicitBase,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    passkey({
      rpName: "PayWhenDone",
      rpID,
      origin: trustedOrigins,
    }),
  ],
  trustedOrigins,
});

export type Session = typeof auth.$Infer.Session;
