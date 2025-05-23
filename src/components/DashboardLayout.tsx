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
import { ModeToggle } from './ModeToggle';

interface NavItemProps {
  id: number;
  name: string;
  path: string;
  icon: React.ReactNode;
}

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems: NavItemProps[] = [
    { id: 1, name: 'Dashboard', path: '/dashboard', icon: <HomeIcon className="h-6 w-6" /> },
    { id: 2, name: 'Shops', path: '/shops', icon: <StoreIcon className="h-6 w-6" /> },
    { id: 3, name: 'Products', path: '/products', icon: <PackageIcon className="h-6 w-6" /> },
    { id: 4, name: 'Stock', path: '/stocks', icon: <Layers className="h-6 w-6" /> },
    { id: 5, name: 'Credits', path: '/credits', icon: <Receipt className="h-6 w-6" /> },
    { id: 6, name: 'Expenses', path: '/expenses', icon: <ReceiptIndianRupee className="h-6 w-6" /> },
    { id: 7, name: 'Users', path: '/users', icon: <UsersIcon className="h-6 w-6" /> },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile Menu */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="md:hidden absolute top-4 left-4 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </Button>
        </SheetTrigger>
        <SheetContent className="sm:max-w-xs pt-6">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>
              Navigate through your dashboard.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col space-y-2 mt-4">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md ${location.pathname === item.path ? 'bg-gray-200 dark:bg-gray-700 font-medium' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}
            <Button variant="ghost" className="justify-start" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sidebar (Hidden on small screens) */}
      <div className="hidden md:flex flex-col w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <Link to="/dashboard" className="text-lg font-semibold text-gray-800 dark:text-white">
            My Business
          </Link>
          <ModeToggle />
        </div>
        <nav className="flex-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md ${location.pathname === item.path ? 'bg-gray-200 dark:bg-gray-700 font-medium' : ''}`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex h-8 w-full items-center justify-center gap-2 rounded-md p-0 text-sm font-normal">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url as string} alt={user?.user_metadata?.full_name as string} />
                  <AvatarFallback>{(user?.user_metadata?.full_name as string)?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-left flex-1">
                  <div className="font-semibold text-gray-800 dark:text-white">{user?.user_metadata?.full_name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
                </span>
                <SettingsIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto p-4">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
