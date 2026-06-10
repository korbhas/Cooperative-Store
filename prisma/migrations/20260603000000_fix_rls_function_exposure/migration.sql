-- Move RLS helper functions out of the public schema so PostgREST cannot
-- expose them as callable RPC endpoints, while keeping RLS policies intact.

-- ─── 1. Create private schema ────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS _private;

-- ─── 2. Recreate helpers in _private ────────────────────────────────────────

-- Bridge: Clerk JWT email claim → app users.id (integer)
-- SECURITY DEFINER bypasses RLS on users to prevent infinite recursion
CREATE OR REPLACE FUNCTION _private.app_user_id()
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM users WHERE email = auth.email()
$$;

-- Returns true when the JWT carries role = 'admin' in metadata
CREATE OR REPLACE FUNCTION _private.is_admin()
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

-- Only authenticated users need to call these (via RLS policy evaluation).
-- anon has no JWT so both functions are meaningless for them anyway.
REVOKE EXECUTE ON FUNCTION _private.app_user_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION _private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION _private.app_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION _private.is_admin() TO authenticated;

-- ─── 3. Rewrite policies that referenced public.*  ───────────────────────────
-- Any policy with TO anon, authenticated that called public.is_admin() must be
-- split: anon gets a plain predicate, authenticated gets the full check.

-- users
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_admin_write" ON public.users;

CREATE POLICY "users_select" ON public.users
  FOR SELECT TO authenticated
  USING (id = _private.app_user_id() OR _private.is_admin());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (id = _private.app_user_id())
  WITH CHECK (id = _private.app_user_id());

CREATE POLICY "users_admin_write" ON public.users
  FOR ALL TO authenticated
  USING (_private.is_admin())
  WITH CHECK (_private.is_admin());

-- categories
DROP POLICY IF EXISTS "categories_admin_write" ON public.categories;

CREATE POLICY "categories_admin_write" ON public.categories
  FOR ALL TO authenticated
  USING (_private.is_admin())
  WITH CHECK (_private.is_admin());

-- products — split anon/authenticated so anon never calls is_admin()
DROP POLICY IF EXISTS "products_read" ON public.products;
DROP POLICY IF EXISTS "products_admin_write" ON public.products;

CREATE POLICY "products_read_anon" ON public.products
  FOR SELECT TO anon
  USING ("isActive" = true);

CREATE POLICY "products_read_auth" ON public.products
  FOR SELECT TO authenticated
  USING ("isActive" = true OR _private.is_admin());

CREATE POLICY "products_admin_write" ON public.products
  FOR ALL TO authenticated
  USING (_private.is_admin())
  WITH CHECK (_private.is_admin());

-- product_variants
DROP POLICY IF EXISTS "variants_admin_write" ON public.product_variants;

CREATE POLICY "variants_admin_write" ON public.product_variants
  FOR ALL TO authenticated
  USING (_private.is_admin())
  WITH CHECK (_private.is_admin());

-- orders
DROP POLICY IF EXISTS "orders_select" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;

CREATE POLICY "orders_select" ON public.orders
  FOR SELECT TO authenticated
  USING ("userId" = _private.app_user_id() OR _private.is_admin());

CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK ("userId" = _private.app_user_id());

CREATE POLICY "orders_admin_update" ON public.orders
  FOR UPDATE TO authenticated
  USING (_private.is_admin())
  WITH CHECK (_private.is_admin());

-- order_items
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_own" ON public.order_items;

CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items."orderId"
        AND (orders."userId" = _private.app_user_id() OR _private.is_admin())
    )
  );

CREATE POLICY "order_items_insert_own" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items."orderId"
        AND orders."userId" = _private.app_user_id()
    )
  );

-- payments
DROP POLICY IF EXISTS "payments_select" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_write" ON public.payments;

CREATE POLICY "payments_select" ON public.payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments."orderId"
        AND (orders."userId" = _private.app_user_id() OR _private.is_admin())
    )
  );

CREATE POLICY "payments_admin_write" ON public.payments
  FOR ALL TO authenticated
  USING (_private.is_admin())
  WITH CHECK (_private.is_admin());

-- cart_items
DROP POLICY IF EXISTS "cart_items_own" ON public.cart_items;

CREATE POLICY "cart_items_own" ON public.cart_items
  FOR ALL TO authenticated
  USING ("userId" = _private.app_user_id())
  WITH CHECK ("userId" = _private.app_user_id());

-- wishlists
DROP POLICY IF EXISTS "wishlists_own" ON public.wishlists;

CREATE POLICY "wishlists_own" ON public.wishlists
  FOR ALL TO authenticated
  USING ("userId" = _private.app_user_id())
  WITH CHECK ("userId" = _private.app_user_id());

-- coupons
DROP POLICY IF EXISTS "coupons_read_active" ON public.coupons;
DROP POLICY IF EXISTS "coupons_admin_write" ON public.coupons;

CREATE POLICY "coupons_read_active" ON public.coupons
  FOR SELECT TO authenticated
  USING ("isActive" = true OR _private.is_admin());

CREATE POLICY "coupons_admin_write" ON public.coupons
  FOR ALL TO authenticated
  USING (_private.is_admin())
  WITH CHECK (_private.is_admin());

-- delivery_areas — split anon/authenticated (anon checks pincode availability)
DROP POLICY IF EXISTS "delivery_areas_read_active" ON public.delivery_areas;
DROP POLICY IF EXISTS "delivery_areas_admin_write" ON public.delivery_areas;

CREATE POLICY "delivery_areas_read_anon" ON public.delivery_areas
  FOR SELECT TO anon
  USING ("isActive" = true);

CREATE POLICY "delivery_areas_read_auth" ON public.delivery_areas
  FOR SELECT TO authenticated
  USING ("isActive" = true OR _private.is_admin());

CREATE POLICY "delivery_areas_admin_write" ON public.delivery_areas
  FOR ALL TO authenticated
  USING (_private.is_admin())
  WITH CHECK (_private.is_admin());

-- delivery_agents
DROP POLICY IF EXISTS "delivery_agents_admin" ON public.delivery_agents;

CREATE POLICY "delivery_agents_admin" ON public.delivery_agents
  FOR ALL TO authenticated
  USING (_private.is_admin())
  WITH CHECK (_private.is_admin());

-- settings
DROP POLICY IF EXISTS "settings_admin" ON public.settings;

CREATE POLICY "settings_admin" ON public.settings
  FOR ALL TO authenticated
  USING (_private.is_admin())
  WITH CHECK (_private.is_admin());

-- ─── 4. Drop the now-unused public helpers ───────────────────────────────────

DROP FUNCTION IF EXISTS public.app_user_id();
DROP FUNCTION IF EXISTS public.is_admin();
