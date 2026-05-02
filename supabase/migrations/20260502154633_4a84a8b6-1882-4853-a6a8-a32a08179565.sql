
-- 1. Roles enum + user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Security-definer role checker
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Policies for user_roles (admins only)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. VIP submissions table
CREATE TABLE public.vip_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  selected_benefits INTEGER[] NOT NULL DEFAULT '{}',
  photo_path TEXT,
  photo_quality JSONB,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vip_submissions_created_at ON public.vip_submissions (created_at DESC);
CREATE INDEX idx_vip_submissions_status ON public.vip_submissions (status);

ALTER TABLE public.vip_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous) can submit
CREATE POLICY "Anyone can submit VIP form"
  ON public.vip_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read/update/delete
CREATE POLICY "Admins can view submissions"
  ON public.vip_submissions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update submissions"
  ON public.vip_submissions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete submissions"
  ON public.vip_submissions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER vip_submissions_set_updated_at
  BEFORE UPDATE ON public.vip_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Storage bucket for VIP photos (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vip-photos', 'vip-photos', false);

-- Anyone can upload into the 'submissions/' folder
CREATE POLICY "Anyone can upload VIP photo"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'vip-photos'
    AND (storage.foldername(name))[1] = 'submissions'
  );

-- Only admins can read photos
CREATE POLICY "Admins can read VIP photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'vip-photos'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete VIP photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'vip-photos'
    AND public.has_role(auth.uid(), 'admin')
  );
