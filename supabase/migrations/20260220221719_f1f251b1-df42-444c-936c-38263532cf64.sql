
-- Create technician_comments table for public comments on technician profiles
CREATE TABLE public.technician_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technician_user_id UUID NOT NULL,
  author_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.technician_comments ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read all comments
CREATE POLICY "Anyone can view technician comments"
  ON public.technician_comments
  FOR SELECT
  USING (true);

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can add comments"
  ON public.technician_comments
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.technician_comments
  FOR DELETE
  USING (auth.uid() = author_id);

-- Admins can manage all comments
CREATE POLICY "Admins can manage all comments"
  ON public.technician_comments
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role));
