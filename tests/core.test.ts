import { describe, it, expect } from "vitest";
import { aggregate, convert, latestChange, pageNumber } from "../lib/metrics";
import { gregorian, jalali } from "../lib/date";
import { priceSchema, idSchema } from "../lib/validations";
import type { PriceRecord } from "../lib/types";
const record = (
  date: string,
  apartment: number,
  usd: number | null,
  gold: number | null,
): PriceRecord => ({
  id: "e3f4935a-245a-4ff1-99f9-609242a7a828",
  record_date: date,
  apartment_price_toman: apartment,
  usd_price_toman: usd,
  gold_18k_price_toman: gold,
  created_at: "2026-01-01T00:00:00Z",
});
describe("financial calculations", () => {
  it("converts each record and preserves missing rates", () => {
    expect(convert(record("2024-03-20", 10000000, 50000, null))).toMatchObject({
      toman: 10000000,
      usd: 200,
      gold: null,
    });
  });
  it("averages conversions rather than dividing averages", () => {
    const p = aggregate(
      [record("2024-03-20", 100, 10, null), record("2024-03-21", 300, 20, 30)],
      "monthly",
    );
    expect(p).toHaveLength(1);
    expect(p[0]).toMatchObject({ toman: 200, usd: 12.5, gold: 10 });
  });
  it("keeps entirely missing metrics null", () => {
    expect(
      aggregate([record("2024-03-20", 100, null, null)], "yearly")[0].usd,
    ).toBeNull();
  });
  it("uses previous valid value across missing records", () => {
    const p = aggregate(
      [
        record("2024-03-20", 100, 10, null),
        record("2024-03-21", 200, null, null),
        record("2024-03-22", 300, 20, null),
      ],
      "daily",
    );
    expect(latestChange(p, "usd")).toEqual({ latest: 15, change: 50 });
  });
  it("retains daily gaps and sorts chronologically", () => {
    const p = aggregate(
      [
        record("2024-03-22", 200, null, null),
        record("2024-03-20", 100, 10, null),
      ],
      "daily",
    );
    expect(p.map((v) => v.label)).toEqual(["1403/01/01", "1403/01/03"]);
    expect(p[1].usd).toBeNull();
  });
});
describe("Jalali boundaries", () => {
  it("round trips Gregorian storage dates", () => {
    expect(jalali("2024-03-20")).toBe("1403/01/01");
    expect(gregorian("1403/01/01")).toBe("2024-03-20");
  });
  it("groups across Nowruz into separate years", () => {
    const rows = [
      record("2024-03-19", 100, null, null),
      record("2024-03-20", 200, null, null),
    ];
    expect(aggregate(rows, "yearly").map((p) => p.label)).toEqual([
      "1402",
      "1403",
    ]);
    expect(aggregate(rows, "monthly").map((p) => p.label)).toEqual([
      "1402/12",
      "1403/01",
    ]);
  });
  it("rejects impossible and unpadded dates", () => {
    expect(gregorian("1403/13/01")).toBeNull();
    expect(gregorian("1402/12/30")).toBeNull();
    expect(gregorian("1403/1/1")).toBeNull();
  });
});
describe("validation", () => {
  const valid = {
    date: "1403/01/01",
    apartment: "10,000,000",
    usd: "",
    gold: "",
  };
  it("stores blank rates as null and accepts Persian digits", () => {
    expect(priceSchema.parse({ ...valid, apartment: "۱۰٬۰۰۰٬۰۰۰" })).toEqual({
      date: "1403/01/01",
      apartment: 10000000,
      usd: null,
      gold: null,
    });
  });
  it.each(["0", "-1", "1.5", "1e9", "9007199254740992", "abc", ""])(
    "rejects invalid required money %s",
    (apartment) => {
      expect(priceSchema.safeParse({ ...valid, apartment }).success).toBe(
        false,
      );
    },
  );
  it("rejects invalid optional rates and IDs", () => {
    expect(priceSchema.safeParse({ ...valid, usd: "0" }).success).toBe(false);
    expect(idSchema.safeParse("not-an-id").success).toBe(false);
  });
  it.each([undefined, "0", "-2", "1.5", "oops", ["2"], "9007199254740992"])(
    "normalizes invalid pagination %s",
    (value) => {
      expect(pageNumber(value)).toBe(1);
    },
  );
  it("accepts valid page", () => expect(pageNumber("2")).toBe(2));
});
