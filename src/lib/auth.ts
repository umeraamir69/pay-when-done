import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { passkey } from "@better-auth/passkey";
import { prisma } from "./prisma";

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const hostname = (() => {
  try {
    return new URL(baseURL).hostname;
  } catch {
    return "localhost";
  }
})();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    passkey({
      rpName: "PayWhenDone",
      rpID: hostname,
      origin: baseURL,
    }),
  ],
  trustedOrigins: [baseURL],
});

export type Session = typeof auth.$Infer.Session;
