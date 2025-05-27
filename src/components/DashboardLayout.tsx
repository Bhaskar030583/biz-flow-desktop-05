
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  Receipt,
  CreditCard,
  DollarSign,
  Store,
  Settings,
  Menu,
  X,
  ArrowRightLeft,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "@/components/ModeToggle";
import { useAuth } from "@/context/AuthContext";

const sidebarItems = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Products", href: "/products", icon: Package },
  { name: "Stocks", href: "/stocks", icon: Warehouse },
  { name: "POS", href: "/pos", icon: ShoppingCart },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Bills", href: "/bills", icon: Receipt },
  { name: "Expenses", href: "/expenses", icon: CreditCard },
  { name: "Credits", href: "/credits", icon: DollarSign },
  { name: "Shops", href: "/shops", icon: Store },
  { name: "Stock Movements", href: "/stock-movements", icon: ArrowRightLeft },
  { name: "HRMS", href: "/hrms", icon: Building2 },
  { name: "Users", href: "/users", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Business Management</h2>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <p className="font-medium">{user?.email}</p>
            <p className="text-muted-foreground">Admin</p>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow bg-card border-r">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-col flex-1 md:ml-64">
        <header className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <h1 className="text-xl font-semibold">
              {sidebarItems.find(item => location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href)))?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
