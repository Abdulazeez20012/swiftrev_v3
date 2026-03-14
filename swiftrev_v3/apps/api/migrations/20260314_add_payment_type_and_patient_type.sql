-- ═══════════════════════════════════════════════════════════════
-- SwiftRev v3 - Feature Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- Date: 2026-03-14
-- ═══════════════════════════════════════════════════════════════

-- ── FEATURE 1: Payment Types on Revenue Items ─────────────────
-- Adds payment_type (cash/nhis/capitation/retainership) and
-- nhis_amount (alternative price for NHIS patients)

ALTER TABLE revenue_items
  ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS nhis_amount NUMERIC(12,2);

-- Backfill existing records (all existing items are treated as "cash")
UPDATE revenue_items SET payment_type = 'cash' WHERE payment_type IS NULL;

-- ── FEATURE 4: Patient Type Classification ────────────────────
-- Adds patient_type so we know if a patient is regular, NHIS, etc.

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS patient_type VARCHAR(20) DEFAULT 'regular';

-- Backfill existing patients
UPDATE patients SET patient_type = 'regular' WHERE patient_type IS NULL;

-- ── Optional: Add CHECK constraints for data integrity ────────
ALTER TABLE revenue_items
  ADD CONSTRAINT IF NOT EXISTS chk_payment_type
    CHECK (payment_type IN ('cash', 'nhis', 'capitation', 'retainership'));

ALTER TABLE patients
  ADD CONSTRAINT IF NOT EXISTS chk_patient_type
    CHECK (patient_type IN ('regular', 'nhis', 'retainer', 'capitation'));
