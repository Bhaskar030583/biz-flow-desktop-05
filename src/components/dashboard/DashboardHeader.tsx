
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
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'sales':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between w-full mb-8 p-4 lg:p-6 bg-gradient-to-r from-white/80 to-blue-50/80 dark:from-gray-900/80 dark:to-blue-950/80 backdrop-blur-sm rounded-2xl border border-blue-100 dark:border-blue-800 shadow-sm gap-4">
      <div className="flex items-start lg:items-center gap-3 lg:gap-4 flex-1 min-w-0">
        <img 
          src="/lovable-uploads/c1c145c9-7010-4fbf-9b2d-d46663dadb23.png" 
          alt="ABC Cafe Logo" 
          className="h-12 lg:h-16 w-auto rounded-lg shadow-sm flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-1 lg:mb-2 leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm lg:text-base xl:text-lg text-muted-foreground font-medium leading-relaxed break-words">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-32 lg:max-w-none">
            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
          </p>
          <div className="flex items-center justify-end gap-2 mt-1">
            <Badge 
              variant="secondary" 
              className={`text-xs font-medium px-2 py-1 ${getRoleBadgeColor(userRole)}`}
            >
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
          </div>
        </div>
        <Avatar className="h-10 lg:h-12 w-10 lg:w-12 border-3 border-white dark:border-gray-700 shadow-lg ring-2 ring-blue-100 dark:ring-blue-900 flex-shrink-0">
          <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt="User" />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};
