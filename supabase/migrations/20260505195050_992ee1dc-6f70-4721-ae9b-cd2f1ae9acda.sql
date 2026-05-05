
REVOKE EXECUTE ON FUNCTION public.invoke_send_email(text,text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_pending_followups() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_email_pagamento_confirmado() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_email_pedido_status() FROM PUBLIC, anon, authenticated;
