export const routes = {
  home: '/',
  store: '/store',
  storeBranch: '/store/:branchId',
  products: '/products',
  productDetails: '/products/:slug',
  favorites: '/favorites',
  cart: '/cart',
  dashboard: '/dashboard',
  checkout: '/checkout',
  orderConfirmation: '/checkout/confirmation/:id',
  checkOrder: '/check-order',
  contact: '/contact',
  orders: '/orders',
  orderDetails: '/orders/:id',
  warehouse: '/management/warehouse',
  showrooms: '/branches',
  branches: '/management/branches',
  branchDetails: '/management/branches/:branchId',
  transfers: '/management/transfers',
  admins: '/management/admins',
  login: '/login',
  register: '/register',
} as const

export const storeBranches = { damascus: 'Damascus', latakia: 'Latakia' } as const
export type StoreBranch = keyof typeof storeBranches

export function isStoreBranch(branch: string | null | undefined): branch is StoreBranch {
  return branch === 'damascus' || branch === 'latakia'
}
