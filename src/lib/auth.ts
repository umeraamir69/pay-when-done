import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { passkey } from "@better-auth/passkey";
import { magicLink } from "better-auth/plugins";
import { prisma } from "./prisma";
import { isEmailAuthConfigured, sendMagicLinkEmail } from "./email";

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
    magicLink({
      // Signup stays email+password; magic link is sign-in only.
      disableSignUp: true,
      expiresIn: 60 * 5,
      async sendMagicLink({ email, url }) {
        if (!isEmailAuthConfigured()) {
          throw new Error(
            "Magic link email is not configured. Use a passkey or email + password.",
          );
        }
        await sendMagicLinkEmail({ email, url });
      },
    }),
  ],
  trustedOrigins: [baseURL],
});

export type Session = typeof auth.$Infer.Session;
