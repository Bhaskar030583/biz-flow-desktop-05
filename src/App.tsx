
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { DataSyncProvider } from "@/context/DataSyncContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Stocks from "./pages/Stocks";
import POS from "./pages/POS";
import Customers from "./pages/Customers";
import Bills from "./pages/Bills";
import Expenses from "./pages/Expenses";
import Credits from "./pages/Credits";
import AutoDebit from "./pages/AutoDebit";
import Shops from "./pages/Shops";
import StockMovements from "./pages/StockMovements";
import HRMS from "./pages/HRMS";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SettingsProvider>
              <DataSyncProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
                  <Route path="/stocks" element={<PrivateRoute><Stocks /></PrivateRoute>} />
                  <Route path="/pos" element={<PrivateRoute><POS /></PrivateRoute>} />
                  <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
                  <Route path="/bills" element={<PrivateRoute><Bills /></PrivateRoute>} />
                  <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
                  <Route path="/credits" element={<PrivateRoute><Credits /></PrivateRoute>} />
                  <Route path="/auto-debit" element={<PrivateRoute><AutoDebit /></PrivateRoute>} />
                  <Route path="/shops" element={<PrivateRoute><Shops /></PrivateRoute>} />
                  <Route path="/stock-movements" element={<PrivateRoute><StockMovements /></PrivateRoute>} />
                  <Route path="/hrms" element={<PrivateRoute><HRMS /></PrivateRoute>} />
                  <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
                  <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </DataSyncProvider>
            </SettingsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
