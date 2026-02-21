-- Create products table for user's personal shelf
CREATE TABLE IF NOT EXISTS public.user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('skin', 'makeup', 'hair', 'body', 'fragrance')),
  expiry_date DATE,
  period_after_opening INTEGER, -- PAO in months
  status TEXT NOT NULL CHECK (status IN ('sealed', 'opened')) DEFAULT 'sealed',
  opened_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "users_can_view_own_products" ON public.user_products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_products" ON public.user_products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_products" ON public.user_products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_products" ON public.user_products
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_products_updated_at 
  BEFORE UPDATE ON public.user_products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
