
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Shops from "./pages/Shops";
import Products from "./pages/Products";
import Stocks from "./pages/Stocks";
import Credits from "./pages/Credits";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";
import Expenses from "./pages/Expenses";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/*" element={<Auth />} />
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/shops" element={
                <PrivateRoute>
                  <Shops />
                </PrivateRoute>
              } />
              <Route path="/products" element={
                <PrivateRoute>
                  <Products />
                </PrivateRoute>
              } />
              <Route path="/stocks" element={
                <PrivateRoute>
                  <Stocks />
                </PrivateRoute>
              } />
              <Route path="/credits" element={
                <PrivateRoute>
                  <Credits />
                </PrivateRoute>
              } />
              <Route path="/expenses" element={
                <PrivateRoute>
                  <Expenses />
                </PrivateRoute>
              } />
              <Route path="/users" element={
                <PrivateRoute>
                  <Users />
                </PrivateRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster position="top-right" />
          </QueryClientProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
