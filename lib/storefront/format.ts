export function formatMoney(amount: number) {
  const formatted = new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `$${formatted}`;
}

export function formatOrderRef(orderId: string) {
  return orderId.slice(-8).toUpperCase();
}
