export const number = (value: number, decimals = 2) =>
  new Intl.NumberFormat("fa-IR", { maximumFractionDigits: decimals }).format(
    value,
  );
