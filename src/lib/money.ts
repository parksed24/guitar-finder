export function totalCost(parts: {
  itemPrice: number;
  shipping: number;
  estimatedTax: number;
  estimatedImport: number;
}) {
  return parts.itemPrice + parts.shipping + parts.estimatedTax + parts.estimatedImport;
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}
