
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { Store, Package, Layers, CreditCard, Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "U";
    const parts = user.email.split('@')[0].split('.');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const navigationItems = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="mr-2 h-5 w-5" /> },
    { path: "/shops", label: "Shops", icon: <Store className="mr-2 h-5 w-5" /> },
    { path: "/products", label: "Products", icon: <Package className="mr-2 h-5 w-5" /> },
    { path: "/stocks", label: "Stocks", icon: <Layers className="mr-2 h-5 w-5" /> },
    { path: "/credits", label: "Credits", icon: <CreditCard className="mr-2 h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Business Metrics</h2>
                    <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <nav className="flex-grow">
                    <ul className="p-4 space-y-2">
                      {navigationItems.map((item) => (
                        <li key={item.path}>
                          <Link 
                            to={item.path} 
                            onClick={() => setOpen(false)}
                          >
                            <Button 
                              variant={isActive(item.path) ? "default" : "ghost"}
                              className="w-full justify-start"
                            >
                              {item.icon}
                              {item.label}
                            </Button>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate max-w-[180px]">{user?.email}</span>
                      <Button variant="outline" size="sm" onClick={signOut}>
                        <LogOut className="h-4 w-4 mr-1" />
                        Exit
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-bold">Business Metrics</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden md:inline-block">{user?.email}</span>
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" onClick={signOut} className="hidden md:flex">
                <LogOut className="h-4 w-4 mr-1" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-grow flex">
        <nav className="w-64 border-r border-gray-200 bg-white hidden md:block shadow-sm">
          <div className="p-4 space-y-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-3 mb-2">Main</p>
              {navigationItems.slice(0, 1).map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button 
                    variant={isActive(item.path) ? "default" : "ghost"} 
                    className="w-full justify-start"
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-3 mb-2">Management</p>
              {navigationItems.slice(1).map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button 
                    variant={isActive(item.path) ? "default" : "ghost"} 
                    className="w-full justify-start"
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
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
