
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/context/AuthContext";
import { type UserData } from "@/types/user";

interface AuthUserView {
  id: string;
  email: string;
}

export const fetchUsersService = async (): Promise<UserData[]> => {
  // Instead of using admin API, fetch users from the profiles table
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, role, full_name, created_at");
  
  if (profilesError) {
    throw profilesError;
  }
  
  // Use the rpc function to get auth users data
  const { data: authUsersData, error: authError } = await supabase
    .rpc<AuthUserView[]>('get_auth_users_view');
  
  if (authError) {
    console.error("Could not fetch auth users:", authError);
    throw authError;
  }
  
  // Combine data - safely check if authUsers exists
  const combinedData = profilesData.map(profile => {
    // Fix for TypeScript error: Use proper null check and type narrowing
    const authUserArray = Array.isArray(authUsersData) ? authUsersData : [];
    const authUser = authUserArray.find(user => user.id === profile.id) || 
      { email: "unknown@example.com" };
    
    // Check if this is the protected admin email
    const isProtectedAdmin = authUser.email === "gumpubhaskar3000@gmail.com";
    
    if (isProtectedAdmin && profile.role !== "admin") {
      // This will be handled in the component
      console.log("Found protected admin user that needs role update:", profile.id);
    }
    
    return {
      id: profile.id,
      email: authUser.email,
      role: (profile.role as UserRole) || "user",
      created_at: profile.created_at || "",
      full_name: profile.full_name,
    };
  });
  
  return combinedData;
};
