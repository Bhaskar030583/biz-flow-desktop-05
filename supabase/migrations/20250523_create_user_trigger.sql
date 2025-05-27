
-- Create trigger to create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, code, page_access)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    new.raw_user_meta_data->>'code',
    CASE 
      WHEN new.raw_user_meta_data->>'page_access' IS NOT NULL 
      THEN string_to_array(replace(replace(new.raw_user_meta_data->>'page_access', '[', ''), ']', ''), ',')
      ELSE ARRAY['dashboard']
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
