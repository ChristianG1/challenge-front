import { describe, expect, it } from "vitest";
import { formatMoney, parseAmount, toCents } from "./money";

describe("parseAmount", () => {
  it.each([
    ["100", 10_000],
    ["100.5", 10_050],
    ["0.01", 1],
    ["1,250.75", 125_075],
    ["$ 300", 30_000],
    ["-20", -2_000],
    ["0", 0],
  ])("parses %s as %i cents", (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(["", "abc", "10.123", "1.2.3", "--5", "1e5"])("rejects %j", (input) => {
    expect(parseAmount(input)).toBeNull();
  });

  it("avoids floating point errors", () => {
    expect(parseAmount("19.99")).toBe(1999);
  });
});

describe("toCents", () => {
  it("rejects non-integer values", () => {
    expect(() => toCents(10.5)).toThrow(RangeError);
  });
});

describe("formatMoney", () => {
  it("formats cents as MXN", () => {
    expect(formatMoney(toCents(125_075))).toBe("$1,250.75");
  });
});
