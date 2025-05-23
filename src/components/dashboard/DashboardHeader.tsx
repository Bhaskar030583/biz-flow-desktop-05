
import React from "react";
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from '@/components/ModeToggle';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  title, 
  subtitle 
}) => {
  const { user } = useAuth();
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "US";

  return (
    <div className="flex items-center justify-between w-full">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent mb-1">
          {title}
        </h1>
        {subtitle && <p className="text-muted-foreground text-sm md:text-base">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-4">
        <ModeToggle />
        <Avatar className="h-9 w-9 border-2 border-primary/10">
          <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt="User" />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};
