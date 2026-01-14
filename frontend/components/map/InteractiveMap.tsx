'use client';

import { useState } from 'react';
import MapComponent from './MapComponent';
import MapSidebar from './MapSidebar';
import { Project, MapFilter } from '@/types/project';

interface InteractiveMapProps {
  projects: Project[];
}

export default function InteractiveMap({ projects }: InteractiveMapProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MapFilter>({
    categories: [],
    countries: [],
    statuses: []
  });

  return (
    <div className="flex h-full w-full">
      <MapSidebar
        selectedProject={selectedProject}
        onProjectDeselect={() => setSelectedProject(null)}
        filters={filters}
        onFiltersChange={setFilters}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        projects={projects}
        onProjectSelect={setSelectedProject}
      />
      <div className="flex-1">
        <MapComponent
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={setSelectedProject}
          filters={filters}
        />
      </div>
    </div>
  );
}
