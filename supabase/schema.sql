-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Public User Data)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MEETINGS (Room Metadata)
create table meetings (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  title text not null,
  host_id uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone,
  settings jsonb default '{}'::jsonb -- Stores room settings like languages, audio/video defaults
);

-- PARTICIPANTS (Active Users in Meeting)
create table participants (
  id uuid default uuid_generate_v4() primary key,
  meeting_id uuid references meetings(id) on delete cascade not null,
  user_id uuid references profiles(id), -- Nullable for guests if we support them later
  name text not null,
  role text default 'attendee', -- host, attendee, observer
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  left_at timestamp with time zone,
  status text default 'online' -- online, offline, idle
);

-- MESSAGES (Chat History)
create table messages (
  id uuid default uuid_generate_v4() primary key,
  meeting_id uuid references meetings(id) on delete cascade not null,
  sender_id uuid references profiles(id),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  type text default 'text' -- text, system, alert
);

-- RLS POLICIES
alter table profiles enable row level security;
alter table meetings enable row level security;
alter table participants enable row level security;
alter table messages enable row level security;

-- Profiles: Public read, Self update
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Meetings: Viewable by everyone (or restricted by code logic in app), Host can update
create policy "Meetings are viewable by everyone" on meetings for select using (true);
create policy "Hosts can insert meetings" on meetings for insert with check (auth.uid() = host_id);
create policy "Hosts can update meetings" on meetings for update using (auth.uid() = host_id);

-- Participants: Viewable by everyone in the meeting
create policy "Participants are viewable by everyone" on participants for select using (true);
create policy "Users can join as participants" on participants for insert with check (true);

-- Messages: Viewable by participants
create policy "Messages are viewable by everyone" on messages for select using (true);
create policy "Authenticated users can post messages" on messages for insert with check (auth.role() = 'authenticated');

-- FUNCTIONS & TRIGGERS

-- Auto-create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
