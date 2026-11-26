-- ─────────────────────────────────────────────────────────────
-- Hiring posts with real details, applications, editing posts, chats that start on send,
-- and businesses revising their open offer instead of sending a second one.
-- ─────────────────────────────────────────────────────────────

-- ---------- Job post details ----------
alter table public.posts
  add column job_description text check (char_length(job_description) <= 2000),
  add column job_quantity integer not null default 1 check (job_quantity between 1 and 20),
  add column job_deadline date,
  add column job_timeframe text check (char_length(job_timeframe) <= 40),
  add column job_hires integer check (job_hires between 1 and 50),  -- null = not decided
  add column application_count integer not null default 0;          -- set by the trigger below, never by the app

grant insert (job_description, job_quantity, job_deadline, job_timeframe, job_hires) on public.posts to authenticated;

-- Businesses can edit their own job posts (not likes, views, kind, author or the count)
create policy "Edit your own posts" on public.posts for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
grant update (caption, image_url, media, job_service, job_budget, job_perks, job_post_by,
              job_description, job_quantity, job_deadline, job_timeframe, job_hires)
  on public.posts to authenticated;

-- ---------- Offers: how many of the format ----------
alter table public.offers add column quantity integer not null default 1 check (quantity between 1 and 20);

-- ---------- Applications ----------
-- One row per creator per post, written only by apply_to_post, i.e. only when the creator
-- actually sends the application message. Opening the Apply screen writes nothing.
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  creator_id uuid not null references public.profiles on delete cascade,
  business_id uuid not null references public.profiles on delete cascade,
  thread_id uuid not null references public.threads on delete cascade,
  message_id uuid references public.messages on delete set null,
  created_at timestamptz not null default now(),
  unique (post_id, creator_id)
);
create index applications_business on public.applications (business_id, created_at desc);
create index applications_thread on public.applications (thread_id);

alter table public.applications enable row level security;
create policy "See applications you sent or received" on public.applications for select to authenticated
  using (auth.uid() in (creator_id, business_id));

-- Application messages say which post they're for
alter table public.messages add column post_id uuid references public.posts on delete set null;
alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages add constraint messages_kind_check
  check (kind in ('text', 'application', 'offer', 'counter', 'agreed', 'accepted', 'declined'));

create function public.bump_application_count() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update posts set application_count = application_count + 1 where id = new.post_id;
  else
    update posts set application_count = greatest(application_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end $$;
create trigger application_counted after insert or delete on public.applications
  for each row execute function public.bump_application_count();

-- ---------- Chats start when the first message is sent ----------
-- open_thread is no longer called by the app on its own: opening a chat screen creates nothing.
revoke execute on function public.open_thread(uuid) from authenticated, anon, public;

create function public.start_chat(other uuid, body text) returns uuid
language plpgsql security definer set search_path = public as $$
declare tid uuid;
begin
  if coalesce(trim(body), '') = '' then raise exception 'Write a message'; end if;
  tid := open_thread(other);
  insert into messages (thread_id, sender_id, kind, body) values (tid, auth.uid(), 'text', body);
  return tid;
end $$;
grant execute on function public.start_chat(uuid, text) to authenticated;

-- A creator applies to a job post: message + application, together
create function public.apply_to_post(post uuid, message text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  p posts;
  tid uuid;
  mid uuid;
begin
  if (select role from profiles where id = auth.uid()) <> 'creator' then raise exception 'Only creators apply to jobs'; end if;
  select * into p from posts where id = post;
  if p.id is null or p.kind <> 'job' then raise exception 'Job post not found'; end if;
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
grant execute on function public.apply_to_post(uuid, text) to authenticated;

-- ---------- Offers ----------
-- create_offer now takes how many, and refuses a second open offer to the same creator
drop function if exists public.create_offer(uuid, text, integer, text[], text, text);
create function public.create_offer(
  creator uuid, service text, quantity integer, price integer, perks text[], post_by text, message text
) returns public.offers
language plpgsql security definer set search_path = public as $$
declare
  tid uuid;
  o offers;
begin
  if (select role from profiles where id = auth.uid()) <> 'business' then
    raise exception 'Only businesses send offers';
  end if;
  if exists (select 1 from offers where business_id = auth.uid() and creator_id = creator and status in ('pending', 'agreed')) then
    raise exception 'You already have an open offer with them. Update it instead.';
  end if;
  tid := open_thread(creator);
  insert into offers (business_id, creator_id, service_id, quantity, price, perks, post_by, last_proposed_by, thread_id)
    values (auth.uid(), creator, service, quantity, price, perks, post_by, 'business', tid)
    returning * into o;
  update threads set offer_id = o.id where id = tid;
  insert into messages (thread_id, sender_id, kind, body, price, perks)
    values (tid, auth.uid(), 'offer', message, price, perks);
  return o;
end $$;
grant execute on function public.create_offer(uuid, text, integer, integer, text[], text, text) to authenticated;

-- The business changes the terms of its open offer. Same offer; it goes back to waiting on the
-- creator, who has to accept the new terms before the business can confirm.
create function public.revise_offer(
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
  insert into messages (thread_id, sender_id, kind, body, price, perks)
    values (o.thread_id, auth.uid(), 'counter', coalesce(nullif(trim(note), ''), 'New terms'), revise_offer.price, revise_offer.perks);
end $$;
grant execute on function public.revise_offer(uuid, text, integer, integer, text[], text, text) to authenticated;

-- Creators don't send structured counteroffers (they talk terms in messages)
revoke execute on function public.counter_offer(uuid, integer, text[], text) from authenticated, anon, public;

alter publication supabase_realtime add table public.applications;
