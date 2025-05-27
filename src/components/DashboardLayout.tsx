
import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Home,
  Package,
  Store,
  BarChart3,
  CreditCard,
  Users,
  Settings,
  LogOut,
  Receipt,
  Calculator,
  Menu,
  UserCheck,
  ArrowRightLeft,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Package, label: "Products", path: "/products" },
    { icon: Store, label: "Stores", path: "/shops" },
    { icon: BarChart3, label: "Stocks", path: "/stocks" },
    { icon: ArrowRightLeft, label: "Stock Movements", path: "/stock-movements" },
    { icon: Calculator, label: "POS", path: "/pos" },
    { icon: UserCheck, label: "Customers", path: "/customers" },
    { icon: Receipt, label: "Bills", path: "/bills" },
    { icon: CreditCard, label: "Credits", path: "/credits" },
    { icon: Receipt, label: "Expenses", path: "/expenses" },
    { icon: Users, label: "Users", path: "/users" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Sidebar 
          variant="sidebar" 
          collapsible="icon"
          className="border-r border-blue-200 dark:border-gray-700"
        >
          <SidebarHeader className="border-b border-blue-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/c1c145c9-7010-4fbf-9b2d-d46663dadb23.png" 
                alt="ABC Cafe Logo" 
                className="h-8 w-8 rounded-lg shadow-md flex-shrink-0"
              />
              {!isCollapsed && (
                <div>
                  <h2 className="font-semibold text-blue-900 dark:text-blue-100">ABC Business</h2>
                  <p className="text-xs text-blue-600 dark:text-blue-300 capitalize">
                    {userRole}
                  </p>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-blue-700 dark:text-blue-300">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.path)}
                        isActive={location.pathname === item.path}
                        className="w-full justify-start hover:bg-blue-100 dark:hover:bg-blue-900 data-[state=active]:bg-blue-200 dark:data-[state=active]:bg-blue-800 data-[state=active]:text-blue-900 dark:data-[state=active]:text-blue-100"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-blue-200 dark:border-gray-700 p-4">
            <div className="space-y-2">
              {!isCollapsed && (
                <div className="text-xs text-blue-600 dark:text-blue-300">
                  {user?.email}
                </div>
              )}
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                size="sm"
              >
                <LogOut className="h-4 w-4" />
                {!isCollapsed && <span>Sign Out</span>}
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white dark:bg-gray-800 border-b border-blue-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger 
                className="text-blue-600 dark:text-blue-400"
                onClick={() => setIsCollapsed(!isCollapsed)}
              />
              {isMobile && (
                <h1 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  ABC Business
                </h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <ModeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
