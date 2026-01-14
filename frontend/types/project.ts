// Project types for Salvation frontend

export type ProjectCategory = 'water' | 'solar' | 'education' | 'healthcare' | 'agriculture';

export type ProjectStatus = 'pending' | 'funding' | 'active' | 'completed' | 'failed';

// Maps contract enum (0-4) to ProjectStatus
export const PROJECT_STATUS_MAP: Record<number, ProjectStatus> = {
  0: 'pending',
  1: 'funding',
  2: 'active',
  3: 'completed',
  4: 'failed',
};

export interface ProjectLocation {
  country: string;
  region: string;
  coordinates: [number, number];
}

export interface ProjectMetadata {
  name: string;
  description: string;
  category: ProjectCategory;
  location: ProjectLocation;
  imageUrl: string;
  revenueModel: string;
  projectedAPY: number;
}

export interface Milestone {
  index: number;
  description: string;
  targetDate: number;
  completed: boolean;
  completedAt?: number;
  evidenceURI?: string;
}

export interface Verification {
  projectId: string;
  milestoneIndex: number;
  verified: boolean;
  evidenceURI: string;
  dataSources: string[];
  confidence: number;
  timestamp: number;
}

// On-chain project data
export interface OnChainProject {
  id: `0x${string}`;
  metadataURI: string;
  sponsor: `0x${string}`;
  fundingGoal: bigint;
  fundingRaised: bigint;
  bondPrice: bigint;
  status: number;
  createdAt: bigint;
}

// Combined project data (on-chain + metadata)
export interface Project {
  id: string;
  name: string;
  description: string;
  metadataURI: string;
  sponsor: string;
  location: ProjectLocation;
  category: ProjectCategory;
  fundingGoal: number;
  fundingRaised: number;
  bondPrice: number;
  projectedAPY: number;
  status: ProjectStatus;
  bondTokenAddress?: string;
  marketAddress?: string;
  imageUrl: string;
  revenueModel: string;
  createdAt: number;
  milestones?: Milestone[];
}

// Category metadata for display
export const CATEGORY_CONFIG: Record<ProjectCategory, { color: string; icon: string; label: string }> = {
  water: { color: 'bg-blue-500', icon: '💧', label: 'Water' },
  solar: { color: 'bg-yellow-500', icon: '☀️', label: 'Solar' },
  education: { color: 'bg-purple-500', icon: '📚', label: 'Education' },
  healthcare: { color: 'bg-pink-500', icon: '🏥', label: 'Healthcare' },
  agriculture: { color: 'bg-green-500', icon: '🌱', label: 'Agriculture' },
};

export const STATUS_CONFIG: Record<ProjectStatus, { color: string; label: string }> = {
  pending: { color: 'bg-neutral-500', label: 'Pending' },
  funding: { color: 'bg-orange-500', label: 'Funding' },
  active: { color: 'bg-green-500', label: 'Active' },
  completed: { color: 'bg-blue-500', label: 'Completed' },
  failed: { color: 'bg-red-500', label: 'Failed' },
};

// Filter types
export interface ProjectFilters {
  category?: ProjectCategory;
  status?: ProjectStatus;
  search?: string;
}

// Map filter types for interactive map
export interface MapFilter {
  categories: ProjectCategory[];
  countries: string[];
  statuses: ProjectStatus[];
}

// Category colors for map markers
export const PROJECT_CATEGORY_COLORS: Record<ProjectCategory, string> = {
  water: '#3498DB',
  solar: '#F39C12',
  education: '#9B59B6',
  healthcare: '#E74C3C',
  agriculture: '#2ECC71',
};
