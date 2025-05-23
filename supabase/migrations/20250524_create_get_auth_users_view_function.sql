
-- Create a function to return the auth_users_view data
CREATE OR REPLACE FUNCTION public.get_auth_users_view()
RETURNS TABLE (
  id UUID,
  email TEXT
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT id, email FROM public.auth_users_view;
$$;

-- Grant permissions to use this function
GRANT EXECUTE ON FUNCTION public.get_auth_users_view() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_users_view() TO anon;
