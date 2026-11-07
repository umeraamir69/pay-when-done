"use client";

import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";

/**
 * Use the current browser origin (not a baked-in env URL) so cookies and
 * WebAuthn rpID/origin stay aligned on Vercel aliases + localhost.
 */
export const authClient = createAuthClient({
  plugins: [passkeyClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
