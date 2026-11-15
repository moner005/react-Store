export const storeName = 'ROLX'

export function storefrontText(text: string): string {
  return text.replace(/\bRolex\b/gi, storeName)
}
