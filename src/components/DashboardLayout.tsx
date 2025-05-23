
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { Store, Package, Layers, CreditCard, Menu, X, LayoutDashboard, LogOut, Users } from "lucide-react";
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
  const { signOut, user, userRole } = useAuth();
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
    { path: "/shops", label: "Shops", icon: <Store className="mr-2 h-5 w-5" />, roles: ["admin"] },
    { path: "/products", label: "Products", icon: <Package className="mr-2 h-5 w-5" />, roles: ["admin"] },
    { path: "/stocks", label: "Stocks", icon: <Layers className="mr-2 h-5 w-5" /> },
    { path: "/credits", label: "Credits", icon: <CreditCard className="mr-2 h-5 w-5" />, roles: ["admin"] },
    { path: "/users", label: "Users", icon: <Users className="mr-2 h-5 w-5" />, roles: ["admin"] },
  ];

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-indigo-50/30">
      <header className="bg-gradient-to-r from-indigo-700 to-purple-700 border-b border-indigo-800 shadow-md sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-indigo-800">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 border-r border-indigo-200 bg-white">
                <div className="flex flex-col h-full">
                  <div className="bg-gradient-to-r from-indigo-700 to-purple-700 p-4 border-b border-indigo-800 flex items-center justify-between text-white">
                    <div className="flex items-center space-x-2">
                      <img src="/lovable-uploads/18f41054-18d4-459a-8a20-72e484f71afd.png" alt="ABC CAFE Logo" className="h-8 w-8" />
                      <h2 className="text-lg font-semibold">ABC CAFE</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full hover:bg-indigo-800">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <nav className="flex-grow bg-gradient-to-b from-white to-indigo-50/50">
                    <ul className="p-4 space-y-2">
                      {filteredNavItems.map((item) => (
                        <li key={item.path}>
                          <Link 
                            to={item.path} 
                            onClick={() => setOpen(false)}
                          >
                            <Button 
                              variant={isActive(item.path) ? "default" : "ghost"}
                              className={`w-full justify-start ${isActive(item.path) ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" : "hover:bg-indigo-50 hover:text-indigo-700"}`}
                            >
                              {item.icon}
                              {item.label}
                            </Button>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate max-w-[180px]">{user?.email}</span>
                      <Button variant="outline" size="sm" onClick={signOut} className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200">
                        <LogOut className="h-4 w-4 mr-1" />
                        Exit
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center">
              <img src="/lovable-uploads/18f41054-18d4-459a-8a20-72e484f71afd.png" alt="ABC CAFE Logo" className="h-8 w-8 mr-2" />
              <h1 className="text-xl font-bold text-white">ABC CAFE</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-white/90 hidden md:inline-block">{user?.email}</span>
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8 bg-white text-indigo-700 border-2 border-white">
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" onClick={signOut} className="hidden md:flex text-white border-white/30 hover:bg-indigo-800 hover:text-white hover:border-white/10">
                <LogOut className="h-4 w-4 mr-1" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-grow flex">
        <nav className="w-64 border-r border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white hidden md:block shadow-sm">
          <div className="p-4 space-y-6">
            <div className="flex items-center space-x-2 px-3 py-2">
              <img src="/lovable-uploads/18f41054-18d4-459a-8a20-72e484f71afd.png" alt="ABC CAFE Logo" className="h-8 w-8" />
              <h2 className="text-lg font-semibold text-indigo-900">ABC CAFE</h2>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider pl-3 mb-2">Main</p>
              {filteredNavItems.slice(0, 1).map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button 
                    variant={isActive(item.path) ? "default" : "ghost"} 
                    className={`w-full justify-start ${isActive(item.path) ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" : "hover:bg-indigo-50 hover:text-indigo-700"}`}
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider pl-3 mb-2">Management</p>
              {filteredNavItems.slice(1).map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button 
                    variant={isActive(item.path) ? "default" : "ghost"} 
                    className={`w-full justify-start ${isActive(item.path) ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" : "hover:bg-indigo-50 hover:text-indigo-700"}`}
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </nav>
        <main className="flex-grow bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/20">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
