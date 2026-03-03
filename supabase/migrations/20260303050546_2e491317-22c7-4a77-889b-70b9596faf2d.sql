
-- Create list_shares table
CREATE TABLE public.list_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  shared_with_email text NOT NULL,
  shared_with_user_id uuid,
  permission text NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  shared_by uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.list_shares ENABLE ROW LEVEL SECURITY;

-- Owner of the list can manage shares
CREATE POLICY "List owners can manage shares"
  ON public.list_shares FOR ALL
  USING (
    shared_by = auth.uid() 
    OR shared_with_user_id = auth.uid()
  )
  WITH CHECK (shared_by = auth.uid());

-- Function to check if user has access to a list (owner or shared)
CREATE OR REPLACE FUNCTION public.has_list_access(_user_id uuid, _list_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shopping_lists WHERE id = _list_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.list_shares WHERE list_id = _list_id AND shared_with_user_id = _user_id
  )
$$;

-- Function to check if user can edit a shared list
CREATE OR REPLACE FUNCTION public.can_edit_list(_user_id uuid, _list_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shopping_lists WHERE id = _list_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.list_shares WHERE list_id = _list_id AND shared_with_user_id = _user_id AND permission = 'edit'
  )
$$;

-- Update shopping_lists SELECT policy to include shared lists
DROP POLICY IF EXISTS "Users can view their own lists" ON public.shopping_lists;
CREATE POLICY "Users can view accessible lists"
  ON public.shopping_lists FOR SELECT
  USING (public.has_list_access(auth.uid(), id));

-- Update shopping_items SELECT policy to include shared list items
DROP POLICY IF EXISTS "Users can view their own items" ON public.shopping_items;
CREATE POLICY "Users can view accessible items"
  ON public.shopping_items FOR SELECT
  USING (public.has_list_access(auth.uid(), list_id));

-- Allow users with edit permission to insert items on shared lists
DROP POLICY IF EXISTS "Users can create their own items" ON public.shopping_items;
CREATE POLICY "Users can create items on editable lists"
  ON public.shopping_items FOR INSERT
  WITH CHECK (public.can_edit_list(auth.uid(), list_id) AND auth.uid() = user_id);

-- Allow users with edit permission to update items on shared lists
DROP POLICY IF EXISTS "Users can update their own items" ON public.shopping_items;
CREATE POLICY "Users can update items on editable lists"
  ON public.shopping_items FOR UPDATE
  USING (public.can_edit_list(auth.uid(), list_id));

-- Allow users with edit permission to delete items on shared lists
DROP POLICY IF EXISTS "Users can delete their own items" ON public.shopping_items;
CREATE POLICY "Users can delete items on editable lists"
  ON public.shopping_items FOR DELETE
  USING (public.can_edit_list(auth.uid(), list_id));

-- Function to resolve email to user_id (for sharing)
CREATE OR REPLACE FUNCTION public.resolve_share_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT id INTO NEW.shared_with_user_id
  FROM auth.users
  WHERE email = NEW.shared_with_email;
  RETURN NEW;
END;
$$;

CREATE TRIGGER resolve_share_user_trigger
  BEFORE INSERT ON public.list_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.resolve_share_user();

-- Enable realtime for list_shares
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_shares;
