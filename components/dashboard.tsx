"use client";
import { useId, useRef, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  ArrowUpLeft,
  ArrowDownLeft,
  ChartNoAxesCombined,
  Coins,
  CircleDollarSign,
  Building2,
} from "lucide-react";
import {
  aggregate,
  averagePrice,
  latestChange,
  type Point,
} from "@/lib/metrics";
import { number } from "@/lib/format";
import type { PriceItem, PriceRecord, Aggregation } from "@/lib/types";
import { PointDetailsDialog } from "./point-details-dialog";
import { ChartAverageLine } from "./chart-average-line";
const metrics = [
  {
    key: "toman",
    title: "قیمت به تومان",
    unit: "تومان",
    color: "#216d5b",
    icon: Building2,
  },
  {
    key: "usdt",
    title: "قیمت به تتر",
    unit: "تتر",
    color: "#5375bb",
    icon: CircleDollarSign,
  },
  {
    key: "gold",
    title: "قیمت به گرم طلا",
    unit: "گرم طلای ۱۸ عیار",
    color: "#b18b41",
    icon: Coins,
  },
] as const;
function Chart({
  points,
  metric,
  average,
  onSelectPoint,
}: {
  points: Point[];
  metric: (typeof metrics)[number];
  average: number | null;
  onSelectPoint: (point: Point, trigger: SVGGElement) => void;
}) {
  const { latest, change } = latestChange(points, metric.key);
  const Icon = metric.icon;
  const chartId = useId();
  const [averageY, setAverageY] = useState<number | null>(null);
  const averageActive = averageY !== null;
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
        <strong>{latest === null ? "—" : number(latest, 2)}</strong>
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
            {metric.key === "usdt"
              ? "تتر"
              : metric.key === "gold"
                ? "طلا"
                : "مورد انتخاب‌شده"}{" "}
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
                tickFormatter={(v) => number(v, 2)}
                domain={["auto", "auto"]}
              />
              <Tooltip
                cursor={averageActive ? false : undefined}
                content={({ active, payload, label }) => {
                  if (averageActive) return null;
                  const val = payload?.[0]?.value;
                  return active && val !== null && val !== undefined ? (
                    <div className="chart-tooltip" dir="rtl">
                      <small>{digitsFa(String(label))}</small>
                      <strong>
                        {number(Number(val), 2)} {metric.unit}
                      </strong>
                      <small>برای مشاهدهٔ ورودی‌ها روی نقطه کلیک کنید</small>
                    </div>
                  ) : null;
                }}
              />
              {metric.key !== "toman" && average !== null && (
                <ReferenceLine
                  y={average}
                  ifOverflow="extendDomain"
                  shape={
                    <ChartAverageLine
                      label={`${number(average, 2)} ${metric.unit}`}
                      color={metric.color}
                      onActiveChange={setAverageY}
                    />
                  }
                />
              )}
              <Line
                type="linear"
                dataKey={metric.key}
                stroke={metric.color}
                strokeWidth={2.5}
                dot={({ cx, cy, payload, index }) => {
                  const point: Point = payload;
                  if (
                    cx === undefined ||
                    cy === undefined ||
                    point[metric.key] === null
                  )
                    return <g key={index} />;
                  return (
                    <g
                      key={index}
                      id={`${chartId}-point-${index}`}
                      className="chart-point"
                      role="button"
                      tabIndex={0}
                      aria-haspopup="dialog"
                      aria-label={`جزئیات ${digitsFa(point.label)}، ${number(point[metric.key]!, 2)} ${metric.unit}`}
                      onClick={(event) =>
                        onSelectPoint(point, event.currentTarget)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          onSelectPoint(point, event.currentTarget);
                        }
                      }}
                    >
                      <circle cx={cx} cy={cy} r={22} fill="transparent" />
                      <circle
                        className="chart-point-focus"
                        cx={cx}
                        cy={cy}
                        r={9}
                        fill="none"
                        stroke={metric.color}
                        strokeWidth={2}
                      />
                      <circle
                        className="chart-point-marker"
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={metric.color}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    </g>
                  );
                }}
                activeDot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
          {averageY !== null && average !== null && (
            <div
              className="chart-tooltip chart-average-tooltip"
              dir="rtl"
              role="tooltip"
              style={{ top: averageY > 80 ? averageY - 72 : averageY + 10 }}
            >
              <small>میانگین ماه‌ها با وزن برابر</small>
              <strong>
                {number(average, 2)} {metric.unit}
              </strong>
            </div>
          )}
        </div>
      )}
      <div className="chart-footer">
        <span className="legend-dot" style={{ background: metric.color }} />
        {metric.key === "toman"
          ? "قیمت ثبت‌شده مورد انتخاب‌شده"
          : metric.key === "usdt"
            ? "قیمت مورد ÷ قیمت هر تتر"
            : "قیمت مورد ÷ قیمت هر گرم طلای ۱۸ عیار"}
        {metric.key !== "toman" && average !== null && (
          <span className="chart-average-legend">
            <span style={{ borderColor: metric.color }} />
            میانگین ماه‌ها
          </span>
        )}
      </div>
    </section>
  );
}
function digitsFa(s: string) {
  return s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}
export function Dashboard({
  records,
  items,
}: {
  records: PriceRecord[];
  items: PriceItem[];
}) {
  const [mode, setMode] = useState<Aggregation>("daily");
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id ?? "");
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const pointTrigger = useRef<string | null>(null);
  const selectedRecords = records.filter(
    (record) => record.item_id === selectedItemId,
  );
  const points = aggregate(selectedRecords, mode);
  return (
    <>
      <div className="item-selector">
        <label htmlFor="dashboard-item">
          نمودار کدام مورد را می‌خواهید ببینید؟
        </label>
        <select
          id="dashboard-item"
          value={selectedItemId}
          onChange={(event) => setSelectedItemId(event.target.value)}
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="dashboard-toolbar">
        <div>
          <h2>روند تاریخی قیمت‌ها</h2>
          <p>
            {number(selectedRecords.length, 0)} رکورد ثبت‌شده <span>·</span>{" "}
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
      {points.length > 0 && (
        <p className="chart-instructions">
          برای مشاهدهٔ قیمت و نرخ‌های ورودی، روی هر نقطه کلیک کنید.
        </p>
      )}
      <div className="charts">
        {metrics.map((metric) => (
          <Chart
            key={metric.key}
            points={points}
            metric={metric}
            average={
              metric.key === "toman"
                ? null
                : averagePrice(selectedRecords, metric.key)
            }
            onSelectPoint={(point, trigger) => {
              pointTrigger.current = trigger.id;
              setSelectedPoint(point);
            }}
          />
        ))}
      </div>
      <PointDetailsDialog
        point={selectedPoint}
        items={items}
        onClose={() => setSelectedPoint(null)}
        onRestoreFocus={() => {
          if (pointTrigger.current)
            document.getElementById(pointTrigger.current)?.focus();
        }}
      />
      <p className="footnote">
        همه مبالغ این سامانه به تومان ثبت می‌شوند. میانگین‌ها بر اساس تقویم شمسی
        و فقط از مقادیر موجود محاسبه می‌شوند.
      </p>
    </>
  );
}
