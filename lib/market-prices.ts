import "server-only";
import { gregorian } from "./date";

const MARKET_DATA =
  "https://raw.githubusercontent.com/iran-market/iran-market.github.io/main/data";
type MarketSymbol = "GOLD_18K_IRR" | "USDT_IRR" | "USD_IRR_FREE";
export type TetherSource = "nobitex" | "tgju-usdt" | "tgju-usd";

function toman(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const rounded = Math.round(amount);
  return Number.isSafeInteger(rounded) ? rounded : null;
}

function tehranDate(timestamp: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp * 1000));
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function nobitexClose(payload: unknown, date: string) {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as { s?: unknown; t?: unknown; c?: unknown };
  if (data.s !== "ok" || !Array.isArray(data.t) || !Array.isArray(data.c))
    return null;
  const index = data.t.findIndex(
    (time) => typeof time === "number" && tehranDate(time) === date,
  );
  // Nobitex's USDTIRT market prices are quoted in Rial; storage uses Toman.
  return index < 0 ? null : toman(Number(data.c[index]) / 10);
}

export async function fetchUsdt(jalaliDate: string) {
  const date = gregorian(jalaliDate);
  if (!date) throw new Error("تاریخ شمسی معتبر نیست.");
  const day = Date.parse(`${date}T00:00:00Z`) / 1000;
  const url = new URL("https://apiv2.nobitex.ir/market/udf/history");
  url.searchParams.set("symbol", "USDTIRT");
  url.searchParams.set("resolution", "D");
  // Include adjacent candles; Iran's historical UTC offset changed with DST.
  url.searchParams.set("from", String(day - 86400));
  url.searchParams.set("to", String(day + 2 * 86400));
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`نوبیتکس پاسخ ${response.status} داد.`);
  return nobitexClose(await response.json(), date);
}

export function historyClose(
  payload: unknown,
  jalaliDate: string,
  symbol: MarketSymbol,
) {
  if (!payload || typeof payload !== "object") return null;
  const history = payload as {
    meta?: { currency?: unknown; symbol?: unknown };
    data?: unknown;
  };
  if (
    history.meta?.symbol !== symbol ||
    history.meta.currency !== "IRT" ||
    !Array.isArray(history.data)
  )
    return null;
  const row = history.data.find(
    (item) =>
      item &&
      typeof item === "object" &&
      (item as { date_jalali?: unknown }).date_jalali === jalaliDate,
  ) as { close?: unknown } | undefined;
  return row ? toman(row.close) : null;
}

export function goldClose(payload: unknown, jalaliDate: string) {
  return historyClose(payload, jalaliDate, "GOLD_18K_IRR");
}

async function fetchHistory(symbol: MarketSymbol, jalaliDate: string) {
  const response = await fetch(`${MARKET_DATA}/history/${symbol}.json`, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error(`آرشیو ${symbol} پاسخ ${response.status} داد.`);
  return historyClose(await response.json(), jalaliDate, symbol);
}

async function fetchLatest(symbol: MarketSymbol, jalaliDate: string) {
  const latestResponse = await fetch(`${MARKET_DATA}/popular.json`, {
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(10000),
  });
  if (!latestResponse.ok)
    throw new Error(`قیمت فعلی ${symbol} پاسخ ${latestResponse.status} داد.`);
  const latest = (await latestResponse.json()) as { data?: unknown };
  if (!Array.isArray(latest.data)) return null;
  const row = latest.data.find(
    (item) =>
      item &&
      typeof item === "object" &&
      (item as { symbol?: unknown }).symbol === symbol,
  ) as
    | {
        price?: unknown;
        currency?: unknown;
        timestamp_jalali?: unknown;
        stale?: unknown;
      }
    | undefined;
  return row?.currency === "IRT" &&
    row.stale === false &&
    typeof row.timestamp_jalali === "string" &&
    row.timestamp_jalali.startsWith(`${jalaliDate} `)
    ? toman(row.price)
    : null;
}

async function fetchTgju(symbol: MarketSymbol, jalaliDate: string) {
  if (tehranDate(Date.now() / 1000) === gregorian(jalaliDate)) {
    try {
      const latest = await fetchLatest(symbol, jalaliDate);
      if (latest !== null) return latest;
    } catch (error) {
      console.error(`TGJU latest ${symbol} lookup failed:`, error);
    }
  }
  return fetchHistory(symbol, jalaliDate);
}

export async function fetchGold(jalaliDate: string) {
  return fetchTgju("GOLD_18K_IRR", jalaliDate);
}

export async function fetchTetherRate(jalaliDate: string): Promise<{
  value: number | null;
  source: TetherSource | null;
}> {
  const errors: unknown[] = [];
  try {
    const value = await fetchUsdt(jalaliDate);
    if (value !== null) return { value, source: "nobitex" };
  } catch (error) {
    errors.push(error);
    console.error("Nobitex price lookup failed:", error);
  }
  for (const [symbol, source] of [
    ["USDT_IRR", "tgju-usdt"],
    ["USD_IRR_FREE", "tgju-usd"],
  ] as const) {
    try {
      const value = await fetchTgju(symbol, jalaliDate);
      if (value !== null) return { value, source };
    } catch (error) {
      errors.push(error);
      console.error(`TGJU ${symbol} lookup failed:`, error);
    }
  }
  if (errors.length === 3)
    throw new AggregateError(errors, "All tether price sources failed.");
  return { value: null, source: null };
}
