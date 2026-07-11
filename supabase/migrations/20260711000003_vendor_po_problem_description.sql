-- Vendor PO optional columns (v1.14.7–1.14.9)
ALTER TABLE vendor_po_records ADD COLUMN IF NOT EXISTS source_file_hash TEXT;
ALTER TABLE vendor_po_records ADD COLUMN IF NOT EXISTS problem_description TEXT;
ALTER TABLE vendor_po_records ADD COLUMN IF NOT EXISTS problem_description_ru TEXT;
CREATE INDEX IF NOT EXISTS idx_vendor_po_file_hash ON vendor_po_records(company_id, source_file_hash);
