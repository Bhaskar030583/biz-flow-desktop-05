
import { supabase } from "@/integrations/supabase/client";

// Define the User type
export type User = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: string;
  created_at: string;
};

// Fetch users from auth.users view
export const fetchUsers = async (): Promise<User[]> => {
  try {
    // Fetch profiles with user role information
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // Fetch auth users data (needs to be an admin)
    const { data: authUsers, error: authError } = await supabase
      .rpc('get_auth_users_view')
      .select('*');

    if (authError) {
      console.error("Error fetching auth users:", authError);
      return profiles.map(profile => ({
        id: profile.id,
        email: 'Unavailable', // Email is unavailable if not an admin
        full_name: profile.full_name || 'Unknown',
        avatar_url: profile.avatar_url,
        role: profile.role || 'user',
        created_at: profile.created_at
      }));
    }

    // Combine the data from both queries
    return profiles.map(profile => {
      const authUser = authUsers?.find(user => user.id === profile.id);
      return {
        id: profile.id,
        email: authUser?.email || 'Unavailable',
        full_name: profile.full_name || 'Unknown',
        avatar_url: profile.avatar_url,
        role: profile.role || 'user',
        created_at: profile.created_at
      };
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Alias for backward compatibility
export const fetchUsersService = fetchUsers;

// Update user role
export const updateUserRole = async (userId: string, role: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};
