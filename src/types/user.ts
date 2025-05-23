
import { UserRole } from "@/context/AuthContext";

export interface UserData {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  full_name: string | null;
}
