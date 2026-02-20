
CREATE TABLE public.vendor_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  client_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their vendor chat messages"
ON public.vendor_chat_messages FOR SELECT
USING (auth.uid() = client_id OR auth.uid() = vendor_id);

CREATE POLICY "Users can send vendor chat messages"
ON public.vendor_chat_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id AND (auth.uid() = client_id OR auth.uid() = vendor_id));

CREATE POLICY "Users can mark vendor chat messages as read"
ON public.vendor_chat_messages FOR UPDATE
USING (auth.uid() = client_id OR auth.uid() = vendor_id);

CREATE POLICY "Admins can manage vendor chat messages"
ON public.vendor_chat_messages FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_chat_messages;
