
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { Store, Package, Layers, CreditCard } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Business Metrics Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
          </div>
        </div>
      </header>
      <div className="flex-grow flex">
        <nav className="w-64 border-r border-gray-200 bg-white">
          <div className="p-4">
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard">
                  <Button 
                    variant={isActive("/dashboard") ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    Dashboard
                  </Button>
                </Link>
              </li>
              <li>
                <Link to="/shops">
                  <Button 
                    variant={isActive("/shops") ? "default" : "ghost"} 
                    className="w-full justify-start"
                  >
                    <Store className="mr-2 h-4 w-4" />
                    Shops
                  </Button>
                </Link>
              </li>
              <li>
                <Link to="/products">
                  <Button 
                    variant={isActive("/products") ? "default" : "ghost"} 
                    className="w-full justify-start"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Products
                  </Button>
                </Link>
              </li>
              <li>
                <Link to="/stocks">
                  <Button 
                    variant={isActive("/stocks") ? "default" : "ghost"} 
                    className="w-full justify-start"
                  >
                    <Layers className="mr-2 h-4 w-4" />
                    Stocks
                  </Button>
                </Link>
              </li>
              <li>
                <Link to="/credits">
                  <Button 
                    variant={isActive("/credits") ? "default" : "ghost"} 
                    className="w-full justify-start"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Credits
                  </Button>
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        <main className="flex-grow bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
