
import { useState } from 'react';
import { UserRole } from '@/context/AuthContext';
import { useGranularPermissions } from './useGranularPermissions';

export const useUserFormState = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [selectedPages, setSelectedPages] = useState<string[]>(['dashboard']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use granular permissions hook
  const {
    selectedPermissions,
    handlePermissionToggle,
    resetPermissions,
    setPermissions
  } = useGranularPermissions({
    dashboard: { view: true, edit: false, delete: false }
  });

  const handlePageToggle = (page: string) => {
    setSelectedPages(prev => 
      prev.includes(page) 
        ? prev.filter(p => p !== page)
        : [...prev, page]
    );
  };

  return {
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
    setSelectedPages,
    handlePageToggle,
    isSubmitting,
    setIsSubmitting,
    selectedPermissions,
    handlePermissionToggle,
    resetPermissions,
    setPermissions
  };
};
