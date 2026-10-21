import type { Aggregation, PriceRecord } from "./types";
import { jalali } from "./date";
export type Point = {
  date: string;
  label: string;
  toman: number;
  usdt: number | null;
  gold: number | null;
};
export function convert(r: PriceRecord): Point {
  return {
    date: r.record_date,
    label: jalali(r.record_date),
    toman: r.price_toman,
    usdt: r.usdt_price_toman
      ? r.price_toman / r.usdt_price_toman
      : null,
    gold: r.gold_18k_price_toman
      ? r.price_toman / r.gold_18k_price_toman
      : null,
  };
}
export function aggregate(records: PriceRecord[], mode: Aggregation): Point[] {
  const points = [...records]
    .sort((a, b) => a.record_date.localeCompare(b.record_date))
    .map(convert);
  if (mode === "daily") return points;
  const groups = new Map<string, Point[]>();
  for (const p of points) {
    const key = jalali(p.date, mode === "monthly" ? "yyyy/MM" : "yyyy");
    groups.set(key, [...(groups.get(key) || []), p]);
  }
  return [...groups].map(([label, ps]) => {
    const avg = (key: "toman" | "usdt" | "gold") => {
      const v = ps.map((p) => p[key]).filter((n): n is number => n !== null);
      return v.length ? v.reduce((a, b) => a + b / v.length, 0) : null;
    };
    return {
      date: ps[ps.length - 1].date,
      label,
      toman: avg("toman")!,
      usdt: avg("usdt"),
      gold: avg("gold"),
    };
  });
}
export function latestChange(points: Point[], key: "toman" | "usdt" | "gold") {
  const valid = points
    .map((p) => p[key])
    .filter((v): v is number => v !== null);
  const latest = valid.at(-1) ?? null;
  const prev = valid.at(-2);
  return {
    latest,
    change:
      latest !== null && prev !== undefined ? (latest / prev - 1) * 100 : null,
  };
}
export function pageNumber(value: unknown) {
  return typeof value === "string" &&
    /^[1-9]\d*$/.test(value) &&
    Number.isSafeInteger(Number(value))
    ? Number(value)
    : 1;
}
