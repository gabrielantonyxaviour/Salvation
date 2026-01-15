-- Create salvation_project_applications table for pending project submissions
CREATE TABLE salvation_project_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL REFERENCES salvation_businesses(wallet_address),

  -- Project Details
  project_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,

  -- Location
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  latitude DECIMAL,
  longitude DECIMAL,

  -- Funding
  funding_goal DECIMAL NOT NULL,
  bond_price DECIMAL NOT NULL DEFAULT 1.00,
  revenue_model TEXT NOT NULL,
  projected_apy DECIMAL NOT NULL,

  -- Milestones (stored as JSONB array)
  milestones JSONB NOT NULL DEFAULT '[]',

  -- Review Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'created')),

  -- Agent Analysis Results (stored when review completes)
  agent_analysis JSONB,

  -- Final approved values (may differ from original after negotiation)
  final_funding_goal DECIMAL,
  final_projected_apy DECIMAL,
  final_milestones JSONB,

  -- On-chain reference (set after project creation)
  project_id TEXT,
  tx_hash TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create salvation_conversations table for chat history
CREATE TABLE salvation_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES salvation_project_applications(id) ON DELETE CASCADE,

  -- Message details
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- Optional metadata (agent thoughts, analysis steps, etc.)
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster conversation lookups
CREATE INDEX idx_conversations_application_id ON salvation_conversations(application_id);
CREATE INDEX idx_applications_wallet ON salvation_project_applications(wallet_address);
CREATE INDEX idx_applications_status ON salvation_project_applications(status);

-- Disable RLS (using service role key)
ALTER TABLE salvation_project_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE salvation_conversations DISABLE ROW LEVEL SECURITY;

-- Create updated_at trigger for applications
CREATE TRIGGER salvation_project_applications_updated_at
  BEFORE UPDATE ON salvation_project_applications
  FOR EACH ROW
  EXECUTE FUNCTION salvation_update_updated_at();
