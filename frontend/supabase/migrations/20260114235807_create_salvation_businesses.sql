-- Create salvation_businesses table
CREATE TABLE salvation_businesses (
  wallet_address TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  description TEXT,
  founding_date DATE,
  cover_image_url TEXT,
  pfp_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS (using service role key)
ALTER TABLE salvation_businesses DISABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION salvation_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER salvation_businesses_updated_at
  BEFORE UPDATE ON salvation_businesses
  FOR EACH ROW
  EXECUTE FUNCTION salvation_update_updated_at();
