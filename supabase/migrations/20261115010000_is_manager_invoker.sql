-- Security Advisor (lint 0029) : is_manager() n'a pas besoin de SECURITY DEFINER.
-- En invoker, elle lit public.managers sous RLS ; la politique « lecture de sa propre ligne »
-- suffit à renvoyer le statut de l'appelant, et seulement le sien.
alter function public.is_manager() security invoker;
