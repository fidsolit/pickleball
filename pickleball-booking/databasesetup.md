-- ============================================================
-- PICKLEBALL RESERVATION SYSTEM
-- SUPABASE DATABASE SCHEMA
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. BRANCHES
-- ============================================================

create table if not exists public.branches (
id uuid primary key default gen_random_uuid(),
name text not null,
address text,
phone text,
email text,
opening_time time not null default '06:00',
closing_time time not null default '22:00',
status text not null default 'active'
check (status in ('active', 'inactive')),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. PROFILES
-- Connected to Supabase Auth
-- ============================================================

create table if not exists public.profiles (
id uuid primary key references auth.users(id) on delete cascade,
full_name text,
phone text,
email text,
role text not null default 'customer'
check (role in ('customer', 'admin')),
avatar_url text,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
);

-- ============================================================
-- 3. COURTS
-- ============================================================

create table if not exists public.courts (
id uuid primary key default gen_random_uuid(),

    branch_id uuid not null
        references public.branches(id)
        on delete restrict,

    name text not null,
    description text,
    location text,
    image_url text,

    hourly_rate numeric(10,2) not null default 300
        check (hourly_rate >= 0),

    status text not null default 'available'
        check (status in ('available', 'maintenance', 'inactive')),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique(branch_id, name)

);

-- ============================================================
-- 4. TIME SLOTS
-- ============================================================

create table if not exists public.time_slots (
id uuid primary key default gen_random_uuid(),

    start_time time not null,
    end_time time not null,

    status text not null default 'active'
        check (status in ('active', 'inactive')),

    created_at timestamptz not null default now(),

    check (end_time > start_time),

    unique(start_time, end_time)

);

-- ============================================================
-- 5. RESERVATIONS
-- ============================================================

create table if not exists public.reservations (
id uuid primary key default gen_random_uuid(),

    booking_reference text not null unique,

    user_id uuid not null
        references public.profiles(id)
        on delete restrict,

    court_id uuid not null
        references public.courts(id)
        on delete restrict,

    time_slot_id uuid not null
        references public.time_slots(id)
        on delete restrict,

    reservation_date date not null,

    status text not null default 'confirmed'
        check (
            status in (
                'pending',
                'confirmed',
                'cancelled',
                'completed',
                'no_show'
            )
        ),

    total_amount numeric(10,2) not null
        check (total_amount >= 0),

    payment_status text not null default 'unpaid'
        check (
            payment_status in (
                'unpaid',
                'pending',
                'paid',
                'rejected',
                'refunded'
            )
        ),

    notes text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- Prevent booking dates in the past
    check (reservation_date >= current_date)

);

-- ============================================================
-- DOUBLE BOOKING PROTECTION
-- ============================================================

-- PostgreSQL partial unique index:
-- Only active reservations occupy the slot.
-- Cancelled reservations can be booked again.

create unique index if not exists
reservations_no_double_booking
on public.reservations (
court_id,
reservation_date,
time_slot_id
)
where status <> 'cancelled';

-- ============================================================
-- 6. PAYMENTS
-- ============================================================

create table if not exists public.payments (
id uuid primary key default gen_random_uuid(),

    reservation_id uuid not null
        references public.reservations(id)
        on delete cascade,

    user_id uuid not null
        references public.profiles(id)
        on delete restrict,

    amount numeric(10,2) not null
        check (amount >= 0),

    payment_method text not null
        check (
            payment_method in (
                'cash',
                'gcash',
                'bank_transfer',
                'online'
            )
        ),

    reference_number text,

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'paid',
                'rejected',
                'refunded'
            )
        ),

    proof_url text,

    paid_at timestamptz,

    created_at timestamptz not null default now()

);

-- ============================================================
-- 7. FACILITY SETTINGS
-- ============================================================

create table if not exists public.facility_settings (
id uuid primary key default gen_random_uuid(),

    branch_id uuid not null unique
        references public.branches(id)
        on delete cascade,

    cancellation_hours integer not null default 2
        check (cancellation_hours >= 0),

    booking_limit_per_day integer
        check (booking_limit_per_day is null or booking_limit_per_day > 0),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()

);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_courts_branch
on public.courts(branch_id);

create index if not exists idx_courts_status
on public.courts(status);

create index if not exists idx_reservations_user
on public.reservations(user_id);

create index if not exists idx_reservations_date
on public.reservations(reservation_date);

create index if not exists idx_reservations_court_date
on public.reservations(court_id, reservation_date);

create index if not exists idx_reservations_status
on public.reservations(status);

create index if not exists idx_payments_reservation
on public.payments(reservation_id);

-- ============================================================
-- UPDATED_AT FUNCTION
-- ============================================================

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
new.updated_at = now();
return new;
end;

$$
;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

drop trigger if exists branches_updated_at on public.branches;

create trigger branches_updated_at
before update on public.branches
for each row
execute function public.update_updated_at();


drop trigger if exists profiles_updated_at on public.profiles;

create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at();


drop trigger if exists courts_updated_at on public.courts;

create trigger courts_updated_at
before update on public.courts
for each row
execute function public.update_updated_at();


drop trigger if exists reservations_updated_at on public.reservations;

create trigger reservations_updated_at
before update on public.reservations
for each row
execute function public.update_updated_at();


