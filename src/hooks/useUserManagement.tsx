
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/context/AuthContext";
import { toast } from "sonner";
import { fetchUsersService } from "@/services/userServices";
import { useUserRoleManagement } from "@/hooks/useUserRoleManagement";
import { useUserFormState } from "@/hooks/useUserFormState";
import { type UserData } from "@/types/user";

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    role,
    setRole,
    isSubmitting,
    setIsSubmitting
  } = useUserFormState();
  
  const { updateUserRole, updateUserRoleToAdmin } = useUserRoleManagement(users, setUsers);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const combinedData = await fetchUsersService();
      setUsers(combinedData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Special handling for protected admin email
    if (email === "gumpubhaskar3000@gmail.com") {
      toast.error("This email address is reserved for system administrator");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Use regular signup instead of admin API
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: fullName,
            role: role 
          }
        }
      });
      
      if (error) throw error;
      
      toast.success("User created successfully. Check email for confirmation link.");
      
      // Reset form
      setEmail("");
      setPassword("");
      setFullName("");
      setRole("user");
      
      // Refresh user list
      setTimeout(() => {
        fetchUsers();
      }, 1000);
      
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    isLoading,
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    role,
    setRole,
    isSubmitting,
    fetchUsers,
    handleAddUser,
    updateUserRole
  };
};
