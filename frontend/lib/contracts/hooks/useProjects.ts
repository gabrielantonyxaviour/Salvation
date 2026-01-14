'use client';

import { useQuery } from '@tanstack/react-query';
import { subgraphClient } from '@/lib/subgraph/client';
import { GET_ALL_PROJECTS, GET_PROJECT } from '@/lib/subgraph/queries';
import type { Project, ProjectCategory, ProjectStatus, Milestone } from '@/types';

// Transform subgraph response to frontend type
function transformProject(raw: any): Project {
  const location = raw.location
    ? {
        country: raw.location.country || 'Unknown',
        region: raw.location.region || 'Unknown',
        coordinates: [
          raw.location.latitude ? parseFloat(raw.location.latitude) : 0,
          raw.location.longitude ? parseFloat(raw.location.longitude) : 0,
        ] as [number, number],
      }
    : { country: 'Unknown', region: 'Unknown', coordinates: [0, 0] as [number, number] };

  const milestones: Milestone[] = (raw.milestones || []).map((m: any) => ({
    index: Number(m.index),
    description: m.description || '',
    targetDate: Number(m.targetDate) * 1000,
    completed: m.completed || false,
    completedAt: m.completedAt ? Number(m.completedAt) * 1000 : undefined,
    evidenceURI: m.evidenceURI,
  }));

  return {
    id: raw.id,
    name: raw.name || `Project ${raw.id.slice(0, 8)}`,
    description: raw.description || 'Infrastructure project on Salvation platform.',
    metadataURI: raw.metadataURI,
    sponsor: raw.sponsor,
    location,
    category: (raw.category as ProjectCategory) || 'water',
    fundingGoal: Number(raw.fundingGoal) / 1e6, // USDC has 6 decimals
    fundingRaised: Number(raw.fundingRaised) / 1e6,
    bondPrice: Number(raw.bondPrice) / 1e6,
    projectedAPY: raw.projectedAPY ? Number(raw.projectedAPY) / 100 : 10, // Stored as basis points
    status: (raw.status as ProjectStatus) || 'pending',
    bondTokenAddress: raw.bondToken?.id,
    marketAddress: raw.market?.id,
    imageUrl: raw.imageUrl || '/images/projects/default.jpg',
    revenueModel: raw.revenueModel || '',
    createdAt: Number(raw.createdAt) * 1000,
    milestones,
  };
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      try {
        const data = await subgraphClient.request(GET_ALL_PROJECTS);
        const projects = (data as any).projects || [];
        return projects.map(transformProject);
      } catch (error) {
        console.error('Error fetching projects from subgraph:', error);
        return [];
      }
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<Project | null> => {
      try {
        const data = await subgraphClient.request(GET_PROJECT, { id: projectId });
        const project = (data as any).project;
        return project ? transformProject(project) : null;
      } catch (error) {
        console.error('Error fetching project from subgraph:', error);
        return null;
      }
    },
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
}
