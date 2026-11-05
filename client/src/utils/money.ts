export function dollarsToMinor(price: number): number | null {
  if (!Number.isFinite(price) || price < 0) return null
  const decimal = price.toString()
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(decimal)
  if (!match) return null
  const cents = BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0') || '0')
  return cents <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(cents) : null
}

export function formatUsd(minor: number): string {
  if (!Number.isSafeInteger(minor) || minor < 0) return 'Price unavailable'
  const cents = BigInt(minor)
  const dollars = cents / 100n
  const remainder = (cents % 100n).toString().padStart(2, '0')
  const formattedDollars = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(dollars)
  return `${formattedDollars}.${remainder}`
}
