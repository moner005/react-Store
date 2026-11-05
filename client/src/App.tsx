import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/context/ThemeContext'
import { queryClient } from '@/services/queryClient'
import { router } from '@/routes'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 2500,
            style: { background: '#0B3D2E', color: '#FFFFFF', border: '1px solid #C5A46D' },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
