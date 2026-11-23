-- ─────────────────────────────────────────────────────────────
-- Cloutlet database (Supabase / Postgres)
-- Run with: npx supabase db push   (see SETUP.md)
--
-- Rules of thumb:
--  * Anyone signed in can read profiles and posts (it's a public feed).
--  * Only the two people in a deal can read its offer, thread and messages.
--  * Anything that changes deal terms or verification goes through a
--    function below, so nobody can edit a field they shouldn't.
-- ─────────────────────────────────────────────────────────────

-- ---------- Profiles ----------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('creator', 'business')),
  name text not null,
  handle text not null unique,
  avatar_url text,
  initials text,
  bio text not null default '',
  neighborhood text not null default '',
  lat double precision,
  lng double precision,
  -- creators
  niche text,
  followers integer,
  engagement numeric,
  reply_time text,
  open_to_perks_only boolean default false,
  -- businesses
  kind text,
  cover_url text,
  collabs integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Profiles are readable" on public.profiles for select to authenticated using (true);
create policy "Create your own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "Edit your own profile" on public.profiles for update to authenticated using (id = auth.uid());
-- Follower count, engagement and collab count are set by the server only.
-- (Column grants: people can only write the columns listed here.)
revoke insert, update on public.profiles from authenticated;
grant insert (id, role, name, handle, avatar_url, initials, bio, neighborhood, lat, lng, niche, reply_time, open_to_perks_only, kind, cover_url)
  on public.profiles to authenticated;
grant update (name, handle, avatar_url, initials, bio, neighborhood, lat, lng, niche, reply_time, open_to_perks_only, kind, cover_url)
  on public.profiles to authenticated;

-- ---------- Verification ----------
-- Written only by the oauth-callback Edge Function (service role).
create table public.social_accounts (
  profile_id uuid not null references public.profiles on delete cascade,
  platform text not null check (platform in ('instagram', 'tiktok')),
  username text not null,
  external_id text not null,
  followers integer,
  verified_at timestamptz not null default now(),
  primary key (profile_id, platform),
  unique (platform, external_id) -- one Instagram/TikTok account per Cloutlet profile
);
alter table public.social_accounts enable row level security;
create policy "Social accounts are readable" on public.social_accounts for select to authenticated using (true);

create table public.google_listings (
  profile_id uuid primary key references public.profiles on delete cascade,
  place_id text not null unique,
  address text not null,
  rating numeric,
  review_count integer,
  owner_verified boolean not null default false,
  verified_at timestamptz
);
alter table public.google_listings enable row level security;
create policy "Listings are readable" on public.google_listings for select to authenticated using (true);

-- One-time codes that link an OAuth round trip back to the user who started it
create table public.oauth_states (
  state text primary key,
  profile_id uuid not null references public.profiles on delete cascade,
  provider text not null,
  return_to text not null,
  created_at timestamptz not null default now()
);
alter table public.oauth_states enable row level security; -- no policies: Edge Functions only

-- ---------- Posts (videos and job posts) ----------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('video', 'job')),
  author_id uuid not null references public.profiles on delete cascade,
  caption text not null default '',
  image_url text,
  video_url text,
  duration text,
  likes integer not null default 0,
  views integer not null default 0,
  collab_business_id uuid references public.profiles,
  collab_creator_id uuid references public.profiles,
  job_service text check (job_service in ('reel', 'maps', 'stories')),
  job_budget integer,
  job_perks text[] not null default '{}',
  job_post_by text,
  created_at timestamptz not null default now()
);
create index posts_created_at on public.posts (created_at desc);
create index posts_author on public.posts (author_id);

alter table public.posts enable row level security;
create policy "Posts are readable" on public.posts for select to authenticated using (true);
create policy "Post as yourself" on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy "Delete your own posts" on public.posts for delete to authenticated using (author_id = auth.uid());
-- Likes and views are counted by the server, not set by the poster
revoke insert, update on public.posts from authenticated;
grant insert (kind, author_id, caption, image_url, video_url, duration, collab_business_id, collab_creator_id, job_service, job_budget, job_perks, job_post_by)
  on public.posts to authenticated;

