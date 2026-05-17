import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { upsertOAuthCustomerUser, verifyUserCredentials } from "@/lib/services/user-service";

const authSecret =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development" ? "theootd-dev-nextauth-secret-change-me" : undefined);

if (!authSecret) {
  throw new Error("Missing NEXTAUTH_SECRET environment variable.");
}

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  session: {
    strategy: "jwt",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();

        if (!email || !password) {
          return null;
        }

        const user = await verifyUserCredentials(email, password);

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const normalize = (candidate: string) => {
        if (candidate.startsWith("/")) {
          return `${baseUrl}${candidate}`;
        }

        try {
          const parsed = new URL(candidate);
          if (parsed.origin === baseUrl) {
            return parsed.toString();
          }
        } catch {
          return baseUrl;
        }

        return baseUrl;
      };

      const normalizedUrl = normalize(url);

      try {
        const parsed = new URL(normalizedUrl);

        if (parsed.pathname === "/login") {
          const nested = parsed.searchParams.get("callbackUrl") ?? parsed.searchParams.get("next");

          if (nested) {
            return normalize(nested);
          }
        }

        return normalizedUrl;
      } catch {
        return baseUrl;
      }
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google") {
        const email = user?.email?.toString().trim().toLowerCase();

        if (email) {
          try {
            const customer = await upsertOAuthCustomerUser({
              email,
              name: user?.name,
            });

            token.sub = customer.id;
            token.email = customer.email;
            token.name = customer.name;
            token.role = customer.role;
          } catch {
            token.role = "customer";
          }
        } else {
          token.role = "customer";
        }
      }

      if (user) {
        token.role = user.role ?? token.role ?? "customer";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as "customer" | "admin" | undefined) ?? "customer";
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
