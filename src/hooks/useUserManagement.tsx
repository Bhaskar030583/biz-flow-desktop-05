
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useUserRoleManagement } from './useUserRoleManagement';
import { useUserFormState } from './useUserFormState';

interface UserData {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  full_name: string | null;
  page_access?: string[];
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get the form state management
  const { 
    email, setEmail,
    password, setPassword,
    fullName, setFullName,
    code, setCode,
    role, setRole,
    selectedPages, setSelectedPages,
    handlePageToggle,
    isSubmitting, setIsSubmitting,
    selectedPermissions,
    handlePermissionToggle,
    resetPermissions,
    setPermissions
  } = useUserFormState();
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get profiles with user data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        throw profilesError;
      }
      
      // Try to get auth users but handle errors gracefully
      let authUsers: any[] = [];
      try {
        // Note: This RPC function might not exist, so we'll handle it gracefully
        const { data, error } = await supabase.rpc('get_auth_users_view');
        if (!error && data) {
          authUsers = Array.isArray(data) ? data : [];
        }
      } catch (error) {
        console.warn('Could not fetch auth users, using profile data only:', error);
      }
      
      // Map the profiles to UserData type with email information
      const formattedUsers: UserData[] = profiles?.map((profile) => {
        const authUser = authUsers.find((user: any) => user.id === profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name || '',
          email: authUser?.email || 'user@example.com',
          role: (profile.role as UserRole) || 'user',
          created_at: profile.created_at || new Date().toISOString(),
          page_access: profile.page_access || ['dashboard']
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
      // Convert granular permissions to a simple array format for storage
      const pageAccessArray = Object.entries(selectedPermissions || {})
        .filter(([, permissions]) => permissions && Object.values(permissions).some(Boolean))
        .map(([pageId]) => pageId);

      // Call signup from auth context
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            code: code,
            role: role,
            page_access: pageAccessArray,
            permissions: selectedPermissions, // Store granular permissions
          },
        },
      });
      
      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          throw new Error("User code or email already exists. Please choose different values.");
        }
        throw error;
      }
      
      const totalPermissions = Object.values(selectedPermissions || {}).reduce((total, permissions) => {
        if (!permissions || typeof permissions !== 'object') return total;
        return total + Object.values(permissions).filter(Boolean).length;
      }, 0);
      
      toast.success(`User added successfully with ${totalPermissions} permissions across ${pageAccessArray.length} pages`);
      
      // Reset form
      setEmail('');
      setPassword('');
      setFullName('');
      setCode('');
      setRole('user' as UserRole);
      setSelectedPages(['dashboard']);
      resetPermissions();
      
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
    code,
    setCode,
    role,
    setRole,
    selectedPages,
    handlePageToggle,
    isSubmitting,
    handleAddUser,
    updateUserRole,
    selectedPermissions,
    handlePermissionToggle,
    resetPermissions,
    setPermissions
  };
};
