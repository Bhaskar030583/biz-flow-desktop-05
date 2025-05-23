
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/context/AuthContext";
import { toast } from "sonner";
import { type UserData } from "@/types/user";

export const useUserRoleManagement = (
  users: UserData[],
  setUsers: React.Dispatch<React.SetStateAction<UserData[]>>
) => {
  // Special function to update the specified user to admin role
  const updateUserRoleToAdmin = async (userId: string) => {
    try {
      console.log("Setting admin role for protected user:", userId);
      
      const { error } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId);
      
      if (error) {
        console.error("Error setting admin role:", error);
        return false;
      }
      
      toast.success("Admin access granted to gumpubhaskar3000@gmail.com");
      return true;
      
    } catch (error) {
      console.error("Error in updating role to admin:", error);
      return false;
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      // Check if this is the protected admin
      const user = users.find(u => u.id === userId);
      
      if (user?.email === "gumpubhaskar3000@gmail.com" && newRole !== "admin") {
        toast.error("Cannot change role for system administrator");
        return;
      }
      
      // Update the role in profiles table
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);
      
      if (error) throw error;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      toast.success("User role updated successfully");
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast.error(error.message || "Failed to update user role");
    }
  };

  return {
    updateUserRoleToAdmin,
    updateUserRole
  };
};
