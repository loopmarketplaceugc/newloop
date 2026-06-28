-- Allow both gig parties (company + creator) to update messages in their gig.
-- Required so creators can accept/decline offer messages (dbUpdateOfferState),
-- which updates body.offer.state. Without this, RLS silently blocks the UPDATE
-- and the offer state reverts to "pending" after the next DB poll.
create policy "gig parties update message" on messages for update using (is_gig_party(gig_id));
