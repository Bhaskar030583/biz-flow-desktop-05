
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types/user';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useUserRoleManagement } from './useUserRoleManagement';
import { useUserFormState } from './useUserFormState';

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get the form state management
  const { 
    email, setEmail,
    password, setPassword,
    fullName, setFullName,
    role, setRole,
    isSubmitting, setIsSubmitting
  } = useUserFormState();
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get profiles with user data
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      // Map the profiles to User type ensuring correct typings
      const formattedUsers: User[] = profiles?.map((profile) => {
        return {
          id: profile.id,
          full_name: profile.full_name || '',
          email: 'user@example.com', // Placeholder since auth.users is not directly accessible
          avatar_url: profile.avatar_url || '',
          role: (profile.role as UserRole) || 'user',
          created_at: profile.created_at || new Date().toISOString()
        };
      }) || [];
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  // Setup user role management
  const { updateUserRole } = useUserRoleManagement(users, setUsers);

  // Handle adding new user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Call signup from auth context
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });
      
      if (error) throw error;
      
      toast.success(`User added successfully`);
      
      // Reset form
      setEmail('');
      setPassword('');
      setFullName('');
      setRole('user' as UserRole);
      
      // Refresh users list
      fetchUsers();
      
    } catch (error: any) {
      toast.error(`Error adding user: ${error.message}`);
      console.error('Error adding user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  return {
    users,
    loading,
    fetchUsers,
    email,
    setEmail,
    password,
    setPassword, 
    fullName,
    setFullName,
    role,
    setRole,
    isSubmitting,
    handleAddUser,
    updateUserRole
  };
};
