"use client";
import { useState } from "react";
import {
  addMonths,
  startOfMonth,
  getDaysInMonth,
  getDay,
  format,
  setDate,
} from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { digits, gregorian, localDate, tehranToday, today } from "@/lib/date";
import { number } from "@/lib/format";
import { Button, Input } from "./ui";
export function JalaliPicker({
  value,
  onChange,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const selected = gregorian(value);
    const current = tehranToday();
    return startOfMonth(localDate(selected && selected <= current ? selected : current));
  });
  const currentDay = today();
  const currentMonth = currentDay.slice(0, 7);
  const first = (getDay(month) + 1) % 7;
  return (
    <div>
      <div className="date-field">
        <Input
          aria-label="تاریخ شمسی"
          aria-invalid={invalid}
          dir="ltr"
          placeholder="۱۴۰۵/۰۷/۲۸"
          value={value}
          onChange={(e) => onChange(digits(e.target.value))}
        />
        <Button
          type="button"
          variant="ghost"
          aria-label="انتخاب تاریخ"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <CalendarDays size={19} />
        </Button>
      </div>
      {open && (
        <div className="calendar">
          <div className="calendar-nav">
            <Button
              type="button"
              variant="ghost"
              aria-label="ماه قبل"
              onClick={() => setMonth(addMonths(month, -1))}
            >
              <ChevronRight size={16} />
            </Button>
            <strong>
              {format(month, "MMMM yyyy", { locale: faIR }).replace(
                /\d/g,
                (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)],
              )}
            </strong>
            <Button
              type="button"
              variant="ghost"
              aria-label="ماه بعد"
              disabled={format(month, "yyyy/MM") >= currentMonth}
              onClick={() => setMonth(addMonths(month, 1))}
            >
              <ChevronLeft size={16} />
            </Button>
          </div>
          <div className="calendar-grid">
            {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((d, i) => (
              <small key={i}>{d}</small>
            ))}
            {Array.from({ length: first }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: getDaysInMonth(month) }, (_, i) => {
              const date = format(setDate(month, i + 1), "yyyy/MM/dd");
              return (
                <button
                  type="button"
                  className={date === value ? "selected" : ""}
                  key={i}
                  disabled={date > currentDay}
                  onClick={() => {
                    onChange(date);
                    setOpen(false);
                  }}
                >
                  {number(i + 1, 0)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
