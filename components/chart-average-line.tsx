"use client";

export function ChartAverageLine({
  x1,
  x2,
  y1,
  label,
  color,
  onActiveChange,
}: {
  x1?: number | string;
  x2?: number | string;
  y1?: number | string;
  label: string;
  color: string;
  onActiveChange: (y: number | null) => void;
}) {
  const left = Math.min(Number(x1), Number(x2));
  const right = Math.max(Number(x1), Number(x2));
  const y = Number(y1);
  if (![left, right, y].every(Number.isFinite)) return <g />;
  return (
    <g
      className="chart-average-line"
      role="img"
      aria-label={`میانگین ماه‌ها: ${label}`}
      tabIndex={0}
      onMouseEnter={() => onActiveChange(y)}
      onMouseLeave={() => onActiveChange(null)}
      onFocus={() => onActiveChange(y)}
      onBlur={() => onActiveChange(null)}
      onClick={(event) => event.currentTarget.focus()}
    >
      <rect
        x={left}
        y={y - 8}
        width={right - left}
        height={16}
        fill="transparent"
      />
      <line
        x1={left}
        x2={right}
        y1={y}
        y2={y}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="6 5"
        pointerEvents="none"
      />
    </g>
  );
}
