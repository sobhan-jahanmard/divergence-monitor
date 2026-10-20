import { format, parse, isValid } from "date-fns-jalali";
export function localDate(date: string) {
  return new Date(`${date}T12:00:00`);
}
export function jalali(date: string, pattern = "yyyy/MM/dd") {
  return format(localDate(date), pattern);
}
export function gregorian(value: string) {
  const d = parse(value, "yyyy/MM/dd", new Date());
  if (!isValid(d) || format(d, "yyyy/MM/dd") !== value) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function today() {
  return format(new Date(), "yyyy/MM/dd");
}
export function digits(s: string) {
  return s
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));
}
