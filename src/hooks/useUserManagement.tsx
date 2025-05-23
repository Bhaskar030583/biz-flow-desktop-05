
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

interface AuthUserView {
  id: string;
  email: string;
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

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Instead of using admin API, fetch users from the profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, role, full_name, created_at");
      
      if (profilesError) {
        throw profilesError;
      }
      
      // Get user emails using the auth_users_view using a direct RPC call to avoid typing issues
      // Fix for TypeScript error: Explicitly specify both return type and error type parameters
      const { data: authUsers, error: authError } = await supabase
        .rpc<AuthUserView[], any>('get_auth_users_view');
      
      if (authError) {
        console.error("Could not fetch auth users:", authError);
        throw authError;
      }
      
      // Combine data - safely check if authUsers exists
      const combinedData = profilesData.map(profile => {
        // Fix for TypeScript error: Use proper null check and type narrowing
        const authUserArray = Array.isArray(authUsers) ? authUsers : [];
        const authUser = authUserArray.find(user => user.id === profile.id) || 
          { email: "unknown@example.com" };
        
        // Check if this is the protected admin email
        const isProtectedAdmin = authUser.email === "gumpubhaskar3000@gmail.com";
        
        if (isProtectedAdmin && profile.role !== "admin") {
          updateUserRoleToAdmin(profile.id);
        }
        
        return {
          id: profile.id,
          email: authUser.email,
          role: (profile.role as UserRole) || "user",
          created_at: profile.created_at || "",
          full_name: profile.full_name,
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
