import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prisma } from "@/lib/db/prisma";
import { ALLOWED_EMAIL_DOMAIN, isAllowedEmail } from "@/lib/validations/auth";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        input: true,
        returned: true,
      },
    },
  },
  session: {
    // Signed cookie cache: skips the remote Postgres round trip on most session checks.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  hooks: {
    // Server-side enforcement: the client check in the register form can be bypassed.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const email = typeof ctx.body?.email === "string" ? ctx.body.email : "";
      if (!isAllowedEmail(email)) {
        throw new APIError("BAD_REQUEST", {
          message: `Only @${ALLOWED_EMAIL_DOMAIN} email addresses can register`,
        });
      }
    }),
  },
  plugins: [nextCookies()],
});