drop trigger if exists facility_settings_updated_at
on public.facility_settings;

create trigger facility_settings_updated_at
before update on public.facility_settings
for each row
execute function public.update_updated_at();

-- ============================================================
-- AUTOMATIC PROFILE CREATION
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as
$$

begin

    insert into public.profiles (
        id,
        full_name,
        phone,
        email
    )
    values (
        new.id,
        coalesce(
            new.raw_user_meta_data ->> 'full_name',
            ''
        ),
        coalesce(
            new.raw_user_meta_data ->> 'phone',
            ''
        ),
        new.email
    );

    return new;

end;

$$
;

drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ============================================================
-- ADMIN CHECK FUNCTION
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as
$$

    select exists (
        select 1
        from public.profiles
        where id = auth.uid()
        and role = 'admin'
    );

$$
;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.courts enable row level security;
alter table public.time_slots enable row level security;
alter table public.reservations enable row level security;
alter table public.payments enable row level security;
alter table public.facility_settings enable row level security;

-- ============================================================
-- BRANCH POLICIES
-- ============================================================

create policy "Anyone can view active branches"
on public.branches
for select
using (status = 'active' or public.is_admin());

create policy "Admins manage branches"
on public.branches
for all
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- PROFILE POLICIES
-- ============================================================

create policy "Users can view own profile"
on public.profiles
for select
using (
    id = auth.uid()
    or public.is_admin()
);

create policy "Users can update own profile"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Admins manage profiles"
on public.profiles
for all
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- COURT POLICIES
-- ============================================================

create policy "Anyone can view active courts"
on public.courts
for select
using (
    status = 'available'
    or public.is_admin()
);

create policy "Admins manage courts"
on public.courts
for all
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- TIME SLOT POLICIES
-- ============================================================

create policy "Anyone can view active time slots"
on public.time_slots
for select
using (
    status = 'active'
    or public.is_admin()
);

create policy "Admins manage time slots"
on public.time_slots
for all
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- RESERVATION POLICIES
-- ============================================================

create policy "Users can view own reservations"
on public.reservations
for select
using (
    user_id = auth.uid()
    or public.is_admin()
);

create policy "Users can create reservations"
on public.reservations
for insert
with check (
    user_id = auth.uid()
);

create policy "Users can cancel own reservations"
on public.reservations
for update
using (
    user_id = auth.uid()
    or public.is_admin()
)
with check (
    user_id = auth.uid()
    or public.is_admin()
);

create policy "Admins manage reservations"
on public.reservations
for all
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- PAYMENT POLICIES
-- ============================================================

create policy "Users view own payments"
on public.payments
for select
using (
    user_id = auth.uid()
    or public.is_admin()
);

create policy "Users create own payments"
on public.payments
for insert
with check (
    user_id = auth.uid()
);

create policy "Admins manage payments"
on public.payments
for all
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- FACILITY SETTINGS
-- ============================================================

create policy "Users can view facility settings"
on public.facility_settings
for select
using (true);

create policy "Admins manage facility settings"
on public.facility_settings
for all
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- SEED BRANCH
-- ============================================================

insert into public.branches (
    name,
    address,
    phone,
    status
)
select
    'Main Branch',
    'Main Pickleball Facility',
    '',
    'active'
where not exists (
    select 1
    from public.branches
);

-- ============================================================
-- SEED COURTS
-- ============================================================

insert into public.courts (
    branch_id,
    name,
    description,
    hourly_rate,
    status
)
select
    b.id,
    v.name,
    v.description,
    v.price,
    'available'
from public.branches b
cross join (
    values
        ('Court 1', 'Standard Pickleball Court', 300::numeric),
        ('Court 2', 'Standard Pickleball Court', 300::numeric),
        ('Court 3', 'Premium Pickleball Court', 350::numeric),
        ('Court 4', 'Premium Pickleball Court', 350::numeric)
) as v(name, description, price)
where b.name = 'Main Branch'
and not exists (
    select 1
    from public.courts c
    where c.branch_id = b.id
);

-- ============================================================
-- SEED TIME SLOTS
-- ============================================================

insert into public.time_slots (
    start_time,
    end_time
)
select
    v.start_time::time,
    v.end_time::time
from (
    values
        ('06:00', '07:00'),
        ('07:00', '08:00'),
        ('08:00', '09:00'),
        ('09:00', '10:00'),
        ('10:00', '11:00'),
        ('11:00', '12:00'),
        ('13:00', '14:00'),
        ('14:00', '15:00'),
        ('15:00', '16:00'),
        ('16:00', '17:00'),
        ('17:00', '18:00'),
        ('18:00', '19:00'),
        ('19:00', '20:00'),
        ('20:00', '21:00'),
        ('21:00', '22:00')
) as v(start_time, end_time)
where not exists (
    select 1
    from public.time_slots ts
    where ts.start_time = v.start_time::time
    and ts.end_time = v.end_time::time
);

-- ============================================================
-- CREATE FACILITY SETTINGS
-- ============================================================

insert into public.facility_settings (
    branch_id,
    cancellation_hours,
    booking_limit_per_day
)
select
    id,
    2,
    3
from public.branches
where not exists (
    select 1
    from public.facility_settings fs
    where fs.branch_id = public.branches.id
);

-- ============================================================
-- DONE
-- ============================================================
$$
