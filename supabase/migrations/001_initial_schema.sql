-- AS/NZS Test Results Manager — Schema
-- Run in: Supabase Dashboard -> SQL Editor
create extension if not exists "uuid-ossp";
create table if not exists public.test_records (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'Draft' check (status in ('Draft','Complete','Archived')),
  date text, address_location text, switchboard_number text, contractor_name text,
  contractor_number text, worker_name text, licence_number text, client_email text,
  psc_at_main_switch text, live_parts_screened text, main_link_neutral_reconnected text,
  msb_men_compliant text, msb_max_demand text, msb_main_switch_current_rating text,
  msb_main_switch_psc_rating text, msb_conductor_ccc text, msb_conductor_size text,
  msb_earth_cont_main text, msb_earth_cont_eq text, msb_polarity text,
  msb_ins_res_ae text, msb_ins_res_an text, msb_ins_res_ne text, msb_ins_res_pp text,
  msb_circuit_length text, msb_comments text,
  test_equip1_type text, test_equip1_serial text, test_equip1_cal_date text,
  test_equip2_type text, test_equip2_serial text, test_equip2_cal_date text,
  test_equip3_type text, test_equip3_serial text, test_equip3_cal_date text,
  test_equip4_type text, test_equip4_serial text, test_equip4_cal_date text,
  company_name text, company_abn text, company_phone text, company_address text,
  signature_data text, notes text, share_token text unique,
  mains_circuits jsonb default '[]'::jsonb, sub_circuits jsonb default '[]'::jsonb
);
create or replace function public.handle_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger on_test_record_updated before update on public.test_records for each row execute procedure public.handle_updated_at();
alter table public.test_records enable row level security;
create policy "Users can manage own records" on public.test_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Public share token read" on public.test_records for select using (share_token is not null);
create index if not exists idx_test_records_user_id on public.test_records(user_id);
create index if not exists idx_test_records_updated_at on public.test_records(updated_at desc);
create index if not exists idx_test_records_share_token on public.test_records(share_token) where share_token is not null;