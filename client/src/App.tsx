import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/services/queryClient'
// import { router } from '@/routes'




import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Home from '@/pages/Home/index.tsx'
function App() {
  return (
    <>
  
      <Header />
      <Home />
      <Footer />
    </>
  );
}

export default App;