export function formatUsd(minor: number): string {
  if (!Number.isSafeInteger(minor) || minor < 0) return 'Price unavailable'
  const cents = BigInt(minor)
  const dollars = cents / 100n
  const remainder = (cents % 100n).toString().padStart(2, '0')
  const formattedDollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(dollars)
  return `${formattedDollars}.${remainder}`
}
