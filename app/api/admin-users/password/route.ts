import { NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import { updateAdminPassword } from "@/lib/db/queries/admin-users";
import { hashPassword, validatePassword } from "@/lib/auth/password";

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

  const userId = body.userId ? Number(body.userId) : undefined;
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword.trim() : "";

  if (!userId || !Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  if (!newPassword) {
    return NextResponse.json(
      { error: "New password required" },
      { status: 400 }
    );
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return NextResponse.json(
      { error: passwordValidation.error },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(newPassword);
  await updateAdminPassword(userId, passwordHash);

  return NextResponse.json({ ok: true });
}
