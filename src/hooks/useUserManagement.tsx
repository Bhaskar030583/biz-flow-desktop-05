import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types/user';

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      // Make sure we're mapping the data correctly based on the available properties
      const formattedUsers = profiles?.map((profile) => ({
        id: profile.id,
        fullName: profile.full_name,
        // If email is needed but not in profiles, you might need to join with auth.users
        // or adjust your data model to include email in profiles
        // For now, set email to a placeholder or use another property
        email: 'user@example.com', // Placeholder - replace with actual email source
        avatarUrl: profile.avatar_url,
        role: profile.role || UserRole.User,
        createdAt: profile.created_at
      })) || [];
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  return {
    users,
    loading,
    fetchUsers,
  };
};
