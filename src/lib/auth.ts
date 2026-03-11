import NextAuth, { type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma";

export const AUTH_ROLES = {
  ADMIN: "admin",
} as const;

export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_DASHBOARD_PATH = "/admin";

const credentialsSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;

        const user = await prisma.adminUser.findUnique({
          where: { username },
        });

        if (!user) return null;

        const isValid = await compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: ADMIN_LOGIN_PATH,
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.sub === "string") {
          session.user.id = token.sub;
        }

        if (typeof token.role === "string") {
          session.user.role = token.role;
        }
      }

      return session;
    },
  },
});

export type AuthGuardResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

export async function requireAuth(): Promise<AuthGuardResult> {
  const session = await auth();

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, session };
}

export function requireRole(
  session: Session,
  role: string,
): NextResponse | null {
  const userRole = session.user.role;

  if (!userRole || userRole !== role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export async function requireAdminAuth(): Promise<AuthGuardResult> {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult;

  const roleDenied = requireRole(authResult.session, AUTH_ROLES.ADMIN);
  if (roleDenied) {
    return { ok: false, response: roleDenied };
  }

  return authResult;
}

export { enforceSameOrigin } from "./request-guards";

export async function requireAdminPageSession(): Promise<Session> {
  const session = await auth();

  if (!session?.user) {
    redirect(ADMIN_LOGIN_PATH);
  }

  if (session.user.role !== AUTH_ROLES.ADMIN) {
    redirect("/");
  }

  return session;
}
