-- ─── Helper functions ──────────────────────────────────────────────────────
-- Bridge: Supabase/Clerk JWT email claim → app users.id (integer)
-- SECURITY DEFINER so it bypasses RLS on users (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.app_user_id()
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM users WHERE email = auth.email()
$$;

-- Returns true when the JWT carries role = 'admin' in user_metadata
-- (set by scripts/create-admin.mjs via supabase.auth.admin.createUser)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'public_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'role') = 'admin',
    false
  )
$$;

-- ─── Enable RLS on every table ─────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ─── users ─────────────────────────────────────────────────────────────────

-- Authenticated users can read their own row; admins read all
CREATE POLICY "users_select" ON public.users
  FOR SELECT TO authenticated
  USING (id = public.app_user_id() OR public.is_admin());

-- Users can update only their own profile
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (id = public.app_user_id())
  WITH CHECK (id = public.app_user_id());

-- Admins have full write access (insert, update, delete)
CREATE POLICY "users_admin_write" ON public.users
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── categories ─────────────────────────────────────────────────────────────

CREATE POLICY "categories_read" ON public.categories
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "categories_admin_write" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── products ───────────────────────────────────────────────────────────────

-- Anyone can see active products; admins see all (including inactive)
CREATE POLICY "products_read" ON public.products
  FOR SELECT TO anon, authenticated
  USING ("isActive" = true OR public.is_admin());

CREATE POLICY "products_admin_write" ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── product_variants ───────────────────────────────────────────────────────

CREATE POLICY "variants_read" ON public.product_variants
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "variants_admin_write" ON public.product_variants
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── orders ─────────────────────────────────────────────────────────────────

-- Users see their own orders; admins see all
-- Guest orders (userId IS NULL) are inaccessible here — they use accessToken instead
CREATE POLICY "orders_select" ON public.orders
  FOR SELECT TO authenticated
  USING ("userId" = public.app_user_id() OR public.is_admin());

-- Users can create orders for themselves only
CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK ("userId" = public.app_user_id());

-- Only admins can update order status, assign agents, etc.
CREATE POLICY "orders_admin_update" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── order_items ────────────────────────────────────────────────────────────

CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items."orderId"
        AND (orders."userId" = public.app_user_id() OR public.is_admin())
    )
  );

CREATE POLICY "order_items_insert_own" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items."orderId"
        AND orders."userId" = public.app_user_id()
    )
  );

-- ─── payments ───────────────────────────────────────────────────────────────

CREATE POLICY "payments_select" ON public.payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments."orderId"
        AND (orders."userId" = public.app_user_id() OR public.is_admin())
    )
  );

-- Payment rows are written server-side (Razorpay webhook); admins can mutate
CREATE POLICY "payments_admin_write" ON public.payments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── cart_items ─────────────────────────────────────────────────────────────

CREATE POLICY "cart_items_own" ON public.cart_items
  FOR ALL TO authenticated
  USING ("userId" = public.app_user_id())
  WITH CHECK ("userId" = public.app_user_id());

-- ─── wishlists ──────────────────────────────────────────────────────────────

CREATE POLICY "wishlists_own" ON public.wishlists
  FOR ALL TO authenticated
  USING ("userId" = public.app_user_id())
  WITH CHECK ("userId" = public.app_user_id());

-- ─── coupons ────────────────────────────────────────────────────────────────

-- Authenticated users can look up active coupons (for checkout validation)
CREATE POLICY "coupons_read_active" ON public.coupons
  FOR SELECT TO authenticated
  USING ("isActive" = true OR public.is_admin());

CREATE POLICY "coupons_admin_write" ON public.coupons
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── delivery_areas ─────────────────────────────────────────────────────────

-- Anyone can check pincode availability (used in checkout pincode validation)
CREATE POLICY "delivery_areas_read_active" ON public.delivery_areas
  FOR SELECT TO anon, authenticated
  USING ("isActive" = true OR public.is_admin());

CREATE POLICY "delivery_areas_admin_write" ON public.delivery_areas
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── delivery_agents ────────────────────────────────────────────────────────

CREATE POLICY "delivery_agents_admin" ON public.delivery_agents
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── settings ───────────────────────────────────────────────────────────────

CREATE POLICY "settings_admin" ON public.settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
