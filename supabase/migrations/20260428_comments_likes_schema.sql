-- Create comments table
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_name text,
  user_email text,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'approved' check (status in ('pending', 'approved', 'spam'))
);

-- Create likes table
create table if not exists public.likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  ip_address text, -- To prevent multiple likes from same person
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, ip_address)
);

-- Enable RLS
alter table public.comments enable row level security;
alter table public.likes enable row level security;

-- Policies for comments
create policy "Allow public to read approved comments"
  on public.comments for select
  using (status = 'approved');

create policy "Allow public to insert comments"
  on public.comments for insert
  with check (true);

-- Policies for likes
create policy "Allow public to read likes"
  on public.likes for select
  using (true);

create policy "Allow public to insert likes"
  on public.likes for insert
  with check (true);

-- Indexes for performance
create index if not exists comments_post_id_idx on public.comments(post_id);
create index if not exists likes_post_id_idx on public.likes(post_id);
