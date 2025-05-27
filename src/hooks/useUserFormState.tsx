
import { useState } from 'react';
import { UserRole } from '@/context/AuthContext';

export const useUserFormState = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [selectedPages, setSelectedPages] = useState<string[]>(['dashboard']);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting
  };
};
