import React, { useState, useEffect } from "react";
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
import { ThemeSwitcher } from "./ThemeSwitcher";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { signOut, user, userRole } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  
  // Check if user is the protected admin
  useEffect(() => {
    if (user?.email === "gumpubhaskar3000@gmail.com" || userRole === "admin") {
      console.log("Admin user detected in layout");
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user, userRole]);
  
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
    { path: "/shops", label: "Shops", icon: <Store className="mr-2 h-5 w-5" />, roles: ["admin", "lead"] },
    { path: "/products", label: "Products", icon: <Package className="mr-2 h-5 w-5" />, roles: ["admin", "lead"] },
    { path: "/stocks", label: "Stocks", icon: <Layers className="mr-2 h-5 w-5" /> },
    { path: "/credits", label: "Credits", icon: <CreditCard className="mr-2 h-5 w-5" />, roles: ["admin", "lead"] },
    { path: "/users", label: "Users", icon: <Users className="mr-2 h-5 w-5" />, roles: ["admin"] },
  ];

  // Filter navigation items based on user role or special admin
  const filteredNavItems = navigationItems.filter(item => {
    // If the user is the protected admin or has admin role, show all items
    if (isAdmin) return true;
    
    // Otherwise, filter by roles
    return !item.roles || item.roles.includes(userRole);
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950 transition-colors duration-300">
      <header className="bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-900 dark:to-purple-900 border-b border-indigo-800 dark:border-indigo-950 shadow-md sticky top-0 z-30 transition-colors duration-300">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-indigo-800 dark:hover:bg-indigo-950">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 border-r border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-900">
                <div className="flex flex-col h-full">
                  <div className="bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-900 dark:to-purple-900 p-4 border-b border-indigo-800 dark:border-indigo-950 flex items-center justify-between text-white">
                    <div className="flex items-center space-x-2">
                      {/* No logo or name here */}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full hover:bg-indigo-800 dark:hover:bg-indigo-950">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <nav className="flex-grow bg-gradient-to-b from-white to-indigo-50/50 dark:from-gray-900 dark:to-indigo-950/50">
                    <ul className="p-4 space-y-2">
                      {filteredNavItems.map((item) => (
                        <li key={item.path}>
                          <Link 
                            to={item.path} 
                            onClick={() => setOpen(false)}
                          >
                            <Button 
                              variant={isActive(item.path) ? "default" : "ghost"}
                              className={`w-full justify-start ${isActive(item.path) ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-800 dark:to-purple-800" : "hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-300"}`}
                            >
                              {item.icon}
                              {item.label}
                              {isAdmin && item.roles && <span className="ml-auto text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 rounded-full">Admin</span>}
                            </Button>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[180px]">{user?.email}</span>
                        {isAdmin && <span className="text-xs font-medium text-red-600 dark:text-red-400">Admin Access</span>}
                      </div>
                      <Button variant="outline" size="sm" onClick={signOut} className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 dark:border-red-800">
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
            <ThemeSwitcher />
            <div className="text-xs md:text-sm text-white/90">
              <span className="hidden md:inline-block">{user?.email}</span>
              {isAdmin && <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 rounded-full text-xs">Admin</span>}
            </div>
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8 bg-white text-indigo-700 border-2 border-white dark:bg-gray-800 dark:text-indigo-300 dark:border-gray-700">
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" onClick={signOut} className="hidden md:flex text-white border-white/30 hover:bg-indigo-800 hover:text-white hover:border-white/10 dark:hover:bg-indigo-950">
                <LogOut className="h-4 w-4 mr-1" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-grow flex">
        <nav className="w-64 border-r border-indigo-100 dark:border-indigo-800 bg-gradient-to-b from-indigo-50/50 to-white dark:from-gray-900 dark:to-gray-900 hidden md:block shadow-sm transition-colors duration-300">
          <div className="p-4 space-y-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider pl-3 mb-2">Main</p>
              {filteredNavItems.slice(0, 1).map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button 
                    variant={isActive(item.path) ? "default" : "ghost"} 
                    className={`w-full justify-start ${isActive(item.path) ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-800 dark:to-purple-800" : "hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-300"}`}
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider pl-3 mb-2">Management</p>
              {filteredNavItems.slice(1).map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button 
                    variant={isActive(item.path) ? "default" : "ghost"} 
                    className={`w-full justify-start ${isActive(item.path) ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-800 dark:to-purple-800" : "hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-300"}`}
                  >
                    {item.icon}
                    {item.label}
                    {isAdmin && item.roles && <span className="ml-auto text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 rounded-full">Admin</span>}
                  </Button>
                </Link>
              ))}
            </div>
            
            {isAdmin && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-900">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Admin Access</p>
                <p className="text-xs text-amber-600 dark:text-amber-500">You have full access to all sections</p>
              </div>
            )}
          </div>
        </nav>
        <main className="flex-grow bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-purple-950/20 transition-colors duration-300 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
