
import React from "react";
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  title, 
  subtitle 
}) => {
  const { user, userRole } = useAuth();
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "US";

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'lead':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'sales':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="w-full mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 sm:p-6 bg-gradient-to-r from-white/90 to-blue-50/90 dark:from-gray-900/90 dark:to-blue-950/90 backdrop-blur-md rounded-xl border border-blue-100/50 dark:border-blue-800/50 shadow-lg">
        {/* Main Content Section */}
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          <img 
            src="/lovable-uploads/c1c145c9-7010-4fbf-9b2d-d46663dadb23.png" 
            alt="ABC Cafe Logo" 
            className="h-10 sm:h-12 lg:h-14 w-auto rounded-lg shadow-md flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-blue-600 bg-clip-text text-transparent mb-1 sm:mb-2 leading-tight break-words">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground font-medium leading-relaxed break-words pr-2">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* User Profile Section */}
        <div className="flex items-center justify-end gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-24 lg:max-w-32 xl:max-w-none">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
            <div className="flex items-center justify-end mt-1">
              <Badge 
                variant="secondary" 
                className={`text-xs font-medium px-2 py-0.5 ${getRoleBadgeColor(userRole)}`}
              >
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
            </div>
          </div>
          <Avatar className="h-8 sm:h-10 lg:h-12 w-8 sm:w-10 lg:w-12 border-2 border-white dark:border-gray-700 shadow-lg ring-2 ring-blue-100 dark:ring-blue-900 flex-shrink-0">
            <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt="User" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-600 text-white font-bold text-xs sm:text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
};
