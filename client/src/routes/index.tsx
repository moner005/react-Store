import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import HomePage from '@/pages/Home'
import ProductsPage from '@/pages/Products'
import ProductDetailsPage from '@/pages/Products/ProductDetails'
import FavoritesPage from '@/pages/Favorites'
import CartPage from '@/pages/Cart'
import CheckoutPage from '@/pages/Checkout'
import OrdersPage from '@/pages/Orders'
import OrderDetailsPage from '@/pages/Orders/OrderDetails'
import WarehousePage from '@/pages/Warehouse'
import BranchesPage from '@/pages/Branches'
import TransfersPage from '@/pages/Transfers'
import NotFoundPage from '@/pages/NotFound'

export const router = createBrowserRouter([{
  path: '/', element: <MainLayout />, children: [
    { index: true, element: <HomePage /> },
    { path: 'products', element: <ProductsPage /> }, { path: 'products/:id', element: <ProductDetailsPage /> },
    { path: 'favorites', element: <FavoritesPage /> }, { path: 'cart', element: <CartPage /> }, { path: 'checkout', element: <CheckoutPage /> },
    { path: 'orders', element: <OrdersPage /> }, { path: 'orders/:id', element: <OrderDetailsPage /> },
    { path: 'management/warehouse', element: <WarehousePage /> }, { path: 'management/branches', element: <BranchesPage /> }, { path: 'management/branches/:branchId', element: <BranchesPage /> },
    { path: 'management/transfers', element: <TransfersPage /> }, { path: '*', element: <NotFoundPage /> },
  ],
}])
