// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { ownsPending, scopedKey, setCaptureScope, withKeyFor } from "./pending";
import { sendPending } from "@/components/captures/useSender";

describe("pending capture scoping (C1)", () => {
  const rec = { id: "k1", kind: "note" as const, text: "x", eventName: "", tzOffset: 0, createdAt: 1, tenantId: "t1", userId: "u1" };

  it("only the saving tenant and user own a record", () => {
    setCaptureScope("t1", "u1");
    expect(ownsPending(rec)).toBe(true);
    setCaptureScope("t1", "u2");
    expect(ownsPending(rec)).toBe(false);
    setCaptureScope("t2", "u1");
    expect(ownsPending(rec)).toBe(false);
    setCaptureScope(null, null);
    expect(ownsPending(rec)).toBe(false);
    expect(ownsPending({ ...rec, tenantId: undefined, userId: undefined })).toBe(false);
  });

  it("namespaces storage keys per tenant and user, and has none when signed out", () => {
    setCaptureScope("t1", "u1");
    const a = scopedKey("captureiq.event");
    setCaptureScope("t1", "u2");
    expect(scopedKey("captureiq.event")).not.toBe(a);
    setCaptureScope(null, null);
    expect(scopedKey("captureiq.event")).toBeNull();
  });

  it("sendPending refuses another user's record before any request", async () => {
    setCaptureScope("t1", "u2");
    await expect(sendPending(rec)).rejects.toThrow(/another user/);
  });

  it("issues a new client key when the content changed and keeps it for an unchanged retry (M10)", () => {
    expect(withKeyFor(rec, { ...rec }).id).toBe("k1");
    const changed = withKeyFor(rec, { ...rec, text: "different" });
    expect(changed.id).not.toBe("k1");
    expect(withKeyFor(rec, { ...rec, eventName: "Expo" }).id).not.toBe("k1");
  });
});
