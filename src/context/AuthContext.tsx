
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Define the role type
export type UserRole = "admin" | "user" | "sales" | "lead";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: any | null;
    data: Session | null;
  }>;
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{
    error: any | null;
    data: any | null;
  }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("user"); // Default to user role
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserRole = async (userId: string, userEmail?: string | null) => {
    try {
      // Special case for the protected admin email
      if (userEmail === "gumpubhaskar3000@gmail.com") {
        console.log("Setting admin role for protected user");
        setUserRole("admin");
        
        // Also update the role in database to ensure consistency
        const { error } = await supabase
          .from('profiles')
          .update({ role: "admin" })
          .eq('id', userId);
          
        if (error) {
          console.error('Error updating admin role in database:', error);
        }
        
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      // Now that we have the role column, we can safely access it
      if (data && data.role) {
        setUserRole(data.role as UserRole);
        console.log("User role set to:", data.role);
      } else {
        // Fallback to user metadata or default role
        const fallbackRole = user?.user_metadata?.role || "user";
        setUserRole(fallbackRole as UserRole);
        console.log("User role set to fallback:", fallbackRole);
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Use setTimeout to prevent potential deadlock with Supabase auth
          setTimeout(() => {
            fetchUserRole(currentSession.user.id, currentSession.user.email);
          }, 0);
        } else {
          setUserRole("user"); // Reset to default role when logged out
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchUserRole(currentSession.user.id, currentSession.user.email);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data?.session) {
      if (data.session.user) {
        // Handle special case for admin user
        if (email === "gumpubhaskar3000@gmail.com") {
          setUserRole("admin");
          toast.success("Admin login successful");
        } else {
          fetchUserRole(data.session.user.id, email);
        }
      }
      navigate("/dashboard");
    }
    
    return { data: data?.session, error };
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole = "user") => {
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

    if (!error) {
      navigate("/dashboard");
    }

    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole("user"); // Reset role on sign out
    navigate("/auth");
  };

  const value = {
    session,
    user,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
