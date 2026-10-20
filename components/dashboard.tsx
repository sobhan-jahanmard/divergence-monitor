"use client";
import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  ArrowUpLeft,
  ArrowDownLeft,
  ChartNoAxesCombined,
  Coins,
  DollarSign,
  Building2,
} from "lucide-react";
import { aggregate, latestChange, type Point } from "@/lib/metrics";
import { number } from "@/lib/format";
import type { PriceRecord, Aggregation } from "@/lib/types";
const metrics = [
  {
    key: "toman",
    title: "قیمت هر متر مربع به تومان",
    unit: "تومان",
    color: "#216d5b",
    icon: Building2,
  },
  {
    key: "usd",
    title: "قیمت هر متر مربع به دلار",
    unit: "دلار",
    color: "#5375bb",
    icon: DollarSign,
  },
  {
    key: "gold",
    title: "قیمت هر متر مربع به گرم طلا",
    unit: "گرم طلای ۱۸ عیار",
    color: "#b18b41",
    icon: Coins,
  },
] as const;
function Chart({
  points,
  metric,
}: {
  points: Point[];
  metric: (typeof metrics)[number];
}) {
  const { latest, change } = latestChange(points, metric.key);
  const Icon = metric.icon;
  return (
    <section className="chart-card">
      <div className="chart-heading">
        <div className="chart-title">
          <span
            className="metric-icon"
            style={{ color: metric.color, background: metric.color + "12" }}
          >
            <Icon size={20} />
          </span>
          <h2>{metric.title}</h2>
        </div>
        <span className="unit-label">{metric.unit}</span>
      </div>
      <div className="chart-stats">
        <strong>
          {latest === null
            ? "—"
            : number(latest, metric.key === "toman" ? 0 : 2)}
        </strong>
        <span className="stat-unit">{metric.unit}</span>
        {change !== null && (
          <span className={`change ${change >= 0 ? "up" : "down"}`}>
            {change >= 0 ? (
              <ArrowUpLeft size={15} />
            ) : (
              <ArrowDownLeft size={15} />
            )}
            <bdi>{number(Math.abs(change))}٪</bdi>
          </span>
        )}
        <span className="comparison">نسبت به مقدار معتبر قبلی</span>
      </div>
      {latest === null ? (
        <div className="chart-empty">
          <ChartNoAxesCombined size={30} />
          <p>داده‌ای برای نمایش وجود ندارد</p>
          <small>
            برای مشاهده روند، قیمت{" "}
            {metric.key === "usd"
              ? "دلار"
              : metric.key === "gold"
                ? "طلا"
                : "مسکن"}{" "}
            را ثبت کنید.
          </small>
        </div>
      ) : (
        <div className="chart-container" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={points}
              margin={{ top: 16, right: 16, left: 24, bottom: 8 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="#edf0ef"
                strokeDasharray="4 4"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={36}
                tick={{ fill: "#88938f", fontSize: 11 }}
                tickFormatter={(v) => digitsFa(String(v))}
                dy={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={74}
                tick={{ fill: "#88938f", fontSize: 11 }}
                tickFormatter={(v) => number(v, metric.key === "toman" ? 0 : 2)}
                domain={["auto", "auto"]}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  const val = payload?.[0]?.value;
                  return active && val !== null && val !== undefined ? (
                    <div className="chart-tooltip" dir="rtl">
                      <small>{digitsFa(String(label))}</small>
                      <strong>
                        {new Intl.NumberFormat("fa-IR", {
                          maximumSignificantDigits: 17,
                        }).format(Number(val))}{" "}
                        {metric.unit}
                      </strong>
                    </div>
                  ) : null;
                }}
              />
              <Line
                type="linear"
                dataKey={metric.key}
                stroke={metric.color}
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: metric.color,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
                activeDot={{ r: 5 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="chart-footer">
        <span className="legend-dot" style={{ background: metric.color }} />
        {metric.key === "toman"
          ? "قیمت ثبت‌شده مسکن"
          : metric.key === "usd"
            ? "قیمت مسکن ÷ قیمت هر دلار"
            : "قیمت مسکن ÷ قیمت هر گرم طلای ۱۸ عیار"}
      </div>
    </section>
  );
}
function digitsFa(s: string) {
  return s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}
export function Dashboard({ records }: { records: PriceRecord[] }) {
  const [mode, setMode] = useState<Aggregation>("monthly");
  const points = aggregate(records, mode);
  return (
    <>
      <div className="dashboard-toolbar">
        <div>
          <h2>روند تاریخی قیمت‌ها</h2>
          <p>
            {number(records.length, 0)} رکورد ثبت‌شده <span>·</span>{" "}
            {mode === "daily"
              ? "مقادیر روزانه"
              : "میانگین " + (mode === "monthly" ? "ماهانه" : "سالانه")}
          </p>
        </div>
        <div className="segmented" aria-label="بازه تجمیع">
          {(
            [
              { key: "daily", label: "روزانه" },
              { key: "monthly", label: "ماهانه" },
              { key: "yearly", label: "سالانه" },
            ] as const
          ).map((item) => (
            <button
              aria-pressed={mode === item.key}
              onClick={() => setMode(item.key)}
              key={item.key}
              className={mode === item.key ? "selected" : ""}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="charts">
        {metrics.map((metric) => (
          <Chart key={metric.key} points={points} metric={metric} />
        ))}
      </div>
      <p className="footnote">
        همه مبالغ این سامانه به تومان ثبت می‌شوند. میانگین‌ها بر اساس تقویم شمسی
        و فقط از مقادیر موجود محاسبه می‌شوند.
      </p>
    </>
  );
}
