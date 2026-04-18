export const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export const formatHours = (hours: number): string =>
  `${hours.toFixed(1).replace(/\.0$/, "")} hrs`;

export const formatPercentage = (value: number): string =>
  `${Math.round(value)}%`;
