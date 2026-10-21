import { it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  database: vi.fn(),
  requireAccess: vi
    .fn()
    .mockRejectedValue(new Error("برای دسترسی، ابتدا رمز ورود را وارد کنید.")),
}));
vi.mock("@/lib/auth", () => ({ requireAccess: mocks.requireAccess }));
vi.mock("@/lib/supabase/server", () => ({ database: mocks.database }));
vi.mock("@/lib/supabase/price-column", () => ({
  priceColumn: vi.fn().mockResolvedValue("usdt_price_toman"),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("server-only", () => ({}));
import { createItem, saveRecord, deleteRecord } from "../app/actions";
import type { PriceRecord } from "../lib/types";
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
it("rejects unauthenticated mutations before touching the database", async () => {
  const original: PriceRecord = {
    id: "e3f4935a-245a-4ff1-99f9-609242a7a828",
    item_id: "5c38ab35-1d3c-4bbd-a9e6-a333482487e9",
    record_date: "2026-10-20",
    price_toman: 100,
    usdt_price_toman: null,
    gold_18k_price_toman: null,
    recorded_by: "sobhan",
    created_at: "2026-10-20T00:00:00Z",
  };
  const input = {
    itemId: original.item_id,
    date: "1405/07/28",
    price: "100",
    usdt: "",
    gold: "",
  };
  expect((await saveRecord(input)).ok).toBe(false);
  expect((await saveRecord(input, original)).ok).toBe(false);
  expect((await deleteRecord(original)).ok).toBe(false);
  expect((await createItem("ملک مسکونی پیام")).ok).toBe(false);
  expect(mocks.requireAccess).toHaveBeenCalledTimes(4);
  expect(mocks.database).not.toHaveBeenCalled();
});

it.each([
  ["هر متر مربع آپارتمان ۱۰۰ متری پیام", false],
  ["ملک مسکونی پیام", true],
])(
  "creates or selects item %s from the plus action",
  async (itemName, isNew) => {
    mocks.requireAccess.mockResolvedValueOnce(undefined);
    const existingId = "5c38ab35-1d3c-4bbd-a9e6-a333482487e9";
    const newId = "cd2d7d37-3d53-4ddc-87d7-0b7a88ad1015";
    const addItem = vi.fn(() => ({
      select: () => ({
        single: async () => ({
          data: { id: newId, name: itemName },
          error: null,
        }),
      }),
    }));
    mocks.database.mockReturnValue({
      from: () => ({
        select: async () => ({
          data: [
            { id: existingId, name: "هر متر مربع آپارتمان ۱۰۰ متری پیام" },
          ],
          error: null,
        }),
        insert: addItem,
      }),
    });
    const result = await createItem(itemName);
    expect(result).toEqual({
      ok: true,
      item: { id: isNew ? newId : existingId, name: itemName },
      created: isNew,
    });
    expect(addItem).toHaveBeenCalledTimes(isNew ? 1 : 0);
  },
);

it("saves the selected item ID and required recorder", async () => {
  mocks.requireAccess.mockResolvedValueOnce(undefined);
  const itemId = "5c38ab35-1d3c-4bbd-a9e6-a333482487e9";
  const addRecord = vi.fn(() => ({
    select: async () => ({
      data: [{ id: "6e55d740-b699-4c0e-bde6-b2505466be95" }],
      error: null,
    }),
  }));
  mocks.database.mockReturnValue({
    from: () => ({ insert: addRecord }),
  });
  const result = await saveRecord({
    itemId,
    date: "1405/07/28",
    price: "1000000",
    usdt: "100000",
    gold: "10000000",
  });
  expect(result).toEqual({ ok: true });
  expect(addRecord).toHaveBeenCalledWith(
    expect.objectContaining({
      item_id: itemId,
      price_toman: 1000000,
      recorded_by: "sobhan",
    }),
  );
});
