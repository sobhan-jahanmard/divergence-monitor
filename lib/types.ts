export type PriceRecord = {
  id: string;
  record_date: string;
  apartment_price_toman: number;
  usd_price_toman: number | null;
  gold_18k_price_toman: number | null;
  created_at: string;
};
export type Aggregation = "daily" | "monthly" | "yearly";
