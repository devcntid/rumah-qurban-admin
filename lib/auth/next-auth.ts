import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getAdminUserByEmail, updateLastLogin } from "@/lib/db/queries/admin-users";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) {
        return false;
      }

      try {
        const adminUser = await getAdminUserByEmail(user.email);
        
        if (!adminUser) {
          return "/login?error=EmailNotRegistered";
        }

        if (!adminUser.isActive) {
          return "/login?error=AccountInactive";
        }

        await updateLastLogin(adminUser.id);
        
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (user && user.email) {
        try {
          const adminUser = await getAdminUserByEmail(user.email);
          
          if (adminUser) {
            token.userId = adminUser.id;
            token.email = adminUser.email;
            token.name = adminUser.fullName;
            token.role = adminUser.role;
            token.branchId = adminUser.branchId;
          }
        } catch (error) {
          console.error("JWT callback error:", error);
        }
      }
      
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.userId as number,
          email: token.email as string,
          name: token.name as string,
          role: token.role as string,
          branchId: token.branchId as number | null,
        };
      }
      
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
