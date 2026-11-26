-- Deals are agreed in three steps, all inside the chat:
--   1. One side proposes terms                       status = 'pending'
--   2. The other side accepts those exact terms      status = 'agreed'    (respond_offer 'agreed')
--   3. The side that proposed them confirms          status = 'accepted'  (confirm_offer)
-- 'accepted' still means "deal done", so collab tags, reviews and collab counts work as before.
-- Opening a chat or sending a message never changes an offer.

alter table public.offers drop constraint if exists offers_status_check;
alter table public.offers add constraint offers_status_check
  check (status in ('pending', 'agreed', 'accepted', 'declined'));

alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages add constraint messages_kind_check
  check (kind in ('text', 'offer', 'counter', 'agreed', 'accepted', 'declined'));

-- Step 2 (or say no). Only the side that didn't propose the terms can accept them.
-- Either side can decline while the offer is open, including while it waits for confirmation.
create or replace function public.respond_offer(offer uuid, answer text) returns void
language plpgsql security definer set search_path = public as $$
declare
  o offers;
  my_role text;
begin
  if answer not in ('agreed', 'declined') then raise exception 'Bad answer'; end if;
  select * into o from offers where id = offer for update;
  select role into my_role from profiles where id = auth.uid();
  if o.id is null or auth.uid() not in (o.business_id, o.creator_id) then raise exception 'Not your offer'; end if;
  if answer = 'agreed' then
    if o.status <> 'pending' then raise exception 'This offer is not waiting on you'; end if;
    if o.last_proposed_by = my_role then raise exception 'Waiting on the other side'; end if;
  elsif o.status not in ('pending', 'agreed') then
    raise exception 'This offer is closed';
  end if;
  update offers set status = answer, updated_at = now() where id = offer;
  insert into messages (thread_id, sender_id, kind, body, price, perks)
    values (o.thread_id, auth.uid(), answer, case when answer = 'agreed' then 'Terms accepted' else 'Declined' end, o.price, o.perks);
end $$;

-- Step 3. The side that proposed the terms confirms them. This is the moment the deal is made.
create or replace function public.confirm_offer(offer uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  o offers;
  my_role text;
begin
  select * into o from offers where id = offer for update;
  select role into my_role from profiles where id = auth.uid();
  if o.id is null or auth.uid() not in (o.business_id, o.creator_id) then raise exception 'Not your offer'; end if;
  if o.status <> 'agreed' then raise exception 'The other side has not accepted these terms yet'; end if;
  if o.last_proposed_by <> my_role then raise exception 'Only the side that made the offer confirms it'; end if;
  update offers set status = 'accepted', updated_at = now() where id = offer;
  insert into messages (thread_id, sender_id, kind, body, price, perks)
    values (o.thread_id, auth.uid(), 'accepted', 'Deal', o.price, o.perks);
  update profiles set collabs = collabs + 1 where id in (o.business_id, o.creator_id);
end $$;

grant execute on function public.confirm_offer(uuid) to authenticated;
