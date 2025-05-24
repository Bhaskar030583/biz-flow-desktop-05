
import React, { useState } from 'react';
import {
  HomeIcon,
  StoreIcon,
  PackageIcon,
  UsersIcon,
  Layers,
  Receipt,
  ReceiptIndianRupee,
  SettingsIcon,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/ModeToggle";
import { Badge } from "@/components/ui/badge";

interface NavItemProps {
  id: number;
  name: string;
  path: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems: NavItemProps[] = [
    { id: 1, name: 'Dashboard', path: '/dashboard', icon: <HomeIcon className="h-5 w-5" /> },
    { id: 2, name: 'Shops', path: '/shops', icon: <StoreIcon className="h-5 w-5" /> },
    { id: 3, name: 'Products', path: '/products', icon: <PackageIcon className="h-5 w-5" /> },
    { id: 4, name: 'Stock', path: '/stocks', icon: <Layers className="h-5 w-5" /> },
    { id: 5, name: 'Credits', path: '/credits', icon: <Receipt className="h-5 w-5" /> },
    { id: 6, name: 'Expenses', path: '/expenses', icon: <ReceiptIndianRupee className="h-5 w-5" /> },
    { id: 7, name: 'Users', path: '/users', icon: <UsersIcon className="h-5 w-5" /> },
    { id: 8, name: 'Settings', path: '/settings', icon: <SettingsIcon className="h-5 w-5" /> },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'lead':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'sales':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Mobile Menu */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            className="md:hidden fixed top-4 left-4 z-50 h-12 w-12 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border border-white/20 dark:border-gray-700/30 hover:bg-white dark:hover:bg-gray-800"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="w-72 p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/30"
        >
          <SheetHeader className="p-6 border-b border-gray-100 dark:border-gray-800">
            <SheetTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Navigation
            </SheetTitle>
            <SheetDescription className="text-gray-600 dark:text-gray-400">
              Access all dashboard features
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <nav className="flex-1 p-6 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-all duration-200 group ${
                    location.pathname === item.path 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 text-blue-700 dark:text-blue-300 shadow-sm border-l-4 border-blue-500' 
                      : ''
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="mr-3 transition-transform group-hover:scale-110">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>
            <div className="p-6 border-t border-gray-100 dark:border-gray-800">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" 
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sidebar (Hidden on small screens) */}
      <div className="hidden md:flex flex-col w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/30 shadow-xl">
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100 dark:border-gray-800">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/79288f35-ce3c-472b-b6f1-e02b46930395.png" 
              alt="ABC Cafe Logo" 
              className="h-12 w-auto rounded-lg shadow-sm"
            />
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">BizFlow</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Business Management</p>
            </div>
          </Link>
          <ModeToggle />
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-all duration-200 group ${
                location.pathname === item.path 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 text-blue-700 dark:text-blue-300 shadow-sm border-l-4 border-blue-500 font-medium' 
                  : ''
              }`}
            >
              <span className="mr-3 transition-transform group-hover:scale-110">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
        
        <div className="p-6 border-t border-gray-100 dark:border-gray-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex h-auto w-full items-center justify-start gap-3 rounded-xl p-4 text-sm font-normal hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200">
                <Avatar className="h-12 w-12 ring-2 ring-blue-100 dark:ring-blue-900 shadow-lg">
                  <AvatarImage src={user?.user_metadata?.avatar_url as string} alt={user?.user_metadata?.full_name as string} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {(user?.user_metadata?.full_name as string)?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white truncate">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs font-medium ${getRoleBadgeColor(userRole)}`}
                    >
                      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </Badge>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl">
              <DropdownMenuLabel className="text-blue-700 dark:text-blue-300 font-semibold">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer py-3 px-4 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                <SettingsIcon className="mr-3 h-4 w-4" />
                Settings & Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer py-3 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
                <LogOut className="mr-3 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="min-h-full p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
