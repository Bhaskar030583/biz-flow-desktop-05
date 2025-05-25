
import { useState } from 'react';
import { UserRole } from '@/context/AuthContext';

export const useUserFormState = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    isSubmitting,
    setIsSubmitting
  };
};
