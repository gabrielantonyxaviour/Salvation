'use client';

import { useMemo } from 'react';
import { ProjectCard } from './ProjectCard';
import type { Project, ProjectFilters } from '@/types';

interface ProjectGridProps {
  projects: Project[];
  filters: ProjectFilters;
  isLoading?: boolean;
}

export function ProjectGrid({ projects, filters, isLoading }: ProjectGridProps) {
  // Filter projects based on current filters
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Category filter
      if (filters.category && project.category !== filters.category) {
        return false;
      }

      // Status filter
      if (filters.status && project.status !== filters.status) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = project.name.toLowerCase().includes(searchLower);
        const matchesDescription = project.description.toLowerCase().includes(searchLower);
        const matchesLocation = project.location.country.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesDescription && !matchesLocation) {
          return false;
        }
      }

      return true;
    });
  }, [projects, filters]);

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden animate-pulse"
          >
            <div className="h-48 bg-neutral-800" />
            <div className="p-4 space-y-4">
              <div className="flex justify-between">
                <div className="h-6 w-16 bg-neutral-800 rounded" />
                <div className="h-6 w-20 bg-neutral-800 rounded" />
              </div>
              <div className="h-6 w-3/4 bg-neutral-800 rounded" />
              <div className="h-4 w-full bg-neutral-800 rounded" />
              <div className="h-2 w-full bg-neutral-800 rounded" />
              <div className="flex justify-between pt-2">
                <div className="h-6 w-20 bg-neutral-800 rounded" />
                <div className="h-6 w-24 bg-neutral-800 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredProjects.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-400 text-lg">No projects found matching your criteria.</p>
        <p className="text-neutral-600 text-sm mt-2">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProjects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
