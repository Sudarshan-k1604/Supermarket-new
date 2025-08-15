
-- Add barcode column to inventory table
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS barcode VARCHAR(255);

-- Create index on barcode for faster lookups
CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON inventory(barcode);
