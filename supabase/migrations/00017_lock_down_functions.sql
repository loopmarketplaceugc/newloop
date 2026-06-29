-- Trigger/helper functions are invoked by the trigger mechanism (as the table
-- owner) or by other SECURITY DEFINER functions — never directly via the REST
-- API. Revoke all client EXECUTE so they aren't exposed as RPC endpoints.
revoke execute on function public.enforce_gig_update() from public, anon, authenticated;
revoke execute on function public.notify_on_message() from public, anon, authenticated;
revoke execute on function public.notify_on_gig_status() from public, anon, authenticated;
revoke execute on function public.freeze_funded_gig_price() from public, anon, authenticated;
revoke execute on function public.gig_allowed_next(gig_status) from public, anon, authenticated;
-- mint_loop_tag: ensure anon truly cannot call it (only signed-in creators mint).
revoke execute on function public.mint_loop_tag() from public, anon;
grant execute on function public.mint_loop_tag() to authenticated;
