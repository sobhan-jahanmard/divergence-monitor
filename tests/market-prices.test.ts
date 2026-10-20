import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  fetchGold,
  fetchTetherRate,
  goldClose,
  historyClose,
  nobitexClose,
} from "../lib/market-prices";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("historical market prices", () => {
  it("selects the Nobitex candle by Tehran date and converts Rial to Toman", () => {
    const date = Date.parse("2026-10-11T20:30:00Z") / 1000;
    expect(
      nobitexClose({ s: "ok", t: [date], c: [2599320] }, "2026-10-12"),
    ).toBe(259932);
    expect(nobitexClose({ s: "ok", t: [date], c: [2599320] }, "2026-10-13")).toBeNull();
    expect(nobitexClose({ s: "no_data" }, "2026-10-12")).toBeNull();
  });

  it("reads only the matching 18K gold close quoted in Toman", () => {
    const payload = {
      meta: { symbol: "GOLD_18K_IRR", currency: "IRT" },
      data: [{ date_jalali: "1405/07/20", close: 25961900 }],
    };
    expect(goldClose(payload, "1405/07/20")).toBe(25961900);
    expect(goldClose(payload, "1405/07/21")).toBeNull();
    expect(
      goldClose({ ...payload, meta: { ...payload.meta, currency: "IRR" } }, "1405/07/20"),
    ).toBeNull();
  });

  it("uses TGJU tether when Nobitex blocks the request", async () => {
    const requests: string[] = [];
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", async (input: URL | string) => {
      const url = String(input);
      requests.push(url);
      if (url.includes("nobitex.ir"))
        return new Response("Access Denied", { status: 403 });
      if (url.endsWith("/USDT_IRR.json"))
        return Response.json({
          meta: { symbol: "USDT_IRR", currency: "IRT" },
          data: [{ date_jalali: "1405/07/20", close: 261000 }],
        });
      throw new Error(`Unexpected request: ${url}`);
    });
    await expect(fetchTetherRate("1405/07/20")).resolves.toEqual({
      value: 261000,
      source: "tgju-usdt",
    });
    expect(requests).toHaveLength(2);
  });

  it("uses TGJU free-market USD only when tether history is absent", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", async (input: URL | string) => {
      const url = String(input);
      if (url.includes("nobitex.ir"))
        return new Response("Access Denied", { status: 403 });
      const symbol = url.endsWith("/USDT_IRR.json")
        ? "USDT_IRR"
        : "USD_IRR_FREE";
      return Response.json({
        meta: { symbol, currency: "IRT" },
        data:
          symbol === "USDT_IRR"
            ? []
            : [{ date_jalali: "1405/07/20", close: 263000 }],
      });
    });
    await expect(fetchTetherRate("1405/07/20")).resolves.toEqual({
      value: 263000,
      source: "tgju-usd",
    });
    expect(
      historyClose(
        {
          meta: { symbol: "USD_IRR_FREE", currency: "IRT" },
          data: [{ date_jalali: "1405/07/20", close: 263000 }],
        },
        "1405/07/21",
        "USD_IRR_FREE",
      ),
    ).toBeNull();
  });

  it("prefers today's fresh gold snapshot over a partial daily candle", async () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-20T12:00:00Z"));
    const requests: string[] = [];
    vi.stubGlobal("fetch", async (input: URL | string) => {
      const url = String(input);
      requests.push(url);
      if (!url.endsWith("/popular.json")) throw new Error("Unexpected history fetch");
      return Response.json({
        data: [
          {
            symbol: "GOLD_18K_IRR",
            currency: "IRT",
            stale: false,
            timestamp_jalali: "1405/07/28 15:30:00",
            price: 26514100,
          },
        ],
      });
    });
    await expect(fetchGold("1405/07/28")).resolves.toBe(26514100);
    expect(requests).toHaveLength(1);
  });
});