-- A post can only tag a collab partner if they really closed a deal on Cloutlet
create function public.check_collab_tag() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.collab_business_id is not null and not exists (
    select 1 from offers where status = 'accepted'
      and creator_id = new.author_id and business_id = new.collab_business_id
  ) then
    raise exception 'You can only tag a business you have an accepted collab with';
  end if;
  if new.collab_creator_id is not null and not exists (
    select 1 from offers where status = 'accepted'
      and business_id = new.author_id and creator_id = new.collab_creator_id
  ) then
    raise exception 'You can only tag a creator you have an accepted collab with';
  end if;
  return new;
end $$;

create table public.post_likes (
  post_id uuid not null references public.posts on delete cascade,
  profile_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);
alter table public.post_likes enable row level security;
create policy "Like as yourself" on public.post_likes for insert to authenticated with check (profile_id = auth.uid());
create policy "See your likes" on public.post_likes for select to authenticated using (profile_id = auth.uid());

create function public.bump_likes() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update posts set likes = likes + 1 where id = new.post_id;
  return new;
end $$;
create trigger post_liked after insert on public.post_likes for each row execute function public.bump_likes();

-- ---------- Threads, offers, messages ----------
create table public.threads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles on delete cascade,
  creator_id uuid not null references public.profiles on delete cascade,
  offer_id uuid,
  last_message text,
  updated_at timestamptz not null default now(),
  unique (business_id, creator_id)
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles on delete cascade,
  creator_id uuid not null references public.profiles on delete cascade,
  service_id text not null check (service_id in ('reel', 'maps', 'stories')),
  price integer not null check (price >= 0),
  perks text[] not null default '{}',
  post_by text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  last_proposed_by text not null check (last_proposed_by in ('creator', 'business')),
  thread_id uuid not null references public.threads on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.threads add foreign key (offer_id) references public.offers on delete set null;

create trigger posts_check_collab before insert on public.posts for each row execute function public.check_collab_tag();

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads on delete cascade,
  sender_id uuid not null references public.profiles on delete cascade,
  kind text not null default 'text' check (kind in ('text', 'offer', 'counter', 'accepted', 'declined')),
  body text not null,
  price integer,
  perks text[],
  created_at timestamptz not null default now()
);
create index messages_thread on public.messages (thread_id, created_at);

alter table public.threads enable row level security;
alter table public.offers enable row level security;
alter table public.messages enable row level security;

create policy "See your threads" on public.threads for select to authenticated
  using (auth.uid() in (business_id, creator_id));
create policy "See your offers" on public.offers for select to authenticated
  using (auth.uid() in (business_id, creator_id));
create policy "See messages in your threads" on public.messages for select to authenticated
  using (exists (select 1 from threads t where t.id = thread_id and auth.uid() in (t.business_id, t.creator_id)));
-- Plain chat messages can be sent directly. Offer changes go through the functions below.
create policy "Send chat messages" on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid() and kind = 'text'
    and exists (select 1 from threads t where t.id = thread_id and auth.uid() in (t.business_id, t.creator_id))
  );

create function public.touch_thread() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update threads set updated_at = new.created_at, last_message = left(new.body, 140) where id = new.thread_id;
  return new;
end $$;
create trigger message_sent after insert on public.messages for each row execute function public.touch_thread();

-- ---------- Functions the app calls ----------

