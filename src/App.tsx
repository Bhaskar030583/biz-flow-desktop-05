
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { DataSyncProvider } from "@/context/DataSyncContext";
import { SettingsProvider } from "@/context/SettingsContext";
import PrivateRoute from "@/components/PrivateRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Stocks from "@/pages/Stocks";
import POS from "@/pages/POS";
import Customers from "@/pages/Customers";
import Bills from "@/pages/Bills";
import Expenses from "@/pages/Expenses";
import Credits from "@/pages/Credits";
import Shops from "@/pages/Shops";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import StockMovements from "@/pages/StockMovements";
import HRMS from "@/pages/HRMS";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <DataSyncProvider>
                <SettingsProvider>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    {/* POS route outside of DashboardLayout to avoid sidebar */}
                    <Route 
                      path="/pos" 
                      element={
                        <PrivateRoute>
                          <POS />
                        </PrivateRoute>
                      } 
                    />
                    <Route
                      path="/*"
                      element={
                        <PrivateRoute>
                          <DashboardLayout>
                            <Routes>
                              <Route path="/dashboard" element={<Dashboard />} />
                              <Route path="/products" element={<Products />} />
                              <Route path="/stocks" element={<Stocks />} />
                              <Route path="/customers" element={<Customers />} />
                              <Route path="/bills" element={<Bills />} />
                              <Route path="/expenses" element={<Expenses />} />
                              <Route path="/credits" element={<Credits />} />
                              <Route path="/shops" element={<Shops />} />
                              <Route path="/users" element={<Users />} />
                              <Route path="/settings" element={<Settings />} />
                              <Route path="/stock-movements" element={<StockMovements />} />
                              <Route path="/hrms/*" element={<HRMS />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </DashboardLayout>
                        </PrivateRoute>
                      }
                    />
                  </Routes>
                </SettingsProvider>
              </DataSyncProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
