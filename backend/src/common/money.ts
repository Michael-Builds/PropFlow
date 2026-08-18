export function invoiceStatus(balance: number, amountPaid: number, dueDate: Date, now = new Date()): string {
  if (balance <= 0) return 'paid';
  if (dueDate.getTime() < now.getTime()) return 'overdue';
  if (amountPaid > 0) return 'partial';
  return 'due';
}

export function toNumber(value: { toString(): string } | number | string): number {
  return Number(value.toString());
}

export function toPesewas(ghs: number): number {
  return Math.round(ghs * 100);
}

export function fromPesewas(pesewas: number): number {
  return Math.round(pesewas) / 100;
}

export function grossUpForCustomerFees(
  netGhs: number,
  percent: number,
  flatGhs: number,
  capGhs?: number | null,
): { netAmount: number; feeAmount: number; chargedAmount: number; chargedPesewas: number } {
  const netPesewas = toPesewas(netGhs);
  const flatPesewas = toPesewas(flatGhs);
  const rate = percent / 100;
  let chargedPesewas =
    rate >= 1
      ? netPesewas + flatPesewas
      : Math.ceil((netPesewas + flatPesewas) / (1 - rate));
  let feePesewas = chargedPesewas - netPesewas;
  if (capGhs != null && capGhs > 0) {
    const capPesewas = toPesewas(capGhs);
    if (feePesewas > capPesewas) {
      feePesewas = capPesewas;
      chargedPesewas = netPesewas + feePesewas;
    }
  }
  return {
    netAmount: fromPesewas(netPesewas),
    feeAmount: fromPesewas(feePesewas),
    chargedAmount: fromPesewas(chargedPesewas),
    chargedPesewas,
  };
}
