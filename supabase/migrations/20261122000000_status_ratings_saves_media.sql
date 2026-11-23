-- ─────────────────────────────────────────────────────────────
-- Round 2: creator status, pitch, Cloutlet ratings, saved posts, the bell (job updates),
-- and photo/video slideshows on job posts.
-- ─────────────────────────────────────────────────────────────

-- ---------- Profiles: status, pitch, rating ----------
-- availability: like LinkedIn's "Open to work". open = wants paid work now (ranked higher).
alter table public.profiles
  add column availability text not null default 'open' check (availability in ('open', 'networking', 'closed')),
  add column pitch text not null default '',  -- creators: job-message pitch · businesses: default collab message
  add column services text[] not null default '{reel,maps,stories}'
    check (cardinality(services) > 0 and services <@ array['reel', 'maps', 'stories']),
  add column rating_avg numeric(2, 1),          -- set by the reviews trigger below, never by the app
  add column rating_count integer not null default 0;

grant insert (availability, pitch, services) on public.profiles to authenticated;
grant update (availability, pitch, services) on public.profiles to authenticated;

-- ---------- Job post photos/videos (up to 10) ----------
-- [{ "uri": "https://...", "type": "image" | "video" }, ...]
alter table public.posts
  add column media jsonb not null default '[]'::jsonb
  check (jsonb_typeof(media) = 'array' and jsonb_array_length(media) <= 10);
grant insert (media) on public.posts to authenticated;

-- ---------- Saved posts (creators bookmark jobs) ----------
create table public.saved_posts (
  profile_id uuid not null references public.profiles on delete cascade,
  post_id uuid not null references public.posts on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, post_id)
);
alter table public.saved_posts enable row level security;
create policy "See your saves" on public.saved_posts for select to authenticated using (profile_id = auth.uid());
create policy "Save as yourself" on public.saved_posts for insert to authenticated with check (profile_id = auth.uid());
create policy "Unsave your own" on public.saved_posts for delete to authenticated using (profile_id = auth.uid());

-- ---------- Bell: creators follow a business to hear about new jobs ----------
create table public.follows (
  creator_id uuid not null references public.profiles on delete cascade,
  business_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (creator_id, business_id)
);
alter table public.follows enable row level security;
create policy "See your follows" on public.follows for select to authenticated using (creator_id = auth.uid());
create policy "Follow as yourself" on public.follows for insert to authenticated with check (
  creator_id = auth.uid()
  and exists (select 1 from public.profiles where id = business_id and role = 'business')
);
create policy "Unfollow your own" on public.follows for delete to authenticated using (creator_id = auth.uid());

-- Job updates: one row per follower when a business posts a job (Inbox > Updates)
create table public.job_alerts (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles on delete cascade,
  post_id uuid not null references public.posts on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index job_alerts_recipient on public.job_alerts (recipient_id, created_at desc);
alter table public.job_alerts enable row level security;
create policy "See your updates" on public.job_alerts for select to authenticated using (recipient_id = auth.uid());
create policy "Mark your updates read" on public.job_alerts for update to authenticated using (recipient_id = auth.uid());
revoke update on public.job_alerts from authenticated;
grant update (read_at) on public.job_alerts to authenticated;

create function public.send_job_alerts() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'job' then
    insert into job_alerts (recipient_id, post_id)
      select creator_id, new.id from follows where business_id = new.author_id;
  end if;
  return new;
end $$;
create trigger posts_send_job_alerts after insert on public.posts
  for each row execute function public.send_job_alerts();

alter publication supabase_realtime add table public.job_alerts;

-- ---------- Ratings on Cloutlet ----------
-- One review per person per accepted deal. Only the two people in the deal can review each other.
-- (There's no screen to leave a review yet; this is where they'll be stored.)
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers on delete cascade,
  reviewer_id uuid not null references public.profiles on delete cascade,
  reviewee_id uuid not null references public.profiles on delete cascade,
  stars integer not null check (stars between 1 and 5),
  body text not null default '',
  created_at timestamptz not null default now(),
  unique (offer_id, reviewer_id)
);
alter table public.reviews enable row level security;
create policy "Reviews are readable" on public.reviews for select to authenticated using (true);
create policy "Review a deal you were in" on public.reviews for insert to authenticated with check (
  reviewer_id = auth.uid()
  and reviewer_id <> reviewee_id
  and exists (
    select 1 from public.offers o
    where o.id = offer_id and o.status = 'accepted'
      and auth.uid() in (o.business_id, o.creator_id)
      and reviewee_id in (o.business_id, o.creator_id)
  )
);

-- Keep each profile's average and count up to date
create function public.refresh_rating() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update profiles p set
    rating_avg = (select round(avg(stars)::numeric, 1) from reviews where reviewee_id = p.id),
    rating_count = (select count(*) from reviews where reviewee_id = p.id)
  where p.id = coalesce(new.reviewee_id, old.reviewee_id);
  return null;
end $$;
create trigger reviews_refresh_rating after insert or update or delete on public.reviews
  for each row execute function public.refresh_rating();
