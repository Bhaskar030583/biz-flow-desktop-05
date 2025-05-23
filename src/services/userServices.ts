
import { supabase } from "@/integrations/supabase/client";
import { User, UserWithProfile } from "@/types/user";

export const fetchUsers = async (): Promise<UserWithProfile[]> => {
  const { data, error } = await supabase.rpc('get_auth_users_view');

  if (error) throw error;

  return data || [];
};

// Alias for backward compatibility
export const fetchUsersService = fetchUsers;

export const getUserById = async (userId: string): Promise<UserWithProfile> => {
  const { data, error } = await supabase
    .rpc('get_auth_users_view')
    .eq('id', userId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('User not found');

  return data;
};

export const updateUserRole = async (userId: string, role: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) throw error;
};

export const updateUserStatus = async (userId: string, is_active: boolean): Promise<void> => {
  const { error } = await supabase.auth.admin.updateUserById(
    userId,
    { user_metadata: { is_active } }
  );

  if (error) throw error;
};
