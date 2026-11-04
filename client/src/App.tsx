// import { QueryClientProvider } from '@tanstack/react-query'
// import { RouterProvider } from 'react-router-dom'
// import { Toaster } from 'react-hot-toast'
// import { queryClient } from '@/services/queryClient'
// import { router } from '@/routes'

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Products from "./pages/Products";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Home from '@/pages/Home/index.tsx';
import ProductDetails from "./pages/Products/ProductDetails";
import { ThemeProvider } from "./context/ThemeContext";
function App() {
  return (
    <>
  <ThemeProvider>
      <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetails />} />
      </Routes>

      <Footer />
    </BrowserRouter>
    </ThemeProvider>
    </>
  );
}

export default App;