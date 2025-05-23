
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/context/AuthContext";
import { toast } from "sonner";

interface UserData {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  full_name: string | null;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Special function to update the specified user to admin role
  const updateUserRoleToAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId);
      
      if (error) {
        console.error("Error setting admin role:", error);
        return;
      }
      
      toast.success("User gumpubhaskar3000@gmail.com has been granted admin access");
      
    } catch (error) {
      console.error("Error in updating role to admin:", error);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        throw usersError;
      }
      
      // Fetch profile data to get roles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, role, full_name");
      
      if (profilesError) {
        throw profilesError;
      }
      
      // Combine data
      const combinedData = usersData.users.map(user => {
        const profile = profilesData?.find(p => p.id === user.id);
        
        // Special case for specified email
        if (user.email === "gumpubhaskar3000@gmail.com") {
          // Update the role to admin directly in the database
          updateUserRoleToAdmin(user.id);
          // Return with admin role for immediate UI update
          return {
            id: user.id,
            email: user.email || "",
            role: "admin" as UserRole,
            created_at: user.created_at || "",
            full_name: profile?.full_name || user.user_metadata?.full_name || null,
          };
        }
        
        return {
          id: user.id,
          email: user.email || "",
          role: (profile?.role as UserRole) || "user",
          created_at: user.created_at || "",
          full_name: profile?.full_name || user.user_metadata?.full_name || null,
        };
      });
      
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

    setIsSubmitting(true);
    
    try {
      // Create user with supabase admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role },
      });
      
      if (error) throw error;
      
      // Ensure profile has the correct role
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role, full_name: fullName })
        .eq("id", data.user.id);
      
      if (profileError) throw profileError;
      
      toast.success("User created successfully");
      
      // Reset form
      setEmail("");
      setPassword("");
      setFullName("");
      setRole("user");
      
      // Refresh user list
      fetchUsers();
      
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
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
