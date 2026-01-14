'use client';

import { useState } from 'react';
import { ProjectGrid, ProjectFilters, ProjectStats } from '@/components/projects';
import { useProjects } from '@/lib/contracts/hooks/useProjects';
import type { ProjectFilters as Filters } from '@/types';
import { Loader2 } from 'lucide-react';

export default function ProjectsPageContent() {
  const [filters, setFilters] = useState<Filters>({});
  const { data: projects, isLoading, error } = useProjects();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-neutral-400">Loading projects from blockchain...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">Error loading projects</p>
          <p className="text-neutral-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Infrastructure Projects</h1>
          <p className="text-neutral-400">
            Invest in verified African infrastructure projects and earn yield through bond tokens.
          </p>
        </div>

        {/* Stats Overview */}
        <ProjectStats projects={projects || []} />

        {/* Filters */}
        <ProjectFilters filters={filters} onFiltersChange={setFilters} />

        {/* Project Grid */}
        <ProjectGrid projects={projects || []} filters={filters} isLoading={false} />
      </div>
    </div>
  );
}
