
import { supabase } from "@/integrations/supabase/client";

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
  const { data, error } = await supabase
    .from("profiles")
    .update(userData)
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
