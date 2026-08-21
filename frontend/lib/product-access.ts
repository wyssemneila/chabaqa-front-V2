export function hasProductAccess(price: unknown, purchase: unknown, isCreator = false): boolean {
  return isCreator || Boolean(purchase) || Number(price || 0) === 0
}
