
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
  Menu,
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
    console.log('Logout button clicked');
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

  console.log('DashboardLayout rendering, current location:', location.pathname);
  console.log('User:', user?.email, 'Role:', userRole);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
        <Sidebar className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/30 shadow-xl" collapsible="offcanvas">
          <SidebarHeader className="border-b border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <Link to="/dashboard" className="flex items-center gap-3 flex-1">
                <img 
                  src="/lovable-uploads/8b453aae-4e22-4d63-857c-9994a32b7796.png" 
                  alt="ABC Cafe Logo" 
                  className="h-10 w-auto rounded-lg shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-900 dark:text-white bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent text-lg">ABC Cafe</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Business Management</p>
                </div>
              </Link>
            </div>
            <div className="flex justify-center">
              <ModeToggle />
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-amber-700 dark:text-amber-300 font-semibold mb-3 px-2">Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location.pathname === item.path}
                        className={`flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 dark:hover:bg-amber-950/20 rounded-lg transition-all duration-200 group w-full ${
                          location.pathname === item.path 
                            ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 text-amber-700 dark:text-amber-300 shadow-sm border-l-4 border-amber-500 font-medium' 
                            : ''
                        }`}
                      >
                        <Link to={item.path} className="flex items-center gap-3 w-full">
                          <span className="transition-transform group-hover:scale-110">{item.icon}</span>
                          <span className="font-medium">{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="p-4 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-3">
              {/* User Profile Display */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <Avatar className="h-10 w-10 ring-2 ring-amber-100 dark:ring-amber-900 shadow-lg">
                  <AvatarImage src={user?.user_metadata?.avatar_url as string} alt={user?.user_metadata?.full_name as string} />
                  <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-sm">
                    {(user?.user_metadata?.full_name as string)?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs font-medium mt-1 ${getRoleBadgeColor(userRole)}`}
                  >
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </Badge>
                </div>
              </div>
              
              {/* Logout Button */}
              <Button 
                onClick={handleLogout}
                variant="destructive" 
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <div className="flex-1 overflow-x-hidden overflow-y-auto">
            {/* Header with Sidebar Trigger */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 px-4 py-3">
                <SidebarTrigger className="flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SidebarTrigger>
                <div className="flex-1">
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
                  </h1>
                </div>
              </div>
            </div>
            
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
