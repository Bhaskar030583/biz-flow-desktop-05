
export { UserRole } from "@/context/AuthContext";

export type User = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: string;
  created_at: string;
};

// For backward compatibility
export type UserData = {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  full_name: string | null;
};
