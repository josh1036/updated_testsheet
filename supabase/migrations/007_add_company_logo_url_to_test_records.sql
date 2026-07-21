-- Fix: add company_logo_url column to test_records table.
-- This column was referenced in records.js (toDb/fromDb) but never added to the table,
-- causing "Could not find the 'company_logo_url' column of 'test_records' in the schema cache" errors.
ALTER TABLE test_records ADD COLUMN IF NOT EXISTS company_logo_url text;
