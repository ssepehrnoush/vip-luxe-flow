
-- Add user_id to link submissions to authenticated users
ALTER TABLE public.vip_submissions
  ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_vip_submissions_user_id ON public.vip_submissions(user_id);

-- Allow authenticated users to view their own submission
CREATE POLICY "Users can view own submission"
  ON public.vip_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own submission
CREATE POLICY "Users can insert own submission"
  ON public.vip_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
