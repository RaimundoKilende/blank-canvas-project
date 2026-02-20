-- Create chat_messages table for real-time communication
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_chat_messages_service_request ON public.chat_messages(service_request_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- RLS Policies: Only client and technician of the service can see/send messages
CREATE POLICY "Users can view messages for their service requests" 
ON public.chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.service_requests sr 
    WHERE sr.id = service_request_id 
    AND (sr.client_id = auth.uid() OR sr.technician_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages for their service requests" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.service_requests sr 
    WHERE sr.id = service_request_id 
    AND (sr.client_id = auth.uid() OR sr.technician_id = auth.uid())
  )
);

CREATE POLICY "Users can mark messages as read" 
ON public.chat_messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.service_requests sr 
    WHERE sr.id = service_request_id 
    AND (sr.client_id = auth.uid() OR sr.technician_id = auth.uid())
  )
);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;