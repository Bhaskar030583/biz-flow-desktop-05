
import { supabase } from "@/integrations/supabase/client";

export const fetchUsers = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  
  return data || [];
};

export const fetchUserById = async (id: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  
  return data;
};

export const updateUserById = async (id: string, userData: any) => {
  // Remove any properties not part of the profiles table
  // We are only modifying profile data, not auth data like email
  const { email, ...profileData } = userData;
  
  const { data, error } = await supabase
    .from("profiles")
    .update(profileData)
    .eq("id", id)
    .select();

  if (error) throw error;
  
  return data;
};

export const deleteUserById = async (id: string) => {
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id);

  if (error) throw error;
  
  return { success: true };
};
