
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
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems: NavItemProps[] = [
    { id: 1, name: 'Dashboard', path: '/dashboard', icon: <HomeIcon className="h-6 w-6" /> },
    { id: 2, name: 'Shops', path: '/shops', icon: <StoreIcon className="h-6 w-6" /> },
    { id: 3, name: 'Products', path: '/products', icon: <PackageIcon className="h-6 w-6" /> },
    { id: 4, name: 'Stock', path: '/stocks', icon: <Layers className="h-6 w-6" /> },
    { id: 5, name: 'Credits', path: '/credits', icon: <Receipt className="h-6 w-6" /> },
    { id: 6, name: 'Expenses', path: '/expenses', icon: <ReceiptIndianRupee className="h-6 w-6" /> },
    { id: 7, name: 'Users', path: '/users', icon: <UsersIcon className="h-6 w-6" /> },
    { id: 8, name: 'Settings', path: '/settings', icon: <SettingsIcon className="h-6 w-6" /> },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      {/* Mobile Menu */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="md:hidden absolute top-4 left-4 text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-full p-2 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </Button>
        </SheetTrigger>
        <SheetContent className="sm:max-w-xs pt-6 bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-blue-950">
          <SheetHeader>
            <SheetTitle className="text-primary">Menu</SheetTitle>
            <SheetDescription>
              Navigate through your dashboard.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col space-y-2 mt-4">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-all duration-200 ${location.pathname === item.path ? 'bg-primary/15 dark:bg-primary/25 font-medium text-primary' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
            <Button variant="ghost" className="justify-start mt-4 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={handleLogout}>
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sidebar (Hidden on small screens) */}
      <div className="hidden md:flex flex-col w-64 bg-gradient-to-b from-white to-blue-50 dark:from-gray-800 dark:to-blue-950 border-r border-blue-200 dark:border-blue-800 shadow-xl">
        <div className="flex items-center justify-between h-16 px-4 border-b border-blue-200 dark:border-blue-800">
          <Link to="/dashboard" className="flex items-center">
            <img 
              src="/lovable-uploads/13b8d922-e2b4-4692-a8dd-472a7be60eef.png" 
              alt="Logo" 
              className="h-8 w-auto"
            />
          </Link>
          <ModeToggle />
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-all duration-200 ${location.pathname === item.path ? 'bg-primary/15 dark:bg-primary/25 font-medium text-primary shadow-sm' : ''}`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-200 dark:border-blue-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex h-auto w-full items-center justify-start gap-3 rounded-lg p-3 text-sm font-normal hover:bg-primary/10">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarImage src={user?.user_metadata?.avatar_url as string} alt={user?.user_metadata?.full_name as string} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {(user?.user_metadata?.full_name as string)?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-800 dark:text-white">{user?.user_metadata?.full_name || 'User'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800">
              <DropdownMenuLabel className="text-primary">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
