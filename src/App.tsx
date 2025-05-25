
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import PrivateRoute from "@/components/PrivateRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Shops from "./pages/Shops";
import Stocks from "./pages/Stocks";
import Credits from "./pages/Credits";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Expenses from "./pages/Expenses";
import POS from "./pages/POS";
import Customers from "./pages/Customers";
import Bills from "./pages/Bills";
import NotFound from "./pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SettingsProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <AuthProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/products"
                    element={
                      <PrivateRoute>
                        <Products />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/shops"
                    element={
                      <PrivateRoute>
                        <Shops />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/stocks"
                    element={
                      <PrivateRoute>
                        <Stocks />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/pos"
                    element={
                      <PrivateRoute>
                        <POS />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/customers"
                    element={
                      <PrivateRoute>
                        <Customers />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/bills"
                    element={
                      <PrivateRoute>
                        <Bills />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/credits"
                    element={
                      <PrivateRoute>
                        <Credits />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <PrivateRoute>
                        <Users />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <PrivateRoute>
                        <Settings />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/expenses"
                    element={
                      <PrivateRoute>
                        <Expenses />
                      </PrivateRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </SettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
