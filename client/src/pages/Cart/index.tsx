import { Navigate } from 'react-router-dom'
import { routes } from '@/constants/routes'

export default function CartPage() {
  return <Navigate to={routes.checkOrder} replace />
}
