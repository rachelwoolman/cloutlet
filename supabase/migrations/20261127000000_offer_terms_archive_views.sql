-- ─────────────────────────────────────────────────────────────
-- Offers made from a job post, full terms on every offer message (so each version is readable),
-- archiving job posts, and counting job post views.
-- ─────────────────────────────────────────────────────────────

-- ---------- Archive job posts ----------
alter table public.posts add column archived boolean not null default false;
grant update (archived) on public.posts to authenticated;

-- ---------- Views ----------
-- One row per person per post per day, written only by record_post_view.
-- A view = the post was on screen in the full-screen viewer. Feed tiles don't count.
alter table public.posts add column view_count integer not null default 0; -- set below, never by the app
create table public.post_views (
  post_id uuid not null references public.posts on delete cascade,
  viewer_id uuid not null references public.profiles on delete cascade,
  day date not null default current_date,
  primary key (post_id, viewer_id, day)
);
alter table public.post_views enable row level security; -- no policies: only record_post_view writes; nobody reads rows

create function public.record_post_view(post uuid) returns void
language plpgsql security definer set search_path = public as $$
declare inserted int;
begin
  if not exists (select 1 from posts where id = post and kind = 'job' and author_id <> auth.uid()) then return; end if;
  insert into post_views (post_id, viewer_id) values (post, auth.uid()) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted > 0 then update posts set view_count = view_count + 1 where id = post; end if;
end $$;
grant execute on function public.record_post_view(uuid) to authenticated;

-- ---------- Offers: which post, and full terms on messages ----------
alter table public.offers add column post_id uuid references public.posts on delete set null;
alter table public.messages
  add column service_id text check (service_id in ('reel', 'maps', 'stories')),
  add column quantity integer,
  add column post_by text;

drop function if exists public.create_offer(uuid, text, integer, integer, text[], text, text);
create function public.create_offer(
  creator uuid, post uuid, service text, quantity integer, price integer, perks text[], post_by text, message text
) returns public.offers
language plpgsql security definer set search_path = public as $$
declare
  tid uuid;
  o offers;
begin
  if (select role from profiles where id = auth.uid()) <> 'business' then
    raise exception 'Only businesses send offers';
  end if;
  if post is not null and not exists (select 1 from posts where id = post and author_id = auth.uid()) then
    raise exception 'Not your job post';
  end if;
  if exists (select 1 from offers where business_id = auth.uid() and creator_id = creator and status in ('pending', 'agreed')) then
    raise exception 'You already have an open offer with them. Update it instead.';
  end if;
  tid := open_thread(creator);
  insert into offers (business_id, creator_id, post_id, service_id, quantity, price, perks, post_by, last_proposed_by, thread_id)
    values (auth.uid(), creator, post, service, quantity, price, perks, post_by, 'business', tid)
    returning * into o;
  update threads set offer_id = o.id where id = tid;
  insert into messages (thread_id, sender_id, kind, body, service_id, quantity, price, perks, post_by, post_id)
    values (tid, auth.uid(), 'offer', coalesce(trim(message), ''), service, quantity, price, perks, post_by, post);
  return o;
end $$;
grant execute on function public.create_offer(uuid, uuid, text, integer, integer, text[], text, text) to authenticated;

create or replace function public.revise_offer(
  offer uuid, service text, quantity integer, price integer, perks text[], post_by text, note text
) returns void
language plpgsql security definer set search_path = public as $$
declare o offers;
begin
  select * into o from offers where id = offer for update;
  if o.id is null or o.business_id <> auth.uid() then raise exception 'Not your offer'; end if;
  if o.status not in ('pending', 'agreed') then raise exception 'This offer is closed. Send a new one.'; end if;
  update offers set service_id = service, quantity = revise_offer.quantity, price = revise_offer.price,
    perks = revise_offer.perks, post_by = revise_offer.post_by,
    status = 'pending', last_proposed_by = 'business', updated_at = now()
    where id = offer;
  insert into messages (thread_id, sender_id, kind, body, service_id, quantity, price, perks, post_by)
    values (o.thread_id, auth.uid(), 'counter', coalesce(trim(note), ''), service, revise_offer.quantity,
            revise_offer.price, revise_offer.perks, revise_offer.post_by);
end $$;

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
  insert into messages (thread_id, sender_id, kind, body, service_id, quantity, price, perks, post_by)
    values (o.thread_id, auth.uid(), answer, case when answer = 'agreed' then 'Terms accepted' else 'Declined' end,
            o.service_id, o.quantity, o.price, o.perks, o.post_by);
end $$;

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
  insert into messages (thread_id, sender_id, kind, body, service_id, quantity, price, perks, post_by)
    values (o.thread_id, auth.uid(), 'accepted', 'Deal', o.service_id, o.quantity, o.price, o.perks, o.post_by);
  update profiles set collabs = collabs + 1 where id in (o.business_id, o.creator_id);
end $$;

-- Archived job posts can't take new applications
create or replace function public.apply_to_post(post uuid, message text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  p posts;
  tid uuid;
  mid uuid;
begin
  if (select role from profiles where id = auth.uid()) <> 'creator' then raise exception 'Only creators apply to jobs'; end if;
  select * into p from posts where id = post;
  if p.id is null or p.kind <> 'job' then raise exception 'Job post not found'; end if;
  if p.archived then raise exception 'This job is closed'; end if;
  if coalesce(trim(message), '') = '' then raise exception 'Write a message to apply'; end if;
  if exists (select 1 from applications where post_id = post and creator_id = auth.uid()) then
    raise exception 'You already applied to this post';
  end if;
  tid := open_thread(p.author_id);
  insert into messages (thread_id, sender_id, kind, body, post_id)
    values (tid, auth.uid(), 'application', trim(message), post) returning id into mid;
  insert into applications (post_id, creator_id, business_id, thread_id, message_id)
    values (post, auth.uid(), p.author_id, tid, mid);
  return tid;
end $$;
