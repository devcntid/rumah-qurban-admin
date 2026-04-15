import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePassword(password: string): {
  valid: boolean;
  error?: string;
} {
  if (password.length < 8) {
    return { valid: false, error: "Password minimal 8 karakter" };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password harus mengandung huruf kapital" };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password harus mengandung huruf kecil" };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password harus mengandung angka" };
  }

  return { valid: true };
}