-- Find or start a chat with someone on the other side
create function public.open_thread(other uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me_role text;
  other_role text;
  b uuid; c uuid; tid uuid;
begin
  select role into me_role from profiles where id = auth.uid();
  select role into other_role from profiles where id = other;
  if me_role is null or other_role is null or me_role = other_role then
    raise exception 'Chats are between a creator and a business';
  end if;
  if me_role = 'business' then b := auth.uid(); c := other; else b := other; c := auth.uid(); end if;
  insert into threads (business_id, creator_id) values (b, c)
    on conflict (business_id, creator_id) do update set business_id = excluded.business_id
    returning id into tid;
  return tid;
end $$;

-- A business sends a creator an offer. Starts (or reuses) their chat.
create function public.create_offer(
  creator uuid, service text, price integer, perks text[], post_by text, message text
) returns public.offers
language plpgsql security definer set search_path = public as $$
declare
  tid uuid;
  o offers;
begin
  if (select role from profiles where id = auth.uid()) <> 'business' then
    raise exception 'Only businesses send offers';
  end if;
  tid := open_thread(creator);
  insert into offers (business_id, creator_id, service_id, price, perks, post_by, last_proposed_by, thread_id)
    values (auth.uid(), creator, service, price, perks, post_by, 'business', tid)
    returning * into o;
  update threads set offer_id = o.id where id = tid;
  insert into messages (thread_id, sender_id, kind, body, price, perks)
    values (tid, auth.uid(), 'offer', message, price, perks);
  return o;
end $$;

-- Either side proposes new terms. Only allowed when it's your turn.
create function public.counter_offer(offer uuid, new_price integer, new_perks text[], note text) returns void
language plpgsql security definer set search_path = public as $$
declare
  o offers;
  my_role text;
begin
  select * into o from offers where id = offer for update;
  select role into my_role from profiles where id = auth.uid();
  if o.id is null or auth.uid() not in (o.business_id, o.creator_id) then raise exception 'Not your offer'; end if;
  if o.status <> 'pending' then raise exception 'This offer is closed'; end if;
  if o.last_proposed_by = my_role then raise exception 'Waiting on the other side'; end if;
  update offers set price = new_price, perks = new_perks, last_proposed_by = my_role, updated_at = now() where id = offer;
  insert into messages (thread_id, sender_id, kind, body, price, perks)
    values (o.thread_id, auth.uid(), 'counter', coalesce(nullif(note, ''), 'New terms'), new_price, new_perks);
end $$;

-- Accept or decline the current terms. Only the side that didn't propose them can accept.
create function public.respond_offer(offer uuid, answer text) returns void
language plpgsql security definer set search_path = public as $$
declare
  o offers;
  my_role text;
begin
  if answer not in ('accepted', 'declined') then raise exception 'Bad answer'; end if;
  select * into o from offers where id = offer for update;
  select role into my_role from profiles where id = auth.uid();
  if o.id is null or auth.uid() not in (o.business_id, o.creator_id) then raise exception 'Not your offer'; end if;
  if o.status <> 'pending' then raise exception 'This offer is closed'; end if;
  if answer = 'accepted' and o.last_proposed_by = my_role then raise exception 'Waiting on the other side'; end if;
  update offers set status = answer, updated_at = now() where id = offer;
  insert into messages (thread_id, sender_id, kind, body, price, perks)
    values (o.thread_id, auth.uid(), answer, case when answer = 'accepted' then 'Deal' else 'Declined' end, o.price, o.perks);
  if answer = 'accepted' then
    update profiles set collabs = collabs + 1 where id in (o.business_id, o.creator_id);
  end if;
end $$;

-- A business picks its Google listing. Ownership is confirmed later by the Google OAuth check.
create function public.claim_place(
  place_id text, address text, rating numeric, review_count integer, lat double precision, lng double precision
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if (select role from profiles where id = auth.uid()) <> 'business' then
    raise exception 'Only businesses claim listings';
  end if;
  insert into google_listings (profile_id, place_id, address, rating, review_count, owner_verified)
    values (auth.uid(), place_id, address, rating, review_count, false)
    on conflict (profile_id) do update set
      place_id = excluded.place_id, address = excluded.address, rating = excluded.rating,
      review_count = excluded.review_count, owner_verified = false, verified_at = null;
  update profiles set lat = claim_place.lat, lng = claim_place.lng where id = auth.uid();
end $$;

-- ---------- Realtime (live chat and offer updates) ----------
alter publication supabase_realtime add table public.messages, public.offers, public.threads;

-- ---------- Storage for videos and photos ----------
-- Public bucket so videos stream fast. Each user uploads into a folder named after their id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 104857600, array['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']);

create policy "Upload to your own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Delete your own files" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
