
-- Allow all authenticated users to see all lists
DROP POLICY IF EXISTS "Users can view accessible lists" ON public.shopping_lists;
CREATE POLICY "All authenticated users can view all lists"
  ON public.shopping_lists FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to see all items
DROP POLICY IF EXISTS "Users can view accessible items" ON public.shopping_items;
CREATE POLICY "All authenticated users can view all items"
  ON public.shopping_items FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to see all profiles (for display names)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "All authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
