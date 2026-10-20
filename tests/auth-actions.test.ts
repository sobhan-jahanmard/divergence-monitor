import { it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  database: vi.fn(),
  requireAccess: vi
    .fn()
    .mockRejectedValue(new Error("برای دسترسی، ابتدا رمز ورود را وارد کنید.")),
}));
vi.mock("@/lib/auth", () => ({ requireAccess: mocks.requireAccess }));
vi.mock("@/lib/supabase/server", () => ({ database: mocks.database }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("server-only", () => ({}));
import { saveRecord, deleteRecord } from "../app/actions";
import type { PriceRecord } from "../lib/types";
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
it("rejects unauthenticated mutations before touching the database", async () => {
  const original: PriceRecord = {
    id: "e3f4935a-245a-4ff1-99f9-609242a7a828",
    record_date: "2026-10-20",
    apartment_price_toman: 100,
    usdt_price_toman: null,
    gold_18k_price_toman: null,
    created_at: "2026-10-20T00:00:00Z",
  };
  const input = { date: "1405/07/28", apartment: "100", usdt: "", gold: "" };
  expect((await saveRecord(input)).ok).toBe(false);
  expect((await saveRecord(input, original)).ok).toBe(false);
  expect((await deleteRecord(original)).ok).toBe(false);
  expect(mocks.requireAccess).toHaveBeenCalledTimes(3);
  expect(mocks.database).not.toHaveBeenCalled();
});
