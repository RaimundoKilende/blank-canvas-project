
CREATE OR REPLACE FUNCTION public.notify_vendor_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sender_name text;
  v_recipient_id uuid;
  v_title text;
BEGIN
  -- Get sender name
  SELECT name INTO v_sender_name FROM public.profiles WHERE user_id = NEW.sender_id LIMIT 1;
  
  -- Determine recipient (the other party)
  IF NEW.sender_id = NEW.vendor_id THEN
    v_recipient_id := NEW.client_id;
    v_title := 'Nova mensagem do vendedor';
  ELSE
    v_recipient_id := NEW.vendor_id;
    v_title := 'Nova mensagem de cliente';
  END IF;
  
  -- Insert notification for recipient
  INSERT INTO public.notifications (user_id, title, message, type, data)
  VALUES (
    v_recipient_id,
    v_title,
    COALESCE(v_sender_name, 'Usuário') || ': ' || LEFT(NEW.message, 100),
    'vendor_chat_message',
    jsonb_build_object('vendor_id', NEW.vendor_id, 'client_id', NEW.client_id, 'message_id', NEW.id)
  );
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_vendor_chat_message_insert
AFTER INSERT ON public.vendor_chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_vendor_chat_message();
