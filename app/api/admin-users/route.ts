import { NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import {
  listAdminUsers,
  countAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "@/lib/db/queries/admin-users";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { revalidatePath } from "next/cache";

export async function GET(req: Request) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const branchId = searchParams.get("branchId");
  const search = searchParams.get("search");
  const isActive = searchParams.get("isActive");
  const page = searchParams.get("page");
  const pageSize = searchParams.get("pageSize");

  const filters = {
    role: role || undefined,
    branchId: branchId ? Number(branchId) : undefined,
    search: search || undefined,
    isActive: isActive ? isActive === "true" : undefined,
    page: page ? Number(page) : 1,
    pageSize: pageSize ? Number(pageSize) : 10,
  };

  const [rows, total] = await Promise.all([
    listAdminUsers(filters),
    countAdminUsers(filters),
  ]);

  const sanitizedRows = rows.map((row) => ({
    ...row,
    passwordHash: undefined,
  }));

  return NextResponse.json({ rows: sanitizedRows, total });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const id = body.id ? Number(body.id) : undefined;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const fullName =
    typeof body.fullName === "string" ? body.fullName.trim() : "";
  const role = typeof body.role === "string" ? body.role.trim() : "";
  const branchId =
    body.branchId !== null && body.branchId !== undefined
      ? Number(body.branchId)
      : null;
  const isActive =
    typeof body.isActive === "boolean" ? body.isActive : true;
  const password =
    typeof body.password === "string" ? body.password.trim() : "";

  if (!email || !fullName || !role) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  if (role !== "SUPERADMIN" && role !== "ADMIN_BRANCH") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (role === "SUPERADMIN" && branchId !== null) {
    return NextResponse.json(
      { error: "Superadmin cannot have branch_id" },
      { status: 400 }
    );
  }

  if (role === "ADMIN_BRANCH" && !branchId) {
    return NextResponse.json(
      { error: "Admin branch must have branch_id" },
      { status: 400 }
    );
  }

  if (id) {
    await updateAdminUser(id, {
      email,
      fullName,
      role,
      branchId,
      isActive,
    });
    revalidatePath("/users");
    return NextResponse.json({ ok: true, id });
  }

  if (!password) {
    return NextResponse.json(
      { error: "Password required for new user" },
      { status: 400 }
    );
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return NextResponse.json(
      { error: passwordValidation.error },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  const result = await createAdminUser({
    email,
    passwordHash,
    fullName,
    role,
    branchId,
    isActive,
  });

  revalidatePath("/users");
  return NextResponse.json({ ok: true, id: result.id });
}

export async function DELETE(req: Request) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await deleteAdminUser(Math.trunc(id));
  revalidatePath("/users");

  return NextResponse.json({ ok: true });
}
