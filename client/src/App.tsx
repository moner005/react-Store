import { Toaster } from "react-hot-toast";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import CartPage from "@/pages/Cart";
import DashboardPage from "@/pages/Dashboard";
import { routes } from "@/constants/routes";

import Products from "./pages/Products";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home/index.tsx";
import ProductDetails from "./pages/Products/ProductDetails";
import { ThemeProvider } from "./context/ThemeContext";
import Branches from "./pages/Branches";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Header />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 2500,
            style: {
              background: "#0B3D2E",
              color: "#FFFFFF",
              border: "1px solid #C5A46D",
            },
          }}
        />
        <Routes>
          <Route path={routes.home} element={<Home />} />
          <Route path={routes.products} element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetails />} />
          <Route path={routes.cart} element={<CartPage />} />
          <Route path={routes.dashboard} element={<DashboardPage />} />
          <Route path={routes.branches} element={<Branches />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
