import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      email: string;
      name: string;
      role: string;
      branchId: number | null;
    };
  }

  interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    branchId: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: number;
    email?: string;
    name?: string;
    role?: string;
    branchId?: number | null;
  }
}
