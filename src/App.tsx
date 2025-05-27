
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { DataSyncProvider } from "@/context/DataSyncContext";
import { SettingsProvider } from "@/context/SettingsContext";
import PrivateRoute from "@/components/PrivateRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Shops from "./pages/Shops";
import Stocks from "./pages/Stocks";
import StockMovements from "./pages/StockMovements";
import POS from "./pages/POS";
import Customers from "./pages/Customers";
import Bills from "./pages/Bills";
import Credits from "./pages/Credits";
import Expenses from "./pages/Expenses";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DataSyncProvider>
          <SettingsProvider>
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
              <TooltipProvider>
                <Toaster />
                <BrowserRouter>
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
                      path="/stock-movements"
                      element={
                        <PrivateRoute>
                          <StockMovements />
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
                      path="/expenses"
                      element={
                        <PrivateRoute>
                          <Expenses />
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
                    <Route path="/404" element={<NotFound />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </ThemeProvider>
          </SettingsProvider>
        </DataSyncProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
