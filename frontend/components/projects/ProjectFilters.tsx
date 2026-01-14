'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { ProjectCategory, ProjectStatus, ProjectFilters as Filters } from '@/types';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '@/types';

interface ProjectFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function ProjectFilters({ filters, onFiltersChange }: ProjectFiltersProps) {
  const categories: (ProjectCategory | 'all')[] = ['all', 'water', 'solar', 'education', 'healthcare', 'agriculture'];
  const statuses: (ProjectStatus | 'all')[] = ['all', 'funding', 'active', 'completed'];

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search projects..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
          className="pl-10 bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-orange-500"
        />
      </div>

      {/* Category Filter */}
      <Select
        value={filters.category || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            category: value === 'all' ? undefined : value as ProjectCategory,
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px] bg-neutral-900 border-neutral-800 text-white">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent className="bg-neutral-900 border-neutral-800">
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat} className="text-white hover:bg-neutral-800">
              {cat === 'all' ? 'All Categories' : `${CATEGORY_CONFIG[cat].icon} ${CATEGORY_CONFIG[cat].label}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            status: value === 'all' ? undefined : value as ProjectStatus,
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px] bg-neutral-900 border-neutral-800 text-white">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-neutral-900 border-neutral-800">
          {statuses.map((status) => (
            <SelectItem key={status} value={status} className="text-white hover:bg-neutral-800">
              {status === 'all' ? 'All Status' : STATUS_CONFIG[status].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
