
-- 1. Extend user_role enum with vendor and delivery
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'vendor';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'delivery';

-- 2. Vendor-specific categories for products
CREATE TABLE public.vendor_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT 'package',
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage their own categories" ON public.vendor_categories
  FOR ALL USING (vendor_id = auth.uid());

CREATE POLICY "Anyone can view active vendor categories" ON public.vendor_categories
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage all vendor categories" ON public.vendor_categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 3. Products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  category_id uuid REFERENCES public.vendor_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  photos text[] DEFAULT '{}'::text[],
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage their own products" ON public.products
  FOR ALL USING (vendor_id = auth.uid());

CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage all products" ON public.products
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 4. Orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  total_price numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash_on_delivery',
  delivery_address text,
  delivery_latitude numeric,
  delivery_longitude numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Clients can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Vendors can view their orders" ON public.orders
  FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update their orders" ON public.orders
  FOR UPDATE USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 5. Order items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (o.client_id = auth.uid() OR o.vendor_id = auth.uid())
    )
  );

CREATE POLICY "Clients can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.client_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all order items" ON public.order_items
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 6. Deliveries table
CREATE TABLE public.deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  vendor_id uuid NOT NULL,
  delivery_person_id uuid,
  status text NOT NULL DEFAULT 'pending',
  pickup_address text,
  pickup_latitude numeric,
  pickup_longitude numeric,
  delivery_address text,
  delivery_latitude numeric,
  delivery_longitude numeric,
  current_latitude numeric,
  current_longitude numeric,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage their deliveries" ON public.deliveries
  FOR ALL USING (auth.uid() = vendor_id);

CREATE POLICY "Delivery persons can view assigned deliveries" ON public.deliveries
  FOR SELECT USING (auth.uid() = delivery_person_id);

CREATE POLICY "Delivery persons can update assigned deliveries" ON public.deliveries
  FOR UPDATE USING (auth.uid() = delivery_person_id);

CREATE POLICY "Delivery persons can view pending deliveries" ON public.deliveries
  FOR SELECT USING (status = 'pending' AND delivery_person_id IS NULL);

CREATE POLICY "Clients can view their deliveries" ON public.deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = deliveries.order_id AND o.client_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all deliveries" ON public.deliveries
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 7. Enable realtime for deliveries (tracking) and orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 8. Triggers for updated_at
CREATE TRIGGER update_vendor_categories_updated_at
  BEFORE UPDATE ON public.vendor_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Vendor profiles table (like technicians table)
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  vendor_type text NOT NULL DEFAULT 'singular',
  store_name text,
  store_description text,
  store_logo text,
  address text,
  latitude numeric,
  longitude numeric,
  active boolean DEFAULT false,
  verified boolean DEFAULT false,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  completed_orders integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their own profile" ON public.vendors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Vendors can update their own profile" ON public.vendors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public can view active vendors" ON public.vendors
  FOR SELECT USING (active = true AND verified = true);

CREATE POLICY "Admins can manage vendors" ON public.vendors
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert vendors" ON public.vendors
  FOR INSERT WITH CHECK (true);

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Delivery persons table
CREATE TABLE public.delivery_persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  vehicle_type text,
  license_plate text,
  available boolean DEFAULT true,
  latitude numeric,
  longitude numeric,
  active boolean DEFAULT false,
  verified boolean DEFAULT false,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  completed_deliveries integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Delivery persons can view their own profile" ON public.delivery_persons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Delivery persons can update their own profile" ON public.delivery_persons
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public can view active delivery persons" ON public.delivery_persons
  FOR SELECT USING (active = true AND verified = true);

CREATE POLICY "Admins can manage delivery persons" ON public.delivery_persons
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert delivery persons" ON public.delivery_persons
  FOR INSERT WITH CHECK (true);

CREATE TRIGGER update_delivery_persons_updated_at
  BEFORE UPDATE ON public.delivery_persons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Update handle_new_user to support vendor and delivery roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, phone, role, client_type, company_name, nif, organization_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'),
    CASE 
      WHEN COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client') = 'client' 
      THEN COALESCE(NEW.raw_user_meta_data->>'client_type', 'personal')
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'nif',
    NEW.raw_user_meta_data->>'organization_type'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  
  -- Create technician profile if role is technician
  IF COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client') = 'technician' THEN
    INSERT INTO public.technicians (user_id) VALUES (NEW.id);
  END IF;
  
  -- Create vendor profile if role is vendor
  IF COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client') = 'vendor' THEN
    INSERT INTO public.vendors (
      user_id, 
      vendor_type,
      store_name
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'vendor_type', 'singular'),
      NEW.raw_user_meta_data->>'store_name'
    );
  END IF;
  
  -- Create delivery person profile if role is delivery
  IF COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client') = 'delivery' THEN
    INSERT INTO public.delivery_persons (
      user_id,
      vehicle_type
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'vehicle_type'
    );
  END IF;
  
  RETURN NEW;
END;
$$;
