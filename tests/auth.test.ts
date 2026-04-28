import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  readSessionToken,
} from "@/lib/auth";

describe("session token", () => {
  it("round-trips uid and email", async () => {
    const token = await createSessionToken({
      uid: "user_123",
      email: "user@example.com",
    });
    const payload = await readSessionToken(token);
    expect(payload).toEqual({ uid: "user_123", email: "user@example.com" });
  });

  it("rejects a tampered token", async () => {
    const token = await createSessionToken({
      uid: "user_123",
      email: "user@example.com",
    });
    const tampered = token.slice(0, -2) + (token.endsWith("a") ? "bb" : "aa");
    const payload = await readSessionToken(tampered);
    expect(payload).toBeNull();
  });

  it("rejects garbage tokens", async () => {
    expect(await readSessionToken("not.a.jwt")).toBeNull();
    expect(await readSessionToken("")).toBeNull();
  });
});
