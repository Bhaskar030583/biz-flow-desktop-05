
import React from 'react';
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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
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
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
        <Sidebar className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/30 shadow-xl">
          <SidebarHeader className="border-b border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <Link to="/dashboard" className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/8b453aae-4e22-4d63-857c-9994a32b7796.png" 
                  alt="ABC Cafe Logo" 
                  className="h-12 w-auto rounded-lg shadow-sm"
                />
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">ABC Cafe</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Business Management</p>
                </div>
              </Link>
              <SidebarTrigger>
                <PanelLeftClose className="h-4 w-4" />
              </SidebarTrigger>
            </div>
            <div>
              <ModeToggle />
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-6">
            <SidebarGroup>
              <SidebarGroupLabel className="text-amber-700 dark:text-amber-300 font-semibold mb-2">Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location.pathname === item.path}
                        className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 dark:hover:bg-amber-950/20 rounded-xl transition-all duration-200 group ${
                          location.pathname === item.path 
                            ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 text-amber-700 dark:text-amber-300 shadow-sm border-l-4 border-amber-500 font-medium' 
                            : ''
                        }`}
                      >
                        <Link to={item.path}>
                          <span className="mr-3 transition-transform group-hover:scale-110">{item.icon}</span>
                          <span className="font-medium">{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="p-6 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-col gap-4">
              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex h-auto w-full items-center justify-start gap-3 rounded-xl p-4 text-sm font-normal hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all duration-200">
                    <Avatar className="h-12 w-12 ring-2 ring-amber-100 dark:ring-amber-900 shadow-lg">
                      <AvatarImage src={user?.user_metadata?.avatar_url as string} alt={user?.user_metadata?.full_name as string} />
                      <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold">
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
                  <DropdownMenuLabel className="text-amber-700 dark:text-amber-300 font-semibold">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer py-3 px-4 hover:bg-amber-50 dark:hover:bg-amber-950/20">
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
              
              {/* Direct Logout Button */}
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 hover:border-red-300 w-full py-3"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <div className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className="min-h-full p-4 md:p-8">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
