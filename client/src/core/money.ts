export const dzd = (amount: number) => new Intl.NumberFormat("en-DZ", { style: "currency", currency: "DZD", maximumFractionDigits: 0 }).format(amount);
