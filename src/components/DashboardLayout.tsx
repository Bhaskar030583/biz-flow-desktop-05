
import React from "react";
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
  ArrowRightLeft,
  Building2,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
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

const AppSidebar = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/c1c145c9-7010-4fbf-9b2d-d46663dadb23.png" 
            alt="ABC Cafe Logo" 
            className="h-8 w-8 rounded-lg shadow-md"
          />
          <div>
            <h2 className="text-lg font-semibold">ABC CAFE</h2>
            <p className="text-xs text-muted-foreground">Management System</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu className="p-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link to={item.href} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t">
        <div className="flex flex-col gap-3">
          <div className="text-sm">
            <p className="font-medium truncate">{user?.email}</p>
            <p className="text-muted-foreground text-xs">Admin</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={signOut} 
            title="Sign Out"
            className="w-full justify-center"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2 lg:hidden">
                <img 
                  src="/lovable-uploads/c1c145c9-7010-4fbf-9b2d-d46663dadb23.png" 
                  alt="ABC Cafe Logo" 
                  className="h-6 w-6 rounded"
                />
                <h1 className="text-xl font-semibold">ABC CAFE</h1>
              </div>
            </div>
            <ModeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
