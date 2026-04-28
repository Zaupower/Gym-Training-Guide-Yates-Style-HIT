import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RegistrationInput {
  email: string;
  name: string;
  password: string;
}

export type RegistrationError =
  | "email_required"
  | "email_invalid"
  | "name_required"
  | "name_too_short"
  | "password_too_short";

/**
 * Pure validator. Returns a list of error codes (empty = valid).
 */
export function validateRegistration(
  input: Partial<RegistrationInput>
): RegistrationError[] {
  const errors: RegistrationError[] = [];
  const email = (input.email ?? "").trim().toLowerCase();
  const name = (input.name ?? "").trim();
  const password = input.password ?? "";

  if (!email) errors.push("email_required");
  else if (!EMAIL_RE.test(email)) errors.push("email_invalid");

  if (!name) errors.push("name_required");
  else if (name.length < 2) errors.push("name_too_short");

  if (password.length < 8) errors.push("password_too_short");

  return errors;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
