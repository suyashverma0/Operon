export function parseRelativeDate(relativeStr: string, referenceDate: Date = new Date()): Date {
  const normalized = relativeStr.toLowerCase().trim();
  const target = new Date(referenceDate);

  if (normalized === 'aaj' || normalized === 'today') {
    return target;
  }
  if (normalized === 'kal' || normalized === 'yesterday' || normalized === 'beeta kal') {
    target.setDate(target.getDate() - 1);
    return target;
  }
  if (normalized === 'parso' || normalized === 'day before yesterday') {
    target.setDate(target.getDate() - 2);
    return target;
  }
  if (normalized === 'pichle hafte' || normalized === 'last week') {
    target.setDate(target.getDate() - 7);
    return target;
  }
  if (normalized === 'last month' || normalized === 'pichle mahine') {
    target.setMonth(target.getMonth() - 1);
    return target;
  }

  return target;
}

export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}
