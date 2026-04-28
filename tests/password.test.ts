import { describe, expect, it } from "vitest";
import {
  hashPassword,
  normalizeEmail,
  validateRegistration,
  verifyPassword,
} from "@/lib/password";

describe("hashPassword + verifyPassword", () => {
  it("produces a bcrypt-style hash that is not the plain text", async () => {
    const hash = await hashPassword("hunter22!");
    expect(hash).not.toBe("hunter22!");
    expect(hash.startsWith("$2")).toBe(true);
    expect(hash.length).toBeGreaterThan(40);
  });

  it("verifies the correct password", async () => {
    const hash = await hashPassword("hunter22!");
    expect(await verifyPassword("hunter22!", hash)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("hunter22!");
    expect(await verifyPassword("wrong-pass-1", hash)).toBe(false);
  });

  it("produces different hashes for the same password (salted)", async () => {
    const a = await hashPassword("hunter22!");
    const b = await hashPassword("hunter22!");
    expect(a).not.toBe(b);
    expect(await verifyPassword("hunter22!", a)).toBe(true);
    expect(await verifyPassword("hunter22!", b)).toBe(true);
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Foo@Bar.COM  ")).toBe("foo@bar.com");
  });
});

describe("validateRegistration", () => {
  it("accepts a valid input", () => {
    expect(
      validateRegistration({
        email: "user@example.com",
        name: "Mira",
        password: "longenough1",
      })
    ).toEqual([]);
  });

  it("flags missing email", () => {
    expect(
      validateRegistration({ email: "", name: "Mira", password: "longenough1" })
    ).toContain("email_required");
  });

  it("flags malformed email", () => {
    expect(
      validateRegistration({
        email: "not-an-email",
        name: "Mira",
        password: "longenough1",
      })
    ).toContain("email_invalid");
  });

  it("flags missing name", () => {
    expect(
      validateRegistration({
        email: "user@example.com",
        name: "",
        password: "longenough1",
      })
    ).toContain("name_required");
  });

  it("flags too-short name", () => {
    expect(
      validateRegistration({
        email: "user@example.com",
        name: "x",
        password: "longenough1",
      })
    ).toContain("name_too_short");
  });

  it("flags short password", () => {
    expect(
      validateRegistration({
        email: "user@example.com",
        name: "Mira",
        password: "short",
      })
    ).toContain("password_too_short");
  });

  it("returns multiple errors at once", () => {
    const errs = validateRegistration({ email: "", name: "", password: "" });
    expect(errs).toEqual(
      expect.arrayContaining([
        "email_required",
        "name_required",
        "password_too_short",
      ])
    );
  });
});
