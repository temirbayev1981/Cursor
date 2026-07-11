-- Vendor PO problem description columns (v1.14.8+)
ALTER TABLE vendor_po_records ADD COLUMN IF NOT EXISTS problem_description TEXT;
ALTER TABLE vendor_po_records ADD COLUMN IF NOT EXISTS problem_description_ru TEXT;
