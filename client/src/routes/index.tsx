import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import HomePage from '@/pages/Home'
import ProductsPage from '@/pages/Products'
import ProductDetailsPage from '@/pages/Products/ProductDetails'
import FavoritesPage from '@/pages/Favorites'
import CartPage from '@/pages/Cart'
import DashboardPage from '@/pages/Dashboard'
import CheckoutPage from '@/pages/Checkout'
import ContactPage from '@/pages/Contact'
import LoginPage from '@/pages/Login'
import RegisterPage from '@/pages/Register'
import OrdersPage from '@/pages/Orders'
import OrderDetailsPage from '@/pages/Orders/OrderDetails'
import WarehousePage from '@/pages/Warehouse'
import BranchesPage from '@/pages/Branches'
import TransfersPage from '@/pages/Transfers'
import NotFoundPage from '@/pages/NotFound'
import { routes } from '@/constants/routes'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: routes.products.slice(1), element: <ProductsPage /> },
      { path: routes.productDetails.slice(1), element: <ProductDetailsPage /> },
      { path: routes.favorites.slice(1), element: <FavoritesPage /> },
      { path: routes.cart.slice(1), element: <CartPage /> },
      { path: routes.dashboard.slice(1), element: <DashboardPage /> },
      { path: routes.checkout.slice(1), element: <CheckoutPage /> },
      { path: routes.checkOrder.slice(1), element: <CheckoutPage /> },
      { path: routes.contact.slice(1), element: <ContactPage /> },
      { path: routes.orders.slice(1), element: <OrdersPage /> },
      { path: routes.orderDetails.slice(1), element: <OrderDetailsPage /> },
      { path: routes.warehouse.slice(1), element: <WarehousePage /> },
      { path: routes.branches.slice(1), element: <BranchesPage /> },
      { path: routes.branchDetails.slice(1), element: <BranchesPage /> },
      { path: routes.transfers.slice(1), element: <TransfersPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: routes.login.slice(1), element: <LoginPage /> },
      { path: routes.register.slice(1), element: <RegisterPage /> },
    ],
  },
])
