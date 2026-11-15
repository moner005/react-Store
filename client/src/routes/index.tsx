import { createBrowserRouter, Navigate } from 'react-router-dom'
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
import { RequireAccount } from './RequireAccount'
import { BranchManagementPage } from '@/pages/Management/BranchManagement'
import { OwnerOverview } from '@/pages/Management/OwnerOverview'
import { AdminAccountsPage } from '@/pages/Management/AdminAccounts'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: routes.store.slice(1), element: <BranchesPage /> },
      { path: routes.storeBranch.slice(1), element: <ProductsPage /> },
      { path: routes.products.slice(1), element: <Navigate to={routes.store} replace /> },
      { path: routes.productDetails.slice(1), element: <ProductDetailsPage /> },
      { path: routes.favorites.slice(1), element: <FavoritesPage /> },
      { path: routes.cart.slice(1), element: <CartPage /> },
      { path: routes.dashboard.slice(1), element: <RequireAccount access="owner"><OwnerOverview /><DashboardPage /></RequireAccount> },
      { path: routes.checkout.slice(1), element: <CheckoutPage /> },
      { path: routes.checkOrder.slice(1), element: <CheckoutPage /> },
      { path: routes.orderConfirmation.slice(1), element: <CheckoutPage /> },
      { path: routes.contact.slice(1), element: <ContactPage /> },
      { path: routes.orders.slice(1), element: <RequireAccount><OrdersPage /></RequireAccount> },
      { path: routes.orderDetails.slice(1), element: <RequireAccount><OrderDetailsPage /></RequireAccount> },
      { path: routes.warehouse.slice(1), element: <RequireAccount access="owner"><WarehousePage /></RequireAccount> },
      { path: routes.showrooms.slice(1), element: <Navigate to={routes.store} replace /> },
      { path: routes.branches.slice(1), element: <RequireAccount access="staff"><BranchManagementPage /></RequireAccount> },
      { path: routes.branchDetails.slice(1), element: <RequireAccount access="staff"><BranchManagementPage /></RequireAccount> },
      { path: routes.transfers.slice(1), element: <RequireAccount access="owner"><TransfersPage /></RequireAccount> },
      { path: routes.admins.slice(1), element: <RequireAccount access="owner"><AdminAccountsPage /></RequireAccount> },
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
