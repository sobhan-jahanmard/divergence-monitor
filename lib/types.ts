export type PriceRecord = {
  id: string;
  item_id: string;
  record_date: string;
  price_toman: number;
  usdt_price_toman: number | null;
  gold_18k_price_toman: number | null;
  recorded_by: string;
  created_at: string;
};
export type PriceItem = { id: string; name: string };
export type Aggregation = "daily" | "monthly" | "yearly";
