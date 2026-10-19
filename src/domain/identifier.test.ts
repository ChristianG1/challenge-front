import { describe, expect, it } from "vitest";
import { parseIdentifier } from "./identifier";

describe("parseIdentifier", () => {
  it("normalizes emails to lowercase", () => {
    expect(parseIdentifier("  Demo@Spin.MX ")).toEqual({ kind: "email", value: "demo@spin.mx" });
  });

  it.each(["5512345678", "55 1234 5678", "55-1234-5678", "+52 55 1234 5678", "(55) 1234-5678"])(
    "accepts phone %j",
    (input) => {
      expect(parseIdentifier(input)).toEqual({ kind: "phone", value: "5512345678" });
    },
  );

  it.each(["", "demo@", "demo@spin", "12345", "55123456789", "phone"])("rejects %j", (input) => {
    expect(parseIdentifier(input)).toBeNull();
  });
});
