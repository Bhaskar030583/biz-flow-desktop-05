
-- Create a view to access user emails safely
CREATE OR REPLACE VIEW public.auth_users_view AS 
SELECT id, email
FROM auth.users;

-- Grant permissions to the view
GRANT SELECT ON public.auth_users_view TO authenticated;
GRANT SELECT ON public.auth_users_view TO anon;
