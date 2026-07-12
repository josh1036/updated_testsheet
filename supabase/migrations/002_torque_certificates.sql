-- Torque Certificates table
create table if not exists public.torque_certificates (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'Draft',
  certificate_number text, project_name text, client text, site_name text,
  site_address text, switchboard_id text, location text, work_order_number text,
  drawing_reference text, verification_date text, technician_name text,
  licence_number text, company_name text, company_abn text, company_phone text,
  company_address text, company_logo_url text, notes text, tool_type text,
  torque_wrench_manufacturer text, torque_wrench_model text, tool_serial_number text,
  calibration_cert_number text, calibration_doc_url text, torque_units text default 'Nm',
  technician_signature text, supervisor_name text, supervisor_date text,
  termination_rows jsonb default '[]'::jsonb
);
create trigger on_torque_cert_updated before update on public.torque_certificates for each row execute procedure public.handle_updated_at();
alter table public.torque_certificates enable row level security;
create policy "Users manage own torque certs" on public.torque_certificates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);